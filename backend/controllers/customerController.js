
const Customer = require("../models/Customer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../config/mailer");

const DEFAULT_PHONE_COUNTRY_CODE =
  process.env.DEFAULT_PHONE_COUNTRY_CODE || "+91";

// =====================================
// PHONE NORMALIZATION
// =====================================

const normalizePhone = (value) => {
  let phone = String(value || "").trim();

  phone = phone.replace(/[\s()-]/g, "");

  if (phone.startsWith("00")) {
    phone = `+${phone.slice(2)}`;
  }

  if (phone.startsWith("+")) {
    return phone;
  }

  if (phone.startsWith("91") && phone.length === 12) {
    return `+${phone}`;
  }

  if (phone.length === 10) {
    return `${DEFAULT_PHONE_COUNTRY_CODE}${phone}`;
  }

  return phone;
};

// =====================================
// CLIENT ID GENERATION
// =====================================

const getNextClientId = async () => {
  const currentYear = new Date().getFullYear();

  const customers = await Customer.find({
    clientId: { $regex: /^IPS-\d{4}-\d+$/ },
  }).select("clientId");

  let highestNumber = 0;

  customers.forEach((customer) => {
    const match = String(customer.clientId || "").match(
      /^IPS-\d{4}-(\d+)$/
    );

    if (match) {
      const number = Number(match[1]);

      if (number > highestNumber) {
        highestNumber = number;
      }
    }
  });

  return `IPS-${currentYear}-${String(highestNumber + 1).padStart(3, "0")}`;
};

// =====================================
// ASSIGN MISSING CLIENT IDs
// =====================================

async function assignMissingClientIds() {
  const customers = await Customer.find({
    $or: [
      { clientId: { $exists: false } },
      { clientId: "" },
      { clientId: null },
    ],
  });

  for (const customer of customers) {
    customer.clientId = await getNextClientId();
    await customer.save();
  }

  return customers.length;
}

// =====================================
// SANITIZE CUSTOMER
// Remove sensitive fields before sending data
// =====================================

const sanitizeCustomer = (customer) => {
  const data = customer.toObject
    ? customer.toObject()
    : { ...customer };

  delete data.password;

  delete data.resetOtpHash;
  delete data.resetOtpExpires;
  delete data.resetOtpAttempts;
  delete data.resetOtpVerified;
  delete data.resetOtpRequestedAt;
  delete data.resetOtpChannel;
  delete data.resetTokenHash;
  delete data.resetTokenExpires;

  return data;
};

// =====================================
// GENERATE JWT TOKEN
// =====================================

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (customer) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from environment variables.");
  }

  return jwt.sign(
    {
      id: customer._id.toString(),
      type: "customer",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// =====================================
// REGISTER CUSTOMER
// =====================================

const registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = normalizePhone(phone);

    const existingCustomer = await Customer.findOne({
      $or: [
        { email: cleanEmail },
        { phone: cleanPhone },
      ],
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "A customer with this email or phone already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const clientId = await getNextClientId();

    const customer = await Customer.create({
      clientId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,

      project: {
        name: "No project assigned",
        type: "Photography",
        eventDate: "",
        status: "NOT STARTED",
        progress: 0,
      },

      payment: {
        total: 0,
        paid: 0,
        balance: 0,
        history: [],
      },

      documents: [],
      clientSince: new Date(),
    });

    const customerResponse = sanitizeCustomer(customer);

    return res.status(201).json({
      success: true,
      message: "Customer added successfully.",
      customerId: customer._id.toString(),
      clientId: customer.clientId,
      customer: customerResponse,
    });
  } catch (error) {
    console.error("CUSTOMER REGISTER ERROR:", error);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message: `A customer with this ${duplicateField || "information"} already exists.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create customer.",
    });
  }
};

// =====================================
// CUSTOMER LOGIN
// Email / Phone + Password
// =====================================

const loginCustomer = async (req, res) => {
  try {
    const { loginValue, email, phone, password } = req.body;

    const value = loginValue || email || phone;

    if (!value || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/phone and password are required.",
      });
    }

    const searchValue = String(value).trim();
    const normalizedEmail = searchValue.toLowerCase();
    const normalizedPhone = normalizePhone(searchValue);

    let customer = await Customer.findOne({
      email: normalizedEmail,
    });

    if (!customer) {
      customer = await Customer.findOne({
        phone: searchValue,
      });
    }

    if (!customer && normalizedPhone) {
      customer = await Customer.findOne({
        phone: normalizedPhone,
      });
    }

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/phone or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      String(password),
      customer.password || ""
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/phone or password.",
      });
    }

    const token = generateToken(customer);

    return res.status(200).json({
      success: true,
      message: "Customer login successful.",
      token,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("CUSTOMER LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
};

// =====================================
// GET ALL CUSTOMERS
// =====================================

const getAllCustomers = async (req, res) => {
  try {
    await assignMissingClientIds();

    const customers = await Customer.find({})
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      customers: customers.map(sanitizeCustomer),
    });
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers.",
    });
  }
};

// =====================================
// GET CUSTOMER BY ID
// =====================================

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("GET CUSTOMER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customer.",
    });
  }
};

// =====================================
// UPDATE CUSTOMER
// =====================================

const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (name !== undefined) {
      customer.name = String(name).trim();
    }

    if (email !== undefined) {
      customer.email = String(email).trim().toLowerCase();
    }

    if (phone !== undefined) {
      customer.phone = normalizePhone(phone);
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully.",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone number already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update customer.",
    });
  }
};

// =====================================
// DELETE CUSTOMER
// =====================================

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE CUSTOMER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete customer.",
    });
  }
};

// =====================================
// UPDATE PROJECT
// =====================================

const updateProject = async (req, res) => {
  try {
    const { name, type, eventDate, status, progress } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (name !== undefined) {
      customer.project.name = name;
    }

    if (type !== undefined) {
      customer.project.type = type;
    }

    if (eventDate !== undefined) {
      customer.project.eventDate = eventDate;
    }

    if (status !== undefined) {
      customer.project.status = status;
    }

    if (progress !== undefined) {
      const value = Number(progress);

      if (!Number.isFinite(value) || value < 0 || value > 100) {
        return res.status(400).json({
          success: false,
          message: "Progress must be between 0 and 100.",
        });
      }

      customer.project.progress = value;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("UPDATE PROJECT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update project.",
    });
  }
};

// =====================================
// UPDATE PAYMENT
// =====================================

const updatePayment = async (req, res) => {
  try {
    const { total, paid } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (total !== undefined) {
      customer.payment.total = Number(total);
    }

    if (paid !== undefined) {
      customer.payment.paid = Number(paid);
    }

    const totalAmount = Number(customer.payment.total);
    const paidAmount = Number(customer.payment.paid);

    if (
      !Number.isFinite(totalAmount) ||
      !Number.isFinite(paidAmount) ||
      totalAmount < 0 ||
      paidAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount.",
      });
    }

    customer.payment.balance = Math.max(
      totalAmount - paidAmount,
      0
    );

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully.",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("UPDATE PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update payment.",
    });
  }
};

// =====================================
// ADD PAYMENT
// =====================================

const addPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid payment amount.",
      });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    customer.payment.paid =
      Number(customer.payment.paid || 0) + paymentAmount;

    customer.payment.balance = Math.max(
      Number(customer.payment.total || 0) -
        customer.payment.paid,
      0
    );

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Payment added successfully.",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("ADD PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add payment.",
    });
  }
};

// =====================================
// DELETE CUSTOMER DOCUMENT
// =====================================

const deleteDocument = async (req, res) => {
  try {
    const { customerId, documentId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (!Array.isArray(customer.documents)) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    const document =
      typeof customer.documents.id === "function"
        ? customer.documents.id(documentId)
        : customer.documents.find(
            (item) =>
              String(item._id || item.id) === String(documentId)
          );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    if (typeof customer.documents.pull === "function") {
      customer.documents.pull(documentId);
    } else {
      customer.documents = customer.documents.filter(
        (item) =>
          String(item._id || item.id) !== String(documentId)
      );
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Document record deleted successfully.",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("DELETE CUSTOMER DOCUMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete document.",
    });
  }
};

/* =========================================================
   CUSTOMER PASSWORD RESET HELPERS
========================================================= */

function findCustomerByResetValue(value) {
  const trimmed = String(value || "").trim();

  return Customer.findOne({
    email: trimmed.toLowerCase(),
  });
}

function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");
}

function createResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashResetToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");
}

async function sendPasswordResetEmail(customer, otp) {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: customer.email,
    subject: "Infinity Pixel Studios - Password Reset OTP",
    text: `Hello ${customer.name},

Your password reset OTP is ${otp}.

This OTP expires in 10 minutes.

If you did not request this, please ignore this email.

Infinity Pixel Studios`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Infinity Pixel Studios</h2>
        <p>Hello ${customer.name},</p>
        <p>Your password reset OTP is:</p>
        <h1 style="letter-spacing:8px">${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
}

/* =========================================================
   FORGOT PASSWORD
========================================================= */

const forgotPassword = async (req, res) => {
  try {
    const { loginValue } = req.body;

    if (!loginValue || !String(loginValue).trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address.",
      });
    }

    const value = String(loginValue).trim();

    if (!value.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const customer = await findCustomerByResetValue(value);

    if (!customer) {
      return res.json({
        success: true,
        message: "If an account exists, a password reset OTP has been generated.",
      });
    }

    if (customer.resetOtpRequestedAt) {
      const secondsSinceLastRequest =
        (Date.now() - new Date(customer.resetOtpRequestedAt).getTime()) / 1000;

      if (secondsSinceLastRequest < 60) {
        const retryAfter = Math.ceil(60 - secondsSinceLastRequest);

        return res.status(429).json({
          success: false,
          message: `Please wait ${retryAfter} seconds before requesting another OTP.`,
        });
      }
    }

    const otp = String(crypto.randomInt(100000, 1000000));

    customer.resetOtpHash = hashOtp(otp);
    customer.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    customer.resetOtpAttempts = 0;
    customer.resetOtpRequestedAt = new Date();
    customer.resetOtpChannel = "email";
    customer.resetTokenHash = "";
    customer.resetTokenExpires = null;

    await customer.save();

    await sendPasswordResetEmail(customer, otp);

    return res.json({
      success: true,
      message: "If an account exists, a password reset OTP has been generated for email.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request.",
    });
  }
};

/* =========================================================
   VERIFY RESET OTP
========================================================= */

const verifyResetOtp = async (req, res) => {
  try {
    const { loginValue, otp } = req.body;

    if (!loginValue || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email address and OTP are required.",
      });
    }

    const customer = await findCustomerByResetValue(loginValue);

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    if (customer.resetOtpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }

    if (
      !customer.resetOtpHash ||
      !customer.resetOtpExpires ||
      new Date(customer.resetOtpExpires).getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    const submittedHash = hashOtp(String(otp).trim());
    const storedHash = customer.resetOtpHash;

    const hashesMatch =
      typeof storedHash === "string" &&
      /^[a-f0-9]{64}$/i.test(storedHash) &&
      crypto.timingSafeEqual(
        Buffer.from(submittedHash, "hex"),
        Buffer.from(storedHash, "hex")
      );

    if (!hashesMatch) {
      customer.resetOtpAttempts += 1;
      await customer.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    const resetToken = createResetToken();

    customer.resetTokenHash = hashResetToken(resetToken);
    customer.resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    customer.resetOtpHash = "";
    customer.resetOtpExpires = null;
    customer.resetOtpAttempts = 0;

    await customer.save();

    return res.json({
      success: true,
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("VERIFY RESET OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP.",
    });
  }
};

/* =========================================================
   RESET PASSWORD
========================================================= */

const resetPassword = async (req, res) => {
  try {
    const { loginValue, resetToken, newPassword } = req.body;

    if (!loginValue || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email address, reset token and new password are required.",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });
    }

    const customer = await findCustomerByResetValue(loginValue);

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset request.",
      });
    }

    if (!customer.resetTokenHash || !customer.resetTokenExpires) {
      return res.status(400).json({
        success: false,
        message: "Password reset session is invalid or expired.",
      });
    }

    if (new Date(customer.resetTokenExpires).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Password reset session has expired. Please request a new OTP.",
      });
    }

    const submittedTokenHash = hashResetToken(resetToken);
    const storedTokenHash = customer.resetTokenHash;

    const tokenMatches =
      typeof storedTokenHash === "string" &&
      /^[a-f0-9]{64}$/i.test(storedTokenHash) &&
      crypto.timingSafeEqual(
        Buffer.from(submittedTokenHash, "hex"),
        Buffer.from(storedTokenHash, "hex")
      );

    if (!tokenMatches) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset token.",
      });
    }

    customer.password = await bcrypt.hash(newPassword, 10);

    customer.resetOtpHash = "";
    customer.resetOtpExpires = null;
    customer.resetOtpAttempts = 0;
    customer.resetOtpRequestedAt = null;
    customer.resetOtpChannel = "";
    customer.resetTokenHash = "";
    customer.resetTokenExpires = null;

    await customer.save();

    return res.json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  }
};

// =====================================
// CUSTOMER DASHBOARD - VIEW PROFILE
// =====================================

const getMyProfile = async (req, res) => {
  try {
    if (String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own profile.",
      });
    }

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.json({
      success: true,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("CUSTOMER PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile.",
    });
  }
};

// =====================================
// CUSTOMER DASHBOARD - VIEW PROJECT
// =====================================

const getMyProject = async (req, res) => {
  try {
    if (String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own project.",
      });
    }

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.json({
      success: true,
      project: customer.project || {},
    });
  } catch (error) {
    console.error("CUSTOMER PROJECT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch project details.",
    });
  }
};

// =====================================
// CUSTOMER DASHBOARD - VIEW PAYMENT
// =====================================

const getMyPayment = async (req, res) => {
  try {
    if (String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own payment details.",
      });
    }

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.json({
      success: true,
      payment: customer.payment || {},
    });
  } catch (error) {
    console.error("CUSTOMER PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment details.",
    });
  }
};

// =====================================
// CUSTOMER DASHBOARD - VIEW DOCUMENTS
// =====================================

const getMyDocuments = async (req, res) => {
  try {
    if (String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own documents.",
      });
    }

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.json({
      success: true,
      documents: customer.documents || [],
    });
  } catch (error) {
    console.error("CUSTOMER DOCUMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch documents.",
    });
  }
};

// =====================================
// EXPORT CONTROLLERS
// =====================================

module.exports = {
  registerCustomer,
  loginCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  updateProject,
  updatePayment,
  addPayment,
  deleteDocument,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getMyProfile,
  getMyProject,
  getMyPayment,
  getMyDocuments,
};

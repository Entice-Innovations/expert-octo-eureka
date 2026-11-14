
const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
const Enquiry = require("../models/Enquiry");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

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

const calculatePayment = (customer) => {
  const total = Number(customer.payment?.total || 0);
  const paid = Number(customer.payment?.paid || 0);

  customer.payment.balance = Math.max(total - paid, 0);
};

const getNextClientId = async () => {
  const year = new Date().getFullYear();

  const customers = await Customer.find({
    clientId: { $regex: /^IPS-\d{4}-\d+$/ },
  }).select("clientId");

  let highestNumber = 0;

  customers.forEach((customer) => {
    const parts = customer.clientId.split("-");
    const number = Number(parts[2]);

    if (Number.isFinite(number)) {
      highestNumber = Math.max(highestNumber, number);
    }
  });

  return `IPS-${year}-${String(highestNumber + 1).padStart(3, "0")}`;
};

const assignMissingClientIds = async () => {
  const customers = await Customer.find({
    $or: [
      { clientId: { $exists: false } },
      { clientId: null },
      { clientId: "" },
    ],
  });

  for (const customer of customers) {
    customer.clientId = await getNextClientId();
    await customer.save();
  }
};

// ==========================================
// ADMIN LOGIN
// ==========================================

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is missing from environment variables.");

      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id.toString(),
        type: "admin",
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // SEND TOKEN TO FRONTEND
    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during admin login",
    });
  }
};

// ==========================================
// GET ALL CUSTOMERS
// ==========================================

const getAllCustomers = async (req, res) => {
  try {
    await assignMissingClientIds();

    const customers = await Customer.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers: customers.map(sanitizeCustomer),
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

// ==========================================
// GET CUSTOMER BY ID
// ==========================================

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
};

// ==========================================
// ADD CUSTOMER
// ==========================================

const addCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      project,
      payment,
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = String(phone).replace(/\D/g, "");

    const existingCustomer = await Customer.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer email or phone already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = new Customer({
      clientId: await getNextClientId(),
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      project: {
        name: project?.name || "No project assigned",
        type: project?.type || "Photography",
        eventDate: project?.eventDate || null,
        status: project?.status || "NOT STARTED",
        progress: project?.progress || 0,
      },
      payment: {
        total: Number(payment?.total || 0),
        paid: Number(payment?.paid || 0),
        balance: 0,
        history: [],
      },
      documents: [],
      clientSince: new Date(),
    });

    calculatePayment(customer);

    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Customer added successfully",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Add customer error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Customer email, phone or client ID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add customer",
    });
  }
};

// ==========================================
// UPDATE CUSTOMER
// ==========================================

const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (name !== undefined) {
      customer.name = name.trim();
    }

    if (email !== undefined) {
      customer.email = email.trim().toLowerCase();
    }

    if (phone !== undefined) {
      customer.phone = String(phone).replace(/\D/g, "");
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Update customer error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

// ==========================================
// DELETE CUSTOMER
// ==========================================

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};

// ==========================================
// UPDATE CUSTOMER PROJECT
// ==========================================

const updateProject = async (req, res) => {
  try {
    const {
      name,
      type,
      eventDate,
      status,
      progress,
    } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (progress !== undefined) {
      const value = Number(progress);

      if (!Number.isFinite(value) || value < 0 || value > 100) {
        return res.status(400).json({
          success: false,
          message: "Progress must be between 0 and 100",
        });
      }

      customer.project.progress = value;
    }

    if (name !== undefined) customer.project.name = name;
    if (type !== undefined) customer.project.type = type;
    if (eventDate !== undefined) customer.project.eventDate = eventDate;
    if (status !== undefined) customer.project.status = status;

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Update project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
};

// ==========================================
// UPDATE CUSTOMER PAYMENT DETAILS
// ==========================================

const updatePayment = async (req, res) => {
  try {
    const { total, paid } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (total !== undefined) {
      const value = Number(total);

      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Total amount must be non-negative",
        });
      }

      customer.payment.total = value;
    }

    if (paid !== undefined) {
      const value = Number(paid);

      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Paid amount must be non-negative",
        });
      }

      customer.payment.paid = value;
    }

    calculatePayment(customer);

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Payment details updated successfully",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Update payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update payment details",
    });
  }
};

// ==========================================
// ADD CUSTOMER PAYMENT
// ==========================================

const addPayment = async (req, res) => {
  try {
    const { amount, method, reference, note } = req.body;

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid payment amount",
      });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.payment.paid =
      Number(customer.payment.paid || 0) + value;

    calculatePayment(customer);

    customer.payment.history.push({
      amount: value,
      date: new Date(),
      method: method || "Manual",
      reference: reference || "",
      status: "SUCCESS",
      note: note || "",
    });

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Add payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to record payment",
    });
  }
};

// ==========================================
// DELETE CUSTOMER DOCUMENT RECORD
// ==========================================

const deleteDocument = async (req, res) => {
  try {
    const { customerId, documentId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const document = customer.documents.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    document.deleteOne();

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Document removed successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
};

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

const getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();

    const customers = await Customer.find()
      .select("payment project.status");

    const totalRevenue = customers.reduce(
      (sum, customer) =>
        sum + Number(customer.payment?.paid || 0),
      0
    );

    const totalPending = customers.reduce(
      (sum, customer) =>
        sum + Number(customer.payment?.balance || 0),
      0
    );

    const activeProjects = customers.filter(
      (customer) =>
        customer.project?.status &&
        !["COMPLETED", "CANCELLED"].includes(
          String(customer.project.status).toUpperCase()
        )
    ).length;

    return res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalRevenue,
        totalPending,
        activeProjects,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

// ==========================================
// GET ALL ENQUIRIES
// ==========================================

const getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      enquiries,
    });
  } catch (error) {
    console.error("Get enquiries error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
    });
  }
};

// ==========================================
// UPDATE ENQUIRY STATUS
// ==========================================

const updateEnquiry = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Enquiry status is required",
      });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      enquiry,
    });
  } catch (error) {
    console.error("Update enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update enquiry",
    });
  }
};

// ==========================================
// UPLOAD CUSTOMER DOCUMENT
// ==========================================

const uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a document to upload",
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.documents.push({
      name: req.file.originalname,
      url: `/uploads/documents/${req.file.filename}`,
      type: req.file.mimetype,
      uploadedAt: new Date(),
    });

    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      documents: customer.documents,
    });
  } catch (error) {
    console.error("Document upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload document",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  loginAdmin,
  getAllCustomers,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  updateProject,
  updatePayment,
  addPayment,
  deleteDocument,
  getDashboardStats,
  getAllEnquiries,
  updateEnquiry,
  uploadDocument,
};

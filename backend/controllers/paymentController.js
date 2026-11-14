
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Customer = require("../models/Customer");
const PaymentOrder = require("../models/PaymentOrder");

// ==========================================
// RAZORPAY CONFIGURATION
// ==========================================

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// ==========================================
// SANITIZE CUSTOMER
// ==========================================

const sanitizeCustomer = (customer) => {
  const data = customer.toObject();

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

// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================

const createRazorpayOrder = async (req, res) => {
  try {
    if (req.user?.type !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Customer access required",
      });
    }

    const amount = Number(req.body.amount);

    if (
      !Number.isFinite(amount) ||
      amount < 1 ||
      Math.round(amount * 100) !== amount * 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid payment amount",
      });
    }

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const total = Number(customer.payment?.total || 0);
    const paid = Number(customer.payment?.paid || 0);
    const balance = Math.max(0, total - paid);

    if (balance < 1) {
      return res.status(400).json({
        success: false,
        message: "No pending payment balance",
      });
    }

    if (amount > balance) {
      return res.status(400).json({
        success: false,
        message: "Payment amount exceeds pending balance",
      });
    }

    const razorpay = getRazorpay();
    const amountPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `ips${Date.now()}`,
      notes: {
        customerId: customer._id.toString(),
        clientId: customer.clientId || "",
      },
    });

    await PaymentOrder.create({
      customerId: customer._id,
      razorpayOrderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      status: "CREATED",
    });

    return res.status(201).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error("Razorpay order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
};

// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================

const verifyRazorpayPayment = async (req, res) => {
  let session;

  try {
    if (req.user?.type !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Customer access required",
      });
    }

    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string" ||
      !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification details",
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway is not configured",
      });
    }

    // Verify Razorpay signature.
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Find order belonging to this customer.
    const paymentOrder = await PaymentOrder.findOne({
      razorpayOrderId: orderId,
      customerId: req.user.id,
    });

    if (!paymentOrder) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    // Handle an already recorded payment.
    if (paymentOrder.status === "PAID") {
      if (paymentOrder.paymentId !== paymentId) {
        return res.status(409).json({
          success: false,
          message: "This order has already been paid",
        });
      }

      const existingCustomer = await Customer.findById(req.user.id);

      if (!existingCustomer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        message: "Payment already recorded",
        customer: sanitizeCustomer(existingCustomer),
      });
    }

    if (paymentOrder.status !== "CREATED") {
      return res.status(400).json({
        success: false,
        message: "This payment order cannot be processed",
      });
    }

    const razorpay = getRazorpay();

    // Verify order directly with Razorpay.
    const razorpayOrder = await razorpay.orders.fetch(orderId);

    if (
      razorpayOrder.id !== orderId ||
      razorpayOrder.notes?.customerId !== req.user.id ||
      razorpayOrder.amount !== paymentOrder.amountPaise ||
      razorpayOrder.currency !== paymentOrder.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment order details do not match",
      });
    }

    // Verify payment directly with Razorpay.
    let payment = await razorpay.payments.fetch(paymentId);

    if (
      payment.order_id !== orderId ||
      payment.amount !== paymentOrder.amountPaise ||
      payment.currency !== paymentOrder.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match",
      });
    }

    // Capture authorized payment.
    if (payment.status === "authorized") {
      payment = await razorpay.payments.capture(
        paymentId,
        payment.amount,
        payment.currency
      );
    }

    if (payment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been captured",
      });
    }

    const paymentAmount = payment.amount / 100;

    // ==========================================
    // DATABASE TRANSACTION
    // ==========================================

    const mongoose = require("mongoose");

    session = await mongoose.startSession();

    let updatedCustomer;

    await session.withTransaction(async () => {
      // Recheck order status inside transaction.
      const currentOrder = await PaymentOrder.findOne({
        _id: paymentOrder._id,
        customerId: req.user.id,
        status: "CREATED",
      }).session(session);

      if (!currentOrder) {
        throw new Error("ORDER_ALREADY_PROCESSED");
      }

      // Prevent payment ID reuse.
      const duplicatePayment = await PaymentOrder.findOne({
        paymentId: paymentId,
      }).session(session);

      if (duplicatePayment) {
        throw new Error("PAYMENT_ALREADY_USED");
      }

      // Read current customer balance.
      const customer = await Customer.findById(req.user.id).session(session);

      if (!customer) {
        throw new Error("CUSTOMER_NOT_FOUND");
      }

      const total = Number(customer.payment?.total || 0);
      const paid = Number(customer.payment?.paid || 0);
      const balance = Math.max(0, total - paid);

      // Recheck available balance.
      if (paymentAmount > balance + 0.001) {
        throw new Error("PAYMENT_EXCEEDS_BALANCE");
      }

      // Record payment and update balance.
      customer.payment.paid = paid + paymentAmount;
      customer.payment.balance = Math.max(
        0,
        total - customer.payment.paid
      );

      customer.payment.history.push({
        amount: paymentAmount,
        date: new Date(),
        method: "Razorpay",
        reference: paymentId,
        status: "PAID",
        note: "Online payment",
      });

      await customer.save({ session });

      // Mark order as paid.
      currentOrder.status = "PAID";
      currentOrder.paymentId = paymentId;

      await currentOrder.save({ session });

      updatedCustomer = customer;
    });

    return res.json({
      success: true,
      message: "Payment verified and recorded successfully",
      customer: sanitizeCustomer(updatedCustomer),
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);

    if (error.message === "ORDER_ALREADY_PROCESSED") {
      return res.status(409).json({
        success: false,
        message: "This payment order has already been processed",
      });
    }

    if (error.message === "PAYMENT_ALREADY_USED") {
      return res.status(409).json({
        success: false,
        message: "This payment has already been used",
      });
    }

    if (error.message === "CUSTOMER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (error.message === "PAYMENT_EXCEEDS_BALANCE") {
      return res.status(409).json({
        success: false,
        message: "Payment exceeds the remaining balance",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};

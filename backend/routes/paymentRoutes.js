
const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const { authenticateToken } = require("../middleware/authMiddleware");

// ==========================================
// RAZORPAY PAYMENT ROUTES
// ==========================================

// Create Razorpay order
router.post(
  "/razorpay/order",
  authenticateToken,
  paymentController.createRazorpayOrder
);

// Verify Razorpay payment
router.post(
  "/razorpay/verify",
  authenticateToken,
  paymentController.verifyRazorpayPayment
);

module.exports = router;


const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");

const {
  authenticateToken,
  requireCustomer,
} = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Customer login
router.post("/login", customerController.loginCustomer);

// Forgot password
router.post("/forgot-password", customerController.forgotPassword);

router.post("/verify-reset-otp", customerController.verifyResetOtp);

router.post("/reset-password", customerController.resetPassword);

// ==========================================
// PROTECT ALL CUSTOMER DASHBOARD ROUTES
// ==========================================

router.use(authenticateToken, requireCustomer);

// ==========================================
// CUSTOMER DASHBOARD - VIEW ONLY
// ==========================================

// Complete customer details
router.get("/:id", customerController.getMyProfile);

// Customer profile
router.get("/:id/profile", customerController.getMyProfile);

// Project details
router.get("/:id/project", customerController.getMyProject);

// Payment details
router.get("/:id/payment", customerController.getMyPayment);

// Documents
router.get("/:id/documents", customerController.getMyDocuments);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;

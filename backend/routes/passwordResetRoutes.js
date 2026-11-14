
const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");

// CUSTOMER PASSWORD RESET

router.post(
  "/forgot-password",
  customerController.forgotPassword
);

router.post(
  "/verify-reset-otp",
  customerController.verifyResetOtp
);

router.post(
  "/reset-password",
  customerController.resetPassword
);

module.exports = router;

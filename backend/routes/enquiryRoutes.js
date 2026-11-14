
const express = require("express");
const router = express.Router();

const enquiryController = require("../controllers/enquiryController");

// ==========================================
// SUBMIT ENQUIRY (PUBLIC)
// ==========================================

router.post("/", enquiryController.submitEnquiry);

module.exports = router;

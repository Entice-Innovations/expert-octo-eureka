
const Enquiry = require("../models/Enquiry");

// ==========================================
// SUBMIT ENQUIRY (PUBLIC)
// ==========================================

const submitEnquiry = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      eventType,
      eventDate,
      message,
    } = req.body;

    const enquiry = await Enquiry.create({
      name,
      phone,
      email,
      eventType,
      eventDate: eventDate || null,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      enquiry,
    });
  } catch (error) {
    console.error("Enquiry submission error:", error);

    return res.status(400).json({
      success: false,
      message: "Failed to submit enquiry",
      error: error.message,
    });
  }
};

module.exports = {
  submitEnquiry,
};


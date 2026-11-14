const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: 25,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: "",
    },

    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: [
        "Wedding Photography",
        "Engagement",
        "Baby Photography",
        "Maternity Photography",
        "Portrait Photography",
        "Event Photography",
        "Other",
      ],
    },

    eventDate: {
      type: Date,
      default: null,
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: 3000,
    },

    status: {
      type: String,
      enum: ["New", "Contacted", "Follow-up", "Booked", "Closed"],
      default: "New",
    },

    internalNotes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 3000,
    },
  },
  {
    timestamps: true,
  }
);

const Enquiry =
  mongoose.models.Enquiry ||
  mongoose.model("Enquiry", enquirySchema);

module.exports = Enquiry;
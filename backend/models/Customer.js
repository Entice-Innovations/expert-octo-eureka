
const mongoose = require("mongoose");

// ==========================================
// PAYMENT HISTORY SUB-SCHEMA
// ==========================================

const paymentHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      default: "Cash",
    },
    reference: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "PAID",
    },
    note: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

// ==========================================
// CUSTOMER DOCUMENT SUB-SCHEMA
// ==========================================

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "PDF",
    },
    status: {
      type: String,
      default: "APPROVED",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ==========================================
// CUSTOMER SCHEMA
// ==========================================

const customerSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: function () {
        return this.authProvider !== "google";
      },
      unique: true,
      sparse: true,
      trim: true,
      default: undefined,
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider !== "google";
      },
      default: undefined,
    },

    // GOOGLE AUTHENTICATION
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    // EMAIL PASSWORD RESET
    resetOtpHash: {
      type: String,
      default: "",
    },

    resetOtpExpires: {
      type: Date,
      default: null,
    },

    resetOtpAttempts: {
      type: Number,
      default: 0,
    },

    resetOtpVerified: {
      type: Boolean,
      default: false,
    },

    resetOtpRequestedAt: {
      type: Date,
      default: null,
    },

    resetOtpChannel: {
      type: String,
      default: "",
    },

    resetTokenHash: {
      type: String,
      default: "",
    },

    resetTokenExpires: {
      type: Date,
      default: null,
    },

    // CUSTOMER PROJECT
    project: {
      name: {
        type: String,
        default: "No project assigned",
      },
      type: {
        type: String,
        default: "Photography",
      },
      eventDate: {
        type: String,
        default: "",
      },
      status: {
        type: String,
        default: "NOT STARTED",
      },
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    // CUSTOMER PAYMENT
    payment: {
      total: {
        type: Number,
        default: 0,
      },
      paid: {
        type: Number,
        default: 0,
      },
      balance: {
        type: Number,
        default: 0,
      },
      history: {
        type: [paymentHistorySchema],
        default: [],
      },
    },

    // CUSTOMER DOCUMENTS
    documents: {
      type: [documentSchema],
      default: [],
    },

    clientSince: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Customer =
  mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);

module.exports = Customer;

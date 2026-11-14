
const mongoose = require("mongoose");

const paymentOrderSchema = new mongoose.Schema(
  {
    // CUSTOMER WHO CREATED THE PAYMENT ORDER
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    // RAZORPAY ORDER DETAILS
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    amountPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Payment amount must be a valid integer",
      },
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      required: true,
    },

    // PAYMENT STATUS
    status: {
      type: String,
      enum: ["CREATED", "PAID"],
      default: "CREATED",
    },

    // RAZORPAY PAYMENT DETAILS
    paymentId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent one Razorpay payment ID from being linked
// to multiple payment orders.
paymentOrderSchema.index(
  { paymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      paymentId: { $type: "string", $gt: "" },
    },
  }
);

// Efficient customer payment-order lookups.
paymentOrderSchema.index({
  customerId: 1,
  status: 1,
});

const PaymentOrder =
  mongoose.models.PaymentOrder ||
  mongoose.model("PaymentOrder", paymentOrderSchema);

module.exports = PaymentOrder;

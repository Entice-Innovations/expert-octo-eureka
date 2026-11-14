
const dns = require("dns");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");

// DNS configuration
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Load environment variables before importing routes
require("dotenv").config();

// Import route files
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");

const app = express();

// ==========================================
// CONFIGURATION
// ==========================================

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Read frontend URLs from .env
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : [];

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an origin (Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// JSON middleware
app.use(
  express.json({
    limit: "10mb",
  })
);

// URL encoded middleware
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ==========================================
// STATIC FILES
// ==========================================

// Allow access to uploaded customer documents
const uploadsDirectory = path.join(__dirname, "uploads");

app.use("/uploads", express.static(uploadsDirectory));

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Infinity Pixel Studios backend is running.",
  });
});

// ==========================================
// API ROUTES
// ==========================================

// Admin management
app.use("/api/admin", adminRoutes);

// Customer registration, login and dashboard
app.use("/api/customers", customerRoutes);

// Customer password reset (email OTP)
app.use("/api/customers", passwordResetRoutes);

// Razorpay payments
app.use("/api/payments", paymentRoutes);

// Public customer enquiries
app.use("/api/enquiries", enquiryRoutes);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
  console.error("GLOBAL ERROR:", error.message);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.message || "File upload error.",
    });
  }

  return res.status(error.status || 500).json({
    success: false,
    message: error.status && error.status < 500
      ? error.message
      : "Internal server error.",
  });
});

// ==========================================
// DATABASE CONNECTION & SERVER START
// ==========================================

const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file.");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Infinity Pixel Studios backend is ready.");
    });
  } catch (error) {
    console.error("SERVER STARTUP ERROR:", error.message);
    process.exit(1);
  }
};

startServer();

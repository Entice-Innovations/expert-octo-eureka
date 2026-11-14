
const jwt = require("jsonwebtoken");

// ==========================================
// AUTHENTICATE TOKEN
// ==========================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("JWT ERROR: Authorization header missing");

    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authHeader.slice(7).trim();
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    console.error("JWT_SECRET is missing");

    return res.status(500).json({
      success: false,
      message: "Server configuration error",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    console.log("JWT verification successful");
    console.log("Token type:", decoded.type);

    req.user = decoded;
    next();

  } catch (error) {
    console.log("JWT verification failed:", error.name);
    console.log("JWT error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

// ==========================================
// REQUIRE ADMIN
// ==========================================

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.type !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

// ==========================================
// REQUIRE CUSTOMER
// ==========================================

const requireCustomer = (req, res, next) => {
  if (!req.user || req.user.type !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Customer access required",
    });
  }

  next();
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCustomer,
};

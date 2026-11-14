
const express = require("express");
const router = express.Router();
const  upload  = require("../middleware/uploadMiddleware");
const adminController = require("../controllers/adminController");

const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// ==========================================
// ADMIN LOGIN (PUBLIC)
// ==========================================

router.post("/login", adminController.loginAdmin);

// ==========================================
// PROTECT ALL ROUTES BELOW THIS LINE
// ==========================================

router.use(authenticateToken, requireAdmin);

// ==========================================
// CUSTOMER MANAGEMENT
// ==========================================

router.get("/customers", adminController.getAllCustomers);
router.get("/customers/:id", adminController.getCustomerById);
router.post("/customers", adminController.addCustomer);
router.put("/customers/:id", adminController.updateCustomer);
router.delete("/customers/:id", adminController.deleteCustomer);

// ==========================================
// PROJECT MANAGEMENT
// ==========================================

router.put(
  "/customers/:id/project",
  adminController.updateProject
);

// ==========================================
// PAYMENT MANAGEMENT
// ==========================================

router.put(
  "/customers/:id/payment",
  adminController.updatePayment
);

router.post(
  "/customers/:id/payment",
  adminController.addPayment
);
// ==========================================
// DOCUMENT MANAGEMENT
// ==========================================

router.post(
  "/customers/:id/documents",
  upload.single("document"),
  adminController.uploadDocument
);

router.delete(
  "/customers/:customerId/documents/:documentId",
  adminController.deleteDocument
);
// ==========================================
// DASHBOARD STATISTICS
// ==========================================

router.get("/stats", adminController.getDashboardStats);

// ==========================================
// ENQUIRY MANAGEMENT
// ==========================================

router.get("/enquiries", adminController.getAllEnquiries);

router.patch(
  "/enquiries/:id",
  adminController.updateEnquiry
);

module.exports = router;

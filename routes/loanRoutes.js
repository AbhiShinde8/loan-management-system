const express = require("express");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");
const {
  loanValidationSchema,
  updateLoanStatusSchema,
} = require("../middleware/validationSchema");
const {
  disburseLoan,
  getAllLoans,
  getLoanById,
  getLoansByCustomerId,
  updateLoanStatus,
  getLoanStats,
  getEmiSchedule,
} = require("../controllers/loanController");

// 📊 STATS (पहले define करो)
router.get("/stats/overview", getLoanStats);

// 💰 DISBURSE NEW LOAN
router.post("/disburse", validateRequest(loanValidationSchema), disburseLoan);

// 📋 GET ALL LOANS
router.get("/list", getAllLoans);

// 👤 GET LOANS BY CUSTOMER
router.get("/customer/:customerId", getLoansByCustomerId);

// 📅 GET EMI SCHEDULE
router.get("/:loanId/emi-schedule", getEmiSchedule);

// 🔍 GET SINGLE LOAN
router.get("/:loanId", getLoanById);

// ✏️ UPDATE LOAN STATUS
router.put(
  "/:loanId/status",
  validateRequest(updateLoanStatusSchema),
  updateLoanStatus,
);

module.exports = router;

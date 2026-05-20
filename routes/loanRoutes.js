const express = require("express");
const validate = require("../middleware/validate");
const {
  createLoanSchema,
  updateLoanSchema,
} = require("../middleware/validationSchema");
const {
  createLoan,
  getAllLoans,
  getLoanDetails,
  updateLoan,
  getCustomerLoans,
  getLoanStats,
} = require("../controllers/loanController");

const router = express.Router();

console.log("📌 Loading loan routes...");

// ✅ Routes
router.post("/create", validate(createLoanSchema), createLoan);
router.get("/all", getAllLoans);
router.get("/:loanId", getLoanDetails);
router.put("/:loanId", validate(updateLoanSchema), updateLoan);
router.get("/customer/:customerId", getCustomerLoans);
router.get("/stats/all", getLoanStats);

console.log("✅ Loan routes loaded");

module.exports = router;

const { body } = require("express-validator");

// ✅ Customer Schemas
const createCustomerSchema = [
  body("name").notEmpty().withMessage("Name is required").trim(),
  body("email").isEmail().withMessage("Valid email required").trim(),
  body("mobile")
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile must be 10 digits"),
  body("address").notEmpty().withMessage("Address is required").trim(),
  body("occupation").notEmpty().withMessage("Occupation is required").trim(),
  body("monthlyIncome")
    .isInt({ min: 1000 })
    .withMessage("Monthly income must be at least 1000"),
  body("cibilScore")
    .isInt({ min: 300, max: 900 })
    .withMessage("CIBIL score must be between 300-900"),
];

const updateCustomerSchema = [
  body("name").optional().trim(),
  body("email").optional().isEmail().withMessage("Valid email required"),
  body("mobile")
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile must be 10 digits"),
  body("address").optional().trim(),
  body("status")
    .optional()
    .isIn(["active", "inactive", "suspended"])
    .withMessage("Invalid status"),
];

// ✅ Loan Schemas
const createLoanSchema = [
  body("customerId").notEmpty().withMessage("Customer ID required").trim(),
  body("loanAmount")
    .isInt({ min: 1000 })
    .withMessage("Loan amount minimum 1000"),
  body("loanTenure")
    .isInt({ min: 1, max: 360 })
    .withMessage("Tenure 1-360 months"),
  body("interestRate").isFloat({ min: 0, max: 100 }).withMessage("Rate 0-100%"),
  body("loanPurpose").notEmpty().withMessage("Loan purpose required").trim(),
  body("disbursementDate").isISO8601().withMessage("Valid date required"),
];

const updateLoanSchema = [
  body("status")
    .optional()
    .isIn(["active", "completed", "closed"])
    .withMessage("Invalid status"),
];

// ✅ Payment Schemas
const recordPaymentSchema = [
  body("customerId").notEmpty().withMessage("Customer ID required").trim(),
  body("loanId").notEmpty().withMessage("Loan ID required").trim(),
  body("emiNumber").isInt({ min: 1 }).withMessage("Valid EMI number required"),
  body("amountPaid")
    .isFloat({ min: 1 })
    .withMessage("Amount must be greater than 0"),
  body("paymentMethod")
    .isIn(["cash", "bank_transfer", "cheque", "online", "upi"])
    .withMessage("Invalid payment method"),
  body("paymentDate").isISO8601().withMessage("Valid date required"),
];

const verifyPaymentSchema = [
  body("status")
    .isIn(["verified", "failed", "cancelled"])
    .withMessage("Invalid status"),
  body("remarks").optional().trim(),
];

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  createLoanSchema,
  updateLoanSchema,
  recordPaymentSchema,
  verifyPaymentSchema,
};

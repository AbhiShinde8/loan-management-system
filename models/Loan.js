const mongoose = require("mongoose");

console.log("📌 Defining Loan model...");

const loanSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // ✅ IMPORTANT: String के रूप में define करो
      required: true,
      primary: true,
    },
    customerId: {
      type: String,
      required: [true, "Customer ID is required"],
      index: true,
    },
    loanAmount: {
      type: Number,
      required: [true, "Loan amount is required"],
      min: [1000, "Loan amount must be at least 1000"],
    },
    loanTenure: {
      type: Number,
      required: [true, "Loan tenure is required"],
      min: [1, "Loan tenure must be at least 1 month"],
      max: [360, "Loan tenure cannot exceed 360 months"],
    },
    interestRate: {
      type: Number,
      required: [true, "Interest rate is required"],
      min: [0, "Interest rate cannot be negative"],
      max: [100, "Interest rate cannot exceed 100%"],
    },
    loanPurpose: {
      type: String,
      required: [true, "Loan purpose is required"],
      trim: true,
    },
    disbursementDate: {
      type: Date,
      required: [true, "Disbursement date is required"],
      index: true,
    },
    emiAmount: {
      type: Number,
      required: [true, "EMI amount is required"],
      min: [1, "EMI amount must be greater than 0"],
    },
    totalInterest: {
      type: Number,
      required: [true, "Total interest is required"],
      min: [0, "Total interest cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [1, "Total amount must be greater than 0"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    remainingAmount: {
      type: Number,
      required: [true, "Remaining amount is required"],
      min: [0, "Remaining amount cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "closed", "defaulted", "suspended"],
        message: "Status must be active, closed, defaulted, or suspended",
      },
      default: "active",
      index: true,
    },
    penaltyRate: {
      type: Number,
      default: 5,
      min: [0, "Penalty rate cannot be negative"],
      max: [100, "Penalty rate cannot exceed 100%"],
    },
    createdByAdmin: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
    _id: true, // ✅ IMPORTANT: _id को explicitly enable करो
  },
);

// ✅ Index for fast queries
loanSchema.index({ customerId: 1, status: 1 });
loanSchema.index({ disbursementDate: 1 });

let Loan;
try {
  Loan = mongoose.model("Loan");
  console.log("✅ Loan model already exists");
} catch (error) {
  Loan = mongoose.model("Loan", loanSchema);
  console.log("✅ Loan model created successfully");
}

module.exports = Loan;

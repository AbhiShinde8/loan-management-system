const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      // Format: loan_001, loan_002
    },
    loanId: {
      type: String,
      unique: true,
      required: true,
      // Format: LOAN_2024_001
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },

    // Amount Details
    disbursedAmount: {
      type: Number,
      required: [true, "Disbursed amount is required"],
      min: [100, "Amount must be at least ₹100"],
    },
    deductionPercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    deductionAmount: {
      type: Number,
      required: true,
    },
    actualAmountGiven: {
      type: Number,
      required: true,
    },

    // EMI Details
    emiAmount: {
      type: Number,
      required: true,
    },
    totalEmi: {
      type: Number,
      default: 10,
    },
    emiFrequency: {
      type: String,
      default: "every 8 days",
    },

    // Timeline
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["active", "completed", "hold", "cancelled"],
      default: "active",
    },
    completedEmi: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingEmi: {
      type: Number,
      default: 10,
    },

    // Penalty
    penaltyRate: {
      type: Number,
      default: 5,
    },
    totalPenalty: {
      type: Number,
      default: 0,
    },

    // Admin Tracking
    createdByAdmin: String,
    updatedByAdmin: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },

    // Edit History
    editHistory: [
      {
        fieldChanged: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        changedBy: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { _id: false },
);

// Indexes
loanSchema.index({ customerId: 1 });
loanSchema.index({ loanId: 1 });
loanSchema.index({ status: 1 });

module.exports = mongoose.model("Loan", loanSchema);

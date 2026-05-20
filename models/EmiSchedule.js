const mongoose = require("mongoose");

console.log("📌 Defining EmiSchedule model...");

const emiScheduleSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // ✅ IMPORTANT: String के रूप में define करो
      required: false, // Auto-generate होगा
    },
    loanId: {
      type: String,
      required: [true, "Loan ID is required"],
      index: true,
    },
    customerId: {
      type: String,
      required: [true, "Customer ID is required"],
      index: true,
    },
    emiNumber: {
      type: Number,
      required: [true, "EMI number is required"],
    },
    emiAmount: {
      type: Number,
      required: [true, "EMI amount is required"],
      min: [1, "EMI amount must be greater than 0"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      index: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "Amount paid cannot be negative"],
    },
    penaltyApplied: {
      type: Number,
      default: 0,
      min: [0, "Penalty cannot be negative"],
    },
    daysOverdue: {
      type: Number,
      default: 0,
      min: [0, "Days overdue cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "paid", "partial", "overdue"],
        message: "Status must be pending, paid, partial, or overdue",
      },
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// ✅ Composite index for fast queries
emiScheduleSchema.index({ loanId: 1, emiNumber: 1 }, { unique: true });
emiScheduleSchema.index({ customerId: 1, status: 1 });
emiScheduleSchema.index({ dueDate: 1, status: 1 });

let EmiSchedule;
try {
  EmiSchedule = mongoose.model("EmiSchedule");
  console.log("✅ EmiSchedule model already exists");
} catch (error) {
  EmiSchedule = mongoose.model("EmiSchedule", emiScheduleSchema);
  console.log("✅ EmiSchedule model created successfully");
}

module.exports = EmiSchedule;

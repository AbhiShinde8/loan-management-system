const mongoose = require("mongoose");

const emiScheduleSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    loanId: {
      type: String,
      required: true,
      index: true,
    },
    emiNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      default: "pending",
    },

    // Payment Info
    paidDate: Date,
    paidAmount: Number,
    penaltyAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    // Payment Method
    paymentMethod: {
      type: String,
      enum: ["cash", "online", "bank_transfer", "cheque"],
      default: "cash",
    },
    paidByAdmin: String,
    notes: String,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

// Indexes
emiScheduleSchema.index({ loanId: 1 });
emiScheduleSchema.index({ status: 1 });
emiScheduleSchema.index({ dueDate: 1 });

module.exports = mongoose.model("EmiSchedule", emiScheduleSchema);

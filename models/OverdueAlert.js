const mongoose = require("mongoose");

const overdueAlertSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    loanId: {
      type: String,
      required: true,
    },
    emiNumber: Number,

    // Overdue Details
    overdueAmount: Number,
    overdueDays: Number,
    penalty: Number,
    totalDue: Number,

    // Customer Quick Info
    customerName: String,
    customerMobile: String,
    customerAddress: String,
    referencePersonName: String,

    // Alert Status
    alertGeneratedAt: {
      type: Date,
      default: Date.now,
    },
    alertStatus: {
      type: String,
      enum: ["active", "resolved", "dismissed"],
      default: "active",
    },
  },
  { _id: false },
);

// Index
overdueAlertSchema.index({ customerId: 1 });
overdueAlertSchema.index({ alertStatus: 1 });

module.exports = mongoose.model("OverdueAlert", overdueAlertSchema);

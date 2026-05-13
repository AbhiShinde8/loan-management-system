const mongoose = require("mongoose");

const paymentHistorySchema = new mongoose.Schema(
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
      index: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online", "bank_transfer", "cheque"],
      default: "cash",
    },
    receivedByAdmin: String,
    transactionId: {
      type: String,
      unique: true,
    },
  },
  { _id: false },
);

// Indexes
paymentHistorySchema.index({ customerId: 1 });
paymentHistorySchema.index({ loanId: 1 });
paymentHistorySchema.index({ paymentDate: 1 });

module.exports = mongoose.model("PaymentHistory", paymentHistorySchema);

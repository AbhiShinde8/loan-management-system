const mongoose = require("mongoose");

console.log("📌 Defining Payment model...");

const paymentSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // ✅ IMPORTANT: String के रूप में define करो
      required: true,
      primary: true,
    },
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      unique: true,
      index: true,
    },
    customerId: {
      type: String,
      required: [true, "Customer ID is required"],
      index: true,
    },
    loanId: {
      type: String,
      required: [true, "Loan ID is required"],
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
    amountPaid: {
      type: Number,
      required: [true, "Amount paid is required"],
      min: [1, "Amount paid must be greater than 0"],
    },
    penaltyAmount: {
      type: Number,
      default: 0,
      min: [0, "Penalty amount cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [1, "Total amount must be greater than 0"],
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["cash", "bank_transfer", "cheque", "online", "upi"],
        message: "Invalid payment method",
      },
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "failed"],
        message: "Status must be pending, completed, or failed",
      },
      default: "pending",
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isLatePayment: {
      type: Boolean,
      default: false,
    },
    daysLate: {
      type: Number,
      default: 0,
      min: [0, "Days late cannot be negative"],
    },
    verifiedByAdmin: {
      type: String,
      default: null,
    },
    verificationTime: {
      type: Date,
      default: null,
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

// ✅ Composite index
paymentSchema.index({ loanId: 1, emiNumber: 1 });
paymentSchema.index({ customerId: 1, status: 1 });

let Payment;
try {
  Payment = mongoose.model("Payment");
  console.log("✅ Payment model already exists");
} catch (error) {
  Payment = mongoose.model("Payment", paymentSchema);
  console.log("✅ Payment model created successfully");
}

module.exports = Payment;

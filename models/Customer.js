const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      // Format: cust_001, cust_002, etc.
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: [true, "Mobile number already registered"],
      match: [/^[0-9]{10}$/, "Mobile must be 10 digits"],
    },

    // Reference Person Details
    referencePersonName: {
      type: String,
      required: [true, "Reference person name is required"],
    },
    referencePersonMobile: {
      type: String,
      required: [true, "Reference mobile is required"],
      match: [/^[0-9]{10}$/, "Mobile must be 10 digits"],
    },
    referencePersonAddress: {
      type: String,
      required: [true, "Reference address is required"],
    },

    // Account Information
    accountNumber: {
      type: String,
      unique: [true, "Account number must be unique"],
      required: true,
      // Format: ACC_2024_001
    },

    // Tracking
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdByAdmin: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    // Statistics
    totalLoansCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentOverdueCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }, // MongoDB को default _id न बनाने दो
);

// Index for fast queries
customerSchema.index({ mobile: 1 });
customerSchema.index({ accountNumber: 1 });

module.exports = mongoose.model("Customer", customerSchema);

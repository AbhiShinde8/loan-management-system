const mongoose = require("mongoose");

console.log("📌 Defining Customer model...");

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [3, "Name must be at least 3 characters"],
    maxlength: [100, "Name must not exceed 100 characters"],
  },
  address: {
    type: String,
    required: [true, "Address is required"],
    trim: true,
    minlength: [5, "Address must be at least 5 characters"],
    maxlength: [500, "Address must not exceed 500 characters"],
  },
  mobile: {
    type: String,
    required: [true, "Mobile number is required"],
    unique: true,
    match: [/^[0-9]{10}$/, "Mobile must be a valid 10-digit number"],
  },
  referencePersonName: {
    type: String,
    required: [true, "Reference person name is required"],
    trim: true,
    minlength: [3, "Reference person name must be at least 3 characters"],
    maxlength: [100, "Reference person name must not exceed 100 characters"],
  },
  referencePersonMobile: {
    type: String,
    required: [true, "Reference person mobile is required"],
    match: [
      /^[0-9]{10}$/,
      "Reference person mobile must be a valid 10-digit number",
    ],
  },
  referencePersonAddress: {
    type: String,
    required: [true, "Reference person address is required"],
    trim: true,
    minlength: [5, "Reference person address must be at least 5 characters"],
    maxlength: [500, "Reference person address must not exceed 500 characters"],
  },
  status: {
    type: String,
    enum: {
      values: ["active", "inactive", "suspended"],
      message: "Status must be active, inactive, or suspended",
    },
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ IMPORTANT: Check if model already exists
// let Customer;
// try {
//   Customer = mongoose.model("Customer");
//   console.log("✅ Customer model already exists, using existing model");
// } catch (error) {
//   Customer = mongoose.model("Customer", customerSchema);
//   console.log("✅ Customer model created");
// }

// module.exports = Customer;

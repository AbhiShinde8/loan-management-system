const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Admin name is required"],
    },
    email: {
      type: String,
      unique: [true, "Email already exists"],
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
    },
    mobile: {
      type: String,
      match: [/^[0-9]{10}$/, "Mobile must be 10 digits"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Default में password return न करो
    },
    role: {
      type: String,
      enum: ["admin", "manager", "viewer"],
      default: "viewer",
    },
    permissions: [
      {
        type: String,
        enum: [
          "create_customer",
          "edit_customer",
          "delete_customer",
          "create_loan",
          "edit_loan",
          "record_payment",
          "manage_admins",
          "view_reports",
        ],
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: Date,
  },
  { _id: false },
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Index
adminSchema.index({ email: 1 });

module.exports = mongoose.model("Admin", adminSchema);

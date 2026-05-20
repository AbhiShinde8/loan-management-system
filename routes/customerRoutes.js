const express = require("express");
const validate = require("../middleware/validate");
const {
  createCustomerSchema,
  updateCustomerSchema,
} = require("../middleware/validationSchema");
const {
  createCustomer,
  getCustomerDetails,
  getAllCustomers,
  updateCustomer,
  getCustomerStats,
  searchCustomers,
} = require("../controllers/customerController");

const router = express.Router();

console.log("📌 Loading customer routes...");

// ✅ Routes
router.post("/create", validate(createCustomerSchema), createCustomer);
router.get("/search", searchCustomers);
router.get("/stats", getCustomerStats);
router.get("/all", getAllCustomers);
router.get("/:customerId", getCustomerDetails);
router.put("/:customerId", validate(updateCustomerSchema), updateCustomer);

console.log("✅ Customer routes loaded");

module.exports = router;

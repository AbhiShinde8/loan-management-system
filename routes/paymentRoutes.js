const express = require("express");
const validate = require("../middleware/validate");
const {
  recordPaymentSchema,
  verifyPaymentSchema,
} = require("../middleware/validationSchema");
const {
  recordPayment,
  verifyPayment,
  getPaymentHistory,
  getPendingEMIs,
  getOverdueLoans,
  getPaymentStats,
} = require("../controllers/paymentController");

const router = express.Router();

console.log("📌 Loading payment routes...");

// ✅ Routes - सही तरीके से validate करो
router.post("/record", validate(recordPaymentSchema), recordPayment);
router.put(
  "/verify/:transactionId",
  validate(verifyPaymentSchema),
  verifyPayment,
);
router.get("/history/:customerId", getPaymentHistory);
router.get("/pending/:customerId", getPendingEMIs);
router.get("/overdue/list", getOverdueLoans);
router.get("/stats", getPaymentStats);

console.log("✅ Payment routes loaded");

module.exports = router;

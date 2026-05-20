/**
 * 🆔 ID GENERATOR UTILITY
 * Generates unique IDs for various entities
 */

const crypto = require("crypto");

/**
 * ✅ Generate Transaction ID
 * Format: TXN_20260518_ABC123DEF456
 */
const generateTransactionId = () => {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const randomStr = crypto.randomBytes(8).toString("hex").toUpperCase();

  const transactionId = `TXN_${dateStr}_${randomStr}`;
  console.log("   Generated Transaction ID:", transactionId);
  return transactionId;
};

/**
 * ✅ Generate Loan ID
 * Format: LOAN_20260518_ABC123DEF456
 */
const generateLoanId = () => {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const randomStr = crypto.randomBytes(8).toString("hex").toUpperCase();

  return `LOAN_${dateStr}_${randomStr}`;
};

/**
 * ✅ Generate Customer ID
 * Format: CUST_20260518_ABC123DEF456
 */
const generateCustomerId = () => {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const randomStr = crypto.randomBytes(8).toString("hex").toUpperCase();

  return `CUST_${dateStr}_${randomStr}`;
};

/**
 * ✅ Generate Reference Number
 * Format: REF_ABC123DEF456GHI789
 */
const generateReferenceNumber = () => {
  const randomStr = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `REF_${randomStr}`;
};

module.exports = {
  generateTransactionId,
  generateLoanId,
  generateCustomerId,
  generateReferenceNumber,
};

console.log("✅ idGenerator utility loaded");

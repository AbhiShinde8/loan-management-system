const Customer = require("../models/Customer");
const Loan = require("../models/Loan");

console.log("📌 idGenerator.js loaded");

/**
 * Generate unique Customer ID
 * Format: cust_001, cust_002, etc.
 */
const generateCustomerId = async () => {
  try {
    const count = await Customer.countDocuments();
    const id = `cust_${String(count + 1).padStart(3, "0")}`;

    console.log(`🆔 Generated Customer ID: ${id}`);

    // Check if ID already exists
    const existing = await Customer.findById(id);
    if (existing) {
      console.log(`⚠️ Customer ID already exists, generating new one...`);
      return generateCustomerId();
    }

    return id;
  } catch (error) {
    console.error("❌ Error generating customer ID:", error);
    throw error;
  }
};

/**
 * Generate unique Account Number
 * Format: ACC_2024_001_1234
 */
const generateAccountNumber = async () => {
  try {
    const count = await Customer.countDocuments();
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    const accountNumber = `ACC_${year}_${String(count + 1).padStart(3, "0")}_${String(random).padStart(4, "0")}`;

    console.log(`🆔 Generated Account Number: ${accountNumber}`);

    // Check if account number already exists
    const existing = await Customer.findOne({ accountNumber });
    if (existing) {
      console.log(`⚠️ Account number already exists, generating new one...`);
      return generateAccountNumber();
    }

    return accountNumber;
  } catch (error) {
    console.error("❌ Error generating account number:", error);
    throw error;
  }
};

/**
 * Generate unique Loan ID
 * Format: LOAN_2024_00001, LOAN_2024_00002, etc.
 */
const generateLoanId = async () => {
  try {
    const count = await Loan.countDocuments();
    const year = new Date().getFullYear();
    const loanId = `LOAN_${year}_${String(count + 1).padStart(5, "0")}`;

    console.log(`🆔 Generated Loan ID: ${loanId}`);

    // Check if loan ID already exists
    const existing = await Loan.findOne({ loanId });
    if (existing) {
      console.log(`⚠️ Loan ID already exists, generating new one...`);
      return generateLoanId();
    }

    return loanId;
  } catch (error) {
    console.error("❌ Error generating loan ID:", error);
    throw error;
  }
};

/**
 * Generate EMI Schedule ID
 * Format: LOAN_2024_00001_emi_01
 */
const generateEmiScheduleId = (loanId, emiNumber) => {
  const scheduleId = `${loanId}_emi_${String(emiNumber).padStart(2, "0")}`;
  console.log(`🆔 Generated EMI Schedule ID: ${scheduleId}`);
  return scheduleId;
};

/**
 * Generate Transaction ID
 * Format: TXN_2024_1708000000000_ABC123
 */
const generateTransactionId = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7).toUpperCase();
  const transactionId = `TXN_${year}_${timestamp}_${random}`;
  console.log(`🆔 Generated Transaction ID: ${transactionId}`);
  return transactionId;
};

// Export all functions
module.exports = {
  generateCustomerId,
  generateAccountNumber,
  generateLoanId,
  generateEmiScheduleId,
  generateTransactionId,
};

console.log("✅ idGenerator.js exports loaded successfully");

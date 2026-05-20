const mongoose = require("mongoose");
require("dotenv").config();

const Customer = require("../models/Customer");
const Loan = require("../models/Loan");
const EmiSchedule = require("../models/EmiSchedule");
const Payment = require("../models/Payment");

const {
  generateCustomerId,
  generateLoanId,
  generateTransactionId,
} = require("../utils/idGenerator");

/**
 * 📐 CALCULATE EMI (Helper function)
 */
const calculateEmi = (principal, annualRate, months) => {
  const monthlyRate = annualRate / 12 / 100;

  if (monthlyRate === 0) {
    return Math.round((principal / months) * 100) / 100;
  }

  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  const emi = numerator / denominator;

  return Math.round(emi * 100) / 100;
};

/**
 * 📅 GENERATE EMI SCHEDULE
 */
const generateEmiSchedule = (
  loanId,
  customerId,
  principal,
  annualRate,
  months,
  disbursementDate,
) => {
  const emiAmount = calculateEmi(principal, annualRate, months);
  const schedules = [];

  let currentDate = new Date(disbursementDate);
  currentDate.setDate(currentDate.getDate() + 30);

  for (let i = 1; i <= months; i++) {
    schedules.push({
      loanId,
      customerId,
      emiNumber: i,
      emiAmount,
      dueDate: new Date(currentDate),
      amountPaid: 0,
      penaltyApplied: 0,
      daysOverdue: 0,
      status: "pending",
    });

    currentDate.setDate(currentDate.getDate() + 30);
  }

  return schedules;
};

/**
 * 🌱 SEED DATABASE
 */
const seedDatabase = async () => {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🌱 DATABASE SEEDING STARTED");
    console.log("=".repeat(70) + "\n");

    // Connect to MongoDB
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/loan-management";
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    // ==================== CREATE CUSTOMERS ====================
    console.log("👥 Creating Customers...\n");

    const customers = [
      {
        _id: generateCustomerId(),
        name: "Rajesh Kumar",
        email: "rajesh.kumar@email.com",
        mobile: "9876543210",
        address: "123 Main Street, Delhi",
        occupation: "Engineer",
        monthlyIncome: 75000,
        cibilScore: 750,
        totalLoansCount: 0,
        activeLoansCount: 0,
        status: "active",
      },
      {
        _id: generateCustomerId(),
        name: "Priya Singh",
        email: "priya.singh@email.com",
        mobile: "9876543211",
        address: "456 Park Avenue, Mumbai",
        occupation: "Doctor",
        monthlyIncome: 120000,
        cibilScore: 800,
        totalLoansCount: 0,
        activeLoansCount: 0,
        status: "active",
      },
      {
        _id: generateCustomerId(),
        name: "Amit Patel",
        email: "amit.patel@email.com",
        mobile: "9876543212",
        address: "789 Business Park, Bangalore",
        occupation: "Business Owner",
        monthlyIncome: 150000,
        cibilScore: 780,
        totalLoansCount: 0,
        activeLoansCount: 0,
        status: "active",
      },
      {
        _id: generateCustomerId(),
        name: "Neha Sharma",
        email: "neha.sharma@email.com",
        mobile: "9876543213",
        address: "321 Tech Road, Pune",
        occupation: "Software Developer",
        monthlyIncome: 85000,
        cibilScore: 760,
        totalLoansCount: 0,
        activeLoansCount: 0,
        status: "active",
      },
      {
        _id: generateCustomerId(),
        name: "Vikram Singh",
        email: "vikram.singh@email.com",
        mobile: "9876543214",
        address: "654 Commerce Street, Kolkata",
        occupation: "Trader",
        monthlyIncome: 95000,
        cibilScore: 770,
        totalLoansCount: 0,
        activeLoansCount: 0,
        status: "active",
      },
    ];

    const savedCustomers = await Customer.insertMany(customers);
    console.log(`✅ ${savedCustomers.length} Customers created\n`);

    // ==================== CREATE LOANS ====================
    console.log("💰 Creating Loans with EMI Schedules...\n");

    const loans = [];
    const allEmiSchedules = [];

    const loanConfigs = [
      {
        customerId: savedCustomers[0]._id,
        loanAmount: 500000,
        loanTenure: 60,
        interestRate: 12,
        loanPurpose: "Home Renovation",
        disbursementDate: "2024-02-15",
      },
      {
        customerId: savedCustomers[1]._id,
        loanAmount: 800000,
        loanTenure: 84,
        interestRate: 10,
        loanPurpose: "Vehicle Purchase",
        disbursementDate: "2024-03-01",
      },
      {
        customerId: savedCustomers[2]._id,
        loanAmount: 1500000,
        loanTenure: 120,
        interestRate: 11,
        loanPurpose: "Business Expansion",
        disbursementDate: "2024-01-15",
      },
      {
        customerId: savedCustomers[3]._id,
        loanAmount: 400000,
        loanTenure: 48,
        interestRate: 13,
        loanPurpose: "Education",
        disbursementDate: "2024-04-01",
      },
      {
        customerId: savedCustomers[4]._id,
        loanAmount: 600000,
        loanTenure: 60,
        interestRate: 12.5,
        loanPurpose: "Medical Expenses",
        disbursementDate: "2024-02-01",
      },
    ];

    for (const config of loanConfigs) {
      const loanId = generateLoanId();
      const emiAmount = calculateEmi(
        config.loanAmount,
        config.interestRate,
        config.loanTenure,
      );
      const totalInterest = emiAmount * config.loanTenure - config.loanAmount;
      const totalAmount = emiAmount * config.loanTenure;

      const loan = {
        _id: loanId,
        customerId: config.customerId,
        loanAmount: config.loanAmount,
        loanTenure: config.loanTenure,
        interestRate: config.interestRate,
        loanPurpose: config.loanPurpose,
        disbursementDate: new Date(config.disbursementDate),
        emiAmount: Math.round(emiAmount * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paidAmount: 0,
        remainingAmount: Math.round(totalAmount * 100) / 100,
        status: "active",
        penaltyRate: 5,
        createdByAdmin: "system",
      };

      loans.push(loan);

      // Generate EMI schedules
      const emiSchedules = generateEmiSchedule(
        loanId,
        config.customerId,
        config.loanAmount,
        config.interestRate,
        config.loanTenure,
        config.disbursementDate,
      );

      allEmiSchedules.push(...emiSchedules);

      console.log(`   ✅ Loan created: ${loanId}`);
      console.log(
        `      Amount: ₹${config.loanAmount}, EMI: ₹${Math.round(emiAmount * 100) / 100}, Tenure: ${config.loanTenure} months\n`,
      );
    }

    // Save loans
    await Loan.insertMany(loans);
    console.log(`✅ ${loans.length} Loans created\n`);

    // Save EMI schedules
    await EmiSchedule.insertMany(allEmiSchedules);
    console.log(`✅ ${allEmiSchedules.length} EMI Schedules created\n`);

    // ==================== CREATE PAYMENTS ====================
    console.log("💳 Creating Test Payments...\n");

    const payments = [];

    // Create some payments for the first loan
    const firstLoan = loans[0];
    const firstLoanEMIs = allEmiSchedules.filter(
      (e) => e.loanId === firstLoan._id,
    );

    for (let i = 0; i < 3; i++) {
      const emi = firstLoanEMIs[i];
      const transactionId = generateTransactionId();

      const payment = {
        _id: transactionId,
        transactionId,
        customerId: firstLoan.customerId,
        loanId: firstLoan._id,
        emiNumber: emi.emiNumber,
        emiAmount: emi.emiAmount,
        amountPaid: emi.emiAmount,
        penaltyAmount: 0,
        totalAmount: emi.emiAmount,
        paymentDate: new Date(emi.dueDate),
        dueDate: emi.dueDate,
        paymentMethod: ["bank_transfer", "online", "upi"][i % 3],
        status: "completed",
        isVerified: true,
        isLatePayment: false,
        daysLate: 0,
        verifiedByAdmin: "system",
        verificationTime: new Date(emi.dueDate),
        createdByAdmin: "system",
      };

      payments.push(payment);

      // Update EMI schedule
      emi.amountPaid = emi.emiAmount;
      emi.paidDate = new Date(emi.dueDate);
      emi.status = "paid";
    }

    // Create some late payments for another loan
    const secondLoan = loans[1];
    const secondLoanEMIs = allEmiSchedules.filter(
      (e) => e.loanId === secondLoan._id,
    );

    for (let i = 0; i < 2; i++) {
      const emi = secondLoanEMIs[i];
      const transactionId = generateTransactionId();
      const daysLate = 15;
      const penalty =
        Math.round((emi.emiAmount * 5 * daysLate) / 100 / 100) * 100;

      const payment = {
        _id: transactionId,
        transactionId,
        customerId: secondLoan.customerId,
        loanId: secondLoan._id,
        emiNumber: emi.emiNumber,
        emiAmount: emi.emiAmount,
        amountPaid: emi.emiAmount,
        penaltyAmount: penalty,
        totalAmount: emi.emiAmount + penalty,
        paymentDate: new Date(
          emi.dueDate.getTime() + daysLate * 24 * 60 * 60 * 1000,
        ),
        dueDate: emi.dueDate,
        paymentMethod: "cash",
        status: "completed",
        isVerified: true,
        isLatePayment: true,
        daysLate,
        verifiedByAdmin: "system",
        verificationTime: new Date(
          emi.dueDate.getTime() + daysLate * 24 * 60 * 60 * 1000,
        ),
        createdByAdmin: "system",
      };

      payments.push(payment);

      // Update EMI schedule
      emi.amountPaid = emi.emiAmount;
      emi.paidDate = new Date(
        emi.dueDate.getTime() + daysLate * 24 * 60 * 60 * 1000,
      );
      emi.daysOverdue = daysLate;
      emi.penaltyApplied = penalty;
      emi.status = "paid";
    }

    // Update EMI schedules
    for (const emi of firstLoanEMIs.concat(secondLoanEMIs)) {
      await EmiSchedule.findOneAndUpdate(
        { loanId: emi.loanId, emiNumber: emi.emiNumber },
        emi,
        { new: true },
      );
    }

    // Save payments
    if (payments.length > 0) {
      await Payment.insertMany(payments);
      console.log(`✅ ${payments.length} Test Payments created\n`);
    }

    // ==================== UPDATE CUSTOMERS ====================
    console.log("📊 Updating Customer Statistics...\n");

    for (const customer of savedCustomers) {
      const customerLoans = loans.filter((l) => l.customerId === customer._id);
      const activeLoans = customerLoans.filter((l) => l.status === "active");

      await Customer.findByIdAndUpdate(customer._id, {
        totalLoansCount: customerLoans.length,
        activeLoansCount: activeLoans.length,
      });
    }

    console.log("✅ Customer statistics updated\n");

    // ==================== SUMMARY ====================
    console.log("=".repeat(70));
    console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70) + "\n");

    console.log("📊 Summary:");
    console.log(`   👥 Customers: ${savedCustomers.length}`);
    console.log(`   💰 Loans: ${loans.length}`);
    console.log(`   📅 EMI Schedules: ${allEmiSchedules.length}`);
    console.log(`   💳 Payments: ${payments.length}\n`);

    console.log("📝 Test Customer Details:");
    savedCustomers.forEach((cust, index) => {
      console.log(`   ${index + 1}. ${cust.name} (ID: ${cust._id})`);
      console.log(`      Mobile: ${cust.mobile}, Email: ${cust.email}\n`);
    });

    console.log("=".repeat(70) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error.message);
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();

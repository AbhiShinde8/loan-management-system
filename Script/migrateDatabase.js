const mongoose = require("mongoose");
require("dotenv").config();

const Loan = require("../models/Loan");
const Payment = require("../models/Payment");
const EmiSchedule = require("../models/EmiSchedule");

const migrateDatabase = async () => {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🔄 DATABASE MIGRATION STARTED");
    console.log("=".repeat(70) + "\n");

    // Connect to MongoDB
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/loan-management";
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    // Get existing data
    console.log("📋 Backing up existing data...\n");

    const existingLoans = await mongoose.connection
      .collection("loans")
      .find({})
      .toArray();
    const existingPayments = await mongoose.connection
      .collection("payments")
      .find({})
      .toArray();
    const existingEmiSchedules = await mongoose.connection
      .collection("emischedules")
      .find({})
      .toArray();

    console.log(`   📊 Found ${existingLoans.length} loans`);
    console.log(`   📊 Found ${existingPayments.length} payments`);
    console.log(`   📊 Found ${existingEmiSchedules.length} EMI schedules\n`);

    // Migrate Loans
    console.log("🔄 Migrating Loans...");
    for (const loan of existingLoans) {
      try {
        // Convert _id to string if it's ObjectId
        if (loan._id.toString) {
          loan._id = loan._id.toString();
        }

        // Remove old version
        await Loan.deleteOne({ _id: loan._id });

        // Insert updated loan
        await Loan.create(loan);
        console.log(`   ✅ Migrated loan: ${loan._id}`);
      } catch (error) {
        console.log(
          `   ⚠️  Loan ${loan._id} already migrated or error:`,
          error.message,
        );
      }
    }
    console.log(`✅ ${existingLoans.length} Loans migrated\n`);

    // Migrate Payments
    console.log("🔄 Migrating Payments...");
    for (const payment of existingPayments) {
      try {
        if (payment._id.toString) {
          payment._id = payment._id.toString();
        }

        await Payment.deleteOne({ _id: payment._id });
        await Payment.create(payment);
        console.log(`   ✅ Migrated payment: ${payment._id}`);
      } catch (error) {
        console.log(
          `   ⚠️  Payment ${payment._id} already migrated or error:`,
          error.message,
        );
      }
    }
    console.log(`✅ ${existingPayments.length} Payments migrated\n`);

    // Migrate EMI Schedules
    console.log("🔄 Migrating EMI Schedules...");
    for (const emi of existingEmiSchedules) {
      try {
        if (emi._id && emi._id.toString) {
          emi._id = emi._id.toString();
        }

        // Check if exists
        const exists = await EmiSchedule.findOne({
          loanId: emi.loanId,
          emiNumber: emi.emiNumber,
        });

        if (!exists) {
          await EmiSchedule.create(emi);
          console.log(`   ✅ Migrated EMI: ${emi.loanId} - #${emi.emiNumber}`);
        }
      } catch (error) {
        console.log(`   ⚠️  EMI already migrated or error:`, error.message);
      }
    }
    console.log(`✅ ${existingEmiSchedules.length} EMI Schedules migrated\n`);

    console.log("=".repeat(70));
    console.log("✅ DATABASE MIGRATION COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration Error:", error.message);
    console.error(error);
    process.exit(1);
  }
};

migrateDatabase();

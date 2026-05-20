const Payment = require("../models/Payment");
const EmiSchedule = require("../models/EmiSchedule");
const Loan = require("../models/Loan");
const Customer = require("../models/Customer");

// Import ID generator
let generateTransactionId;

try {
  const idGenerator = require("../utils/idGenerator");
  generateTransactionId = idGenerator.generateTransactionId;
  console.log("✅ Payment Controller: generateTransactionId imported");
} catch (error) {
  console.error("❌ Error importing idGenerator:", error.message);
  process.exit(1);
}

/**
 * 💰 CALCULATE PENALTY (Helper function)
 */
const calculatePenalty = (penaltyRate, emiAmount, daysOverdue) => {
  if (daysOverdue <= 0) return 0;

  // Penalty = EMI Amount * Penalty Rate * Days Overdue / 100
  const dailyPenalty = (emiAmount * penaltyRate) / 100;
  const totalPenalty = dailyPenalty * daysOverdue;

  return Math.round(totalPenalty * 100) / 100; // Round to 2 decimals
};

/**
 * 📅 CALCULATE DAYS OVERDUE (Helper function)
 */
const calculateDaysOverdue = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = today - due;
  const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, daysOverdue);
};

/**
 * ✅ RECORD PAYMENT
 * POST /api/payment/record
 */
const recordPayment = async (req, res) => {
  try {
    console.log("📌 recordPayment called");
    console.log("   Request body:", req.body);

    const validatedData = req.validatedData;
    const {
      customerId,
      loanId,
      emiNumber,
      amountPaid,
      paymentMethod,
      paymentDate,
    } = validatedData;

    // Get EMI Schedule
    console.log("🔍 Fetching EMI Schedule...");
    const emiSchedule = await EmiSchedule.findOne({
      loanId,
      emiNumber,
    });

    if (!emiSchedule) {
      console.log("⚠️ EMI Schedule not found");
      return res.status(404).json({
        success: false,
        message: "EMI Schedule not found",
      });
    }

    // Get Loan details
    console.log("🔍 Fetching Loan details...");
    const loan = await Loan.findById(loanId);

    if (!loan) {
      console.log("⚠️ Loan not found");
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // Calculate penalty if overdue
    console.log("⏰ Calculating penalty...");
    const daysOverdue = calculateDaysOverdue(emiSchedule.dueDate);
    let penaltyAmount = 0;
    let isLatePayment = false;

    if (daysOverdue > 0) {
      penaltyAmount = calculatePenalty(
        loan.penaltyRate,
        emiSchedule.emiAmount,
        daysOverdue,
      );
      isLatePayment = true;
      console.log(`   Days overdue: ${daysOverdue}, Penalty: ${penaltyAmount}`);
    }

    // Total amount to be paid
    const totalAmount = amountPaid + penaltyAmount;

    // Generate transaction ID
    console.log("🆔 Generating Transaction ID...");
    const transactionId = generateTransactionId();
    console.log("✅ Transaction ID:", transactionId);

    // Create payment record
    console.log("💾 Creating payment record...");
    const paymentId = transactionId; // Using transaction ID as payment ID

    const newPayment = new Payment({
      _id: paymentId,
      transactionId,
      customerId,
      loanId,
      emiNumber,
      emiAmount: emiSchedule.emiAmount,
      amountPaid,
      penaltyAmount,
      totalAmount,
      paymentDate: new Date(paymentDate),
      dueDate: emiSchedule.dueDate,
      paymentMethod,
      status: "pending", // Will be verified by admin
      isLatePayment,
      daysLate: daysOverdue,
      createdByAdmin: req.adminId || "system",
    });

    await newPayment.save();
    console.log("✅ Payment record created");

    // Update EMI Schedule
    console.log("📝 Updating EMI Schedule...");
    emiSchedule.amountPaid = (emiSchedule.amountPaid || 0) + amountPaid;
    emiSchedule.paidDate = new Date(paymentDate);
    emiSchedule.daysOverdue = daysOverdue;
    emiSchedule.penaltyApplied = penaltyAmount;

    // Determine EMI status
    if (emiSchedule.amountPaid >= emiSchedule.emiAmount) {
      emiSchedule.status = "paid";
    } else {
      emiSchedule.status = "partial";
    }

    await emiSchedule.save();
    console.log("✅ EMI Schedule updated");

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        transactionId,
        customerId,
        loanId,
        emiNumber,
        emiAmount: emiSchedule.emiAmount,
        amountPaid,
        penaltyAmount,
        totalAmount,
        daysOverdue,
        isLatePayment,
        status: "pending",
        createdAt: newPayment.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error recording payment:", error.message);
    console.error("   Stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Error recording payment",
      error: error.message,
    });
  }
};

/**
 * ✅ VERIFY PAYMENT (Admin only)
 * PUT /api/payment/verify/:transactionId
 */
const verifyPayment = async (req, res) => {
  try {
    console.log("📌 verifyPayment called");
    const { transactionId } = req.params;
    const { verified } = req.body;

    const payment = await Payment.findById(transactionId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (verified) {
      payment.status = "completed";
      payment.isVerified = true;
      payment.verifiedByAdmin = req.adminId || "system";
      payment.verificationTime = new Date();
    } else {
      payment.status = "failed";
      payment.isVerified = false;
    }

    await payment.save();

    // If verified, update EMI schedule
    if (verified) {
      const emiSchedule = await EmiSchedule.findOne({
        loanId: payment.loanId,
        emiNumber: payment.emiNumber,
      });

      if (emiSchedule) {
        if (emiSchedule.amountPaid >= emiSchedule.emiAmount) {
          emiSchedule.status = "paid";
        } else {
          emiSchedule.status = "partial";
        }
        await emiSchedule.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Payment ${verified ? "verified" : "rejected"} successfully`,
      data: {
        transactionId: payment.transactionId,
        status: payment.status,
        isVerified: payment.isVerified,
        verificationTime: payment.verificationTime,
      },
    });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);

    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

/**
 * ✅ GET PAYMENT HISTORY
 * GET /api/payment/history/:customerId
 */
const getPaymentHistory = async (req, res) => {
  try {
    console.log("📌 getPaymentHistory called");
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const filter = { customerId };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalCount = await Payment.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      message: "Payment history fetched",
      data: payments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching payment history:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching payment history",
      error: error.message,
    });
  }
};

/**
 * ✅ GET PENDING EMIs
 * GET /api/payment/pending/:customerId
 */
const getPendingEMIs = async (req, res) => {
  try {
    console.log("📌 getPendingEMIs called");
    const { customerId } = req.params;

    const pendingEMIs = await EmiSchedule.find({
      customerId,
      status: { $in: ["pending", "partial", "overdue"] },
    }).sort({ dueDate: 1 });

    // Calculate current penalty for each EMI
    const enrichedEMIs = pendingEMIs.map((emi) => {
      const daysOverdue = calculateDaysOverdue(emi.dueDate);
      let currentPenalty = 0;

      if (daysOverdue > 0) {
        // Get loan to get penalty rate
        // For now, using default 5%
        currentPenalty = calculatePenalty(5, emi.emiAmount, daysOverdue);
      }

      return {
        ...emi.toObject(),
        currentPenalty,
        daysOverdue,
      };
    });

    const totalPending = enrichedEMIs.reduce(
      (sum, emi) => sum + emi.emiAmount,
      0,
    );
    const totalPenalty = enrichedEMIs.reduce(
      (sum, emi) => sum + emi.currentPenalty,
      0,
    );

    return res.status(200).json({
      success: true,
      message: "Pending EMIs fetched",
      data: {
        pendingEMIs: enrichedEMIs,
        summary: {
          totalPendingEMIs: enrichedEMIs.length,
          totalPendingAmount: totalPending,
          totalPenaltyDue: totalPenalty,
          totalAmount: totalPending + totalPenalty,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching pending EMIs:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching pending EMIs",
      error: error.message,
    });
  }
};

/**
 * ✅ GET OVERDUE LOANS
 * GET /api/payment/overdue
 */
const getOverdueLoans = async (req, res) => {
  try {
    console.log("📌 getOverdueLoans called");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const overdueEMIs = await EmiSchedule.find({
      status: { $in: ["pending", "partial"] },
      dueDate: { $lt: new Date() },
    })
      .skip(skip)
      .limit(limit)
      .sort({ dueDate: 1 });

    const totalCount = await EmiSchedule.countDocuments({
      status: { $in: ["pending", "partial"] },
      dueDate: { $lt: new Date() },
    });

    // Enrich with customer and loan details
    const enrichedData = await Promise.all(
      overdueEMIs.map(async (emi) => {
        const customer = await Customer.findById(emi.customerId).select(
          "name mobile",
        );
        const loan = await Loan.findById(emi.loanId).select("penaltyRate");

        const daysOverdue = calculateDaysOverdue(emi.dueDate);
        const penalty = calculatePenalty(
          loan?.penaltyRate || 5,
          emi.emiAmount,
          daysOverdue,
        );

        return {
          ...emi.toObject(),
          customerName: customer?.name,
          customerMobile: customer?.mobile,
          daysOverdue,
          penalty,
          totalDue: emi.emiAmount + penalty,
        };
      }),
    );

    const totalOverdueAmount = enrichedData.reduce(
      (sum, item) => sum + item.totalDue,
      0,
    );

    return res.status(200).json({
      success: true,
      message: "Overdue loans fetched",
      data: enrichedData,
      summary: {
        totalOverdueLoans: totalCount,
        totalOverdueAmount,
        averageOverdueAmount: (totalOverdueAmount / totalCount).toFixed(2),
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching overdue loans:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching overdue loans",
      error: error.message,
    });
  }
};

/**
 * ✅ GET PAYMENT STATISTICS
 * GET /api/payment/stats
 */
const getPaymentStats = async (req, res) => {
  try {
    console.log("📌 getPaymentStats called");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's collections
    const todayCollections = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: today },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amountPaid" },
          count: { $sum: 1 },
        },
      },
    ]);

    // This month's collections
    const monthCollections = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: thisMonth },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amountPaid" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Total collections
    const totalCollections = await Payment.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amountPaid" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Pending verifications
    const pendingVerifications = await Payment.countDocuments({
      status: "pending",
    });

    // Failed payments
    const failedPayments = await Payment.countDocuments({ status: "failed" });

    // Total penalties collected
    const penaltyStats = await Payment.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: null,
          totalPenalty: { $sum: "$penaltyAmount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Payment statistics",
      data: {
        todayCollections: {
          totalAmount: todayCollections[0]?.totalAmount || 0,
          transactionCount: todayCollections[0]?.count || 0,
        },
        monthCollections: {
          totalAmount: monthCollections[0]?.totalAmount || 0,
          transactionCount: monthCollections[0]?.count || 0,
        },
        totalCollections: {
          totalAmount: totalCollections[0]?.totalAmount || 0,
          transactionCount: totalCollections[0]?.count || 0,
        },
        totalPenaltyCollected: penaltyStats[0]?.totalPenalty || 0,
        pendingVerifications,
        failedPayments,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching payment stats:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching payment statistics",
      error: error.message,
    });
  }
};

module.exports = {
  recordPayment,
  verifyPayment,
  getPaymentHistory,
  getPendingEMIs,
  getOverdueLoans,
  getPaymentStats,
  calculatePenalty,
  calculateDaysOverdue,
};

console.log("✅ paymentController.js loaded");

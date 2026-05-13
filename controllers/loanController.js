const Loan = require("../models/Loan");
const EmiSchedule = require("../models/EmiSchedule");
const Customer = require("../models/Customer");
const {
  generateLoanId,
  generateEmiScheduleId,
} = require("../utils/idGenerator");
const { addDays, format } = require("date-fns");

/**
 * ✅ DISBURSE NEW LOAN
 * POST /api/loan/disburse
 */
const disburseLoan = async (req, res) => {
  try {
    const validatedData = req.validatedData;
    const { customerId, disbursedAmount, totalEmi, startDate } = validatedData;

    // 1️⃣ Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 2️⃣ Check customer status
    if (customer.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Cannot disburse loan. Customer status is ${customer.status}`,
      });
    }

    // 3️⃣ Calculate EMI and deduction
    const deductionPercentage = validatedData.deductionPercentage || 10;
    const deductionAmount = Math.round(
      (disbursedAmount * deductionPercentage) / 100,
    );
    const actualAmountGiven = disbursedAmount - deductionAmount;

    // EMI = Actual Amount / Total EMIs
    const emiAmount = Math.round(actualAmountGiven / totalEmi);

    // 4️⃣ Generate Loan ID
    const loanId = await generateLoanId();
    const _id = `loan_${loanId.split("_")[2]}`;

    // 5️⃣ Parse start date
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date format",
      });
    }

    // 6️⃣ Create Loan Document
    const newLoan = new Loan({
      _id,
      loanId,
      customerId,
      accountNumber: customer.accountNumber,
      disbursedAmount,
      deductionPercentage,
      deductionAmount,
      actualAmountGiven,
      emiAmount,
      totalEmi,
      emiFrequency: validatedData.emiFrequency || "every 8 days",
      startDate: parsedStartDate,
      dueDate: addDays(parsedStartDate, totalEmi * 8), // 8 days × total EMI
      status: "active",
      completedEmi: 0,
      remainingEmi: totalEmi,
      penaltyRate: validatedData.penaltyRate || 5,
      totalPenalty: 0,
      createdByAdmin: req.adminId || "system",
      editHistory: [],
    });

    // Save loan
    await newLoan.save();

    // 7️⃣ Generate EMI Schedule (automatically)
    const emiSchedules = [];
    let currentDate = parsedStartDate;

    for (let i = 1; i <= totalEmi; i++) {
      currentDate = addDays(currentDate, 8); // हर 8 दिन बाद

      const emiScheduleId = generateEmiScheduleId(loanId, i);

      const schedule = {
        _id: emiScheduleId,
        loanId,
        emiNumber: i,
        dueDate: currentDate,
        amount: emiAmount,
        status: "pending",
        totalAmount: emiAmount, // बिना penalty के
        paidDate: null,
        paidAmount: 0,
        penaltyAmount: 0,
        paymentMethod: null,
        paidByAdmin: null,
        notes: null,
      };

      emiSchedules.push(schedule);
    }

    // Bulk insert EMI schedules
    await EmiSchedule.insertMany(emiSchedules);

    // 8️⃣ Update customer loan count
    customer.totalLoansCount += 1;
    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Loan disbursed successfully with EMI schedule",
      data: {
        loanId: newLoan.loanId,
        customerId: newLoan.customerId,
        disbursedAmount: newLoan.disbursedAmount,
        actualAmountGiven: newLoan.actualAmountGiven,
        emiAmount: newLoan.emiAmount,
        totalEmi: newLoan.totalEmi,
        startDate: newLoan.startDate,
        dueDate: newLoan.dueDate,
        status: newLoan.status,
        emiScheduleGenerated: totalEmi,
        createdAt: newLoan.createdAt,
      },
    });
  } catch (error) {
    console.error("Error disbursing loan:", error);

    return res.status(500).json({
      success: false,
      message: "Error disbursing loan",
      error: error.message,
    });
  }
};

/**
 * ✅ GET ALL LOANS (Pagination + Filters)
 * GET /api/loan/list?page=1&limit=10&status=active&customerId=cust_001
 */
const getAllLoans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const customerId = req.query.customerId;
    const search = req.query.search;

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (search) {
      filter.$or = [
        { loanId: { $regex: search, $options: "i" } },
        { customerId: { $regex: search, $options: "i" } },
        { accountNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch loans
    const loans = await Loan.find(filter)
      .skip(skip)
      .limit(limit)
      .lean()
      .sort({ createdAt: -1 });

    // Get total count
    const totalCount = await Loan.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      message: "Loans fetched successfully",
      data: loans,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching loans:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching loans",
      error: error.message,
    });
  }
};

/**
 * ✅ GET SINGLE LOAN WITH EMI SCHEDULE
 * GET /api/loan/:loanId
 */
const getLoanById = async (req, res) => {
  try {
    const { loanId } = req.params;

    // Fetch loan
    const loan = await Loan.findOne({ loanId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // Fetch EMI schedule
    const emiSchedules = await EmiSchedule.find({ loanId })
      .sort({ emiNumber: 1 })
      .lean();

    // Calculate statistics
    const paidEmis = emiSchedules.filter((e) => e.status === "paid").length;
    const overdueEmis = emiSchedules.filter(
      (e) => e.status === "overdue",
    ).length;
    const pendingEmis = emiSchedules.filter(
      (e) => e.status === "pending",
    ).length;
    const totalPaid = emiSchedules.reduce(
      (sum, e) => sum + (e.paidAmount || 0),
      0,
    );
    const totalDue = emiSchedules
      .filter((e) => e.status === "pending" || e.status === "overdue")
      .reduce((sum, e) => sum + e.totalAmount, 0);

    return res.status(200).json({
      success: true,
      message: "Loan details fetched",
      data: {
        loan,
        emiSchedules,
        statistics: {
          paidEmis,
          overdueEmis,
          pendingEmis,
          totalPaid,
          totalDue,
          completionPercentage:
            ((paidEmis / loan.totalEmi) * 100).toFixed(2) + "%",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching loan:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching loan",
      error: error.message,
    });
  }
};

/**
 * ✅ GET CUSTOMER'S ALL LOANS
 * GET /api/loan/customer/:customerId
 */
const getLoansByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch loans
    const loans = await Loan.find({ customerId })
      .skip(skip)
      .limit(limit)
      .lean()
      .sort({ createdAt: -1 });

    const totalCount = await Loan.countDocuments({ customerId });
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      message: `Loans for customer ${customerId} fetched`,
      data: {
        customer: {
          customerId: customer._id,
          name: customer.name,
          mobile: customer.mobile,
        },
        loans,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching customer loans:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching loans",
      error: error.message,
    });
  }
};

/**
 * ✅ UPDATE LOAN STATUS
 * PUT /api/loan/:loanId/status
 */
const updateLoanStatus = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ["active", "completed", "hold", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Find loan
    const loan = await Loan.findOne({ loanId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // Store old value for edit history
    const oldStatus = loan.status;

    // Update status
    loan.status = status;
    loan.updatedByAdmin = req.adminId || "system";

    // Add to edit history
    loan.editHistory.push({
      fieldChanged: "status",
      oldValue: oldStatus,
      newValue: status,
      changedBy: req.adminId || "system",
      changedAt: new Date(),
      notes,
    });

    await loan.save();

    return res.status(200).json({
      success: true,
      message: "Loan status updated successfully",
      data: {
        loanId: loan.loanId,
        status: loan.status,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating loan status:", error);

    return res.status(500).json({
      success: false,
      message: "Error updating loan status",
      error: error.message,
    });
  }
};

/**
 * ✅ GET LOAN STATISTICS
 * GET /api/loan/stats/overview
 */
const getLoanStats = async (req, res) => {
  try {
    const totalLoans = await Loan.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: "active" });
    const completedLoans = await Loan.countDocuments({ status: "completed" });
    const holdLoans = await Loan.countDocuments({ status: "hold" });

    // Aggregate loan amounts
    const loanStats = await Loan.aggregate([
      {
        $group: {
          _id: null,
          totalDisbursed: { $sum: "$disbursedAmount" },
          totalActualGiven: { $sum: "$actualAmountGiven" },
          totalDeduction: { $sum: "$deductionAmount" },
          totalPenalty: { $sum: "$totalPenalty" },
          avgEmiAmount: { $avg: "$emiAmount" },
        },
      },
    ]);

    const stats = loanStats[0] || {
      totalDisbursed: 0,
      totalActualGiven: 0,
      totalDeduction: 0,
      totalPenalty: 0,
      avgEmiAmount: 0,
    };

    return res.status(200).json({
      success: true,
      message: "Loan statistics",
      data: {
        loanCounts: {
          totalLoans,
          activeLoans,
          completedLoans,
          holdLoans,
        },
        financialData: {
          totalDisbursed: Math.round(stats.totalDisbursed),
          totalActualGiven: Math.round(stats.totalActualGiven),
          totalDeduction: Math.round(stats.totalDeduction),
          totalPenalty: Math.round(stats.totalPenalty),
          avgEmiAmount: Math.round(stats.avgEmiAmount),
        },
        percentages: {
          completionRate:
            ((completedLoans / totalLoans) * 100).toFixed(2) + "%",
          activeRate: ((activeLoans / totalLoans) * 100).toFixed(2) + "%",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching loan stats:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

/**
 * ✅ GET EMI SCHEDULE FOR A LOAN
 * GET /api/loan/:loanId/emi-schedule
 */
const getEmiSchedule = async (req, res) => {
  try {
    const { loanId } = req.params;

    // Check if loan exists
    const loan = await Loan.findOne({ loanId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // Fetch EMI schedule
    const emiSchedules = await EmiSchedule.find({ loanId })
      .sort({ emiNumber: 1 })
      .lean();

    // Group by status
    const groupedByStatus = {
      paid: emiSchedules.filter((e) => e.status === "paid"),
      pending: emiSchedules.filter((e) => e.status === "pending"),
      overdue: emiSchedules.filter((e) => e.status === "overdue"),
    };

    return res.status(200).json({
      success: true,
      message: "EMI schedule fetched",
      data: {
        loanId,
        totalEmi: loan.totalEmi,
        emiAmount: loan.emiAmount,
        emiFrequency: loan.emiFrequency,
        schedule: emiSchedules,
        summary: {
          paidCount: groupedByStatus.paid.length,
          pendingCount: groupedByStatus.pending.length,
          overdueCount: groupedByStatus.overdue.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching EMI schedule:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching EMI schedule",
      error: error.message,
    });
  }
};

module.exports = {
  disburseLoan,
  getAllLoans,
  getLoanById,
  getLoansByCustomerId,
  updateLoanStatus,
  getLoanStats,
  getEmiSchedule,
};

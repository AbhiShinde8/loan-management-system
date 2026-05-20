const Loan = require("../models/Loan");
const Customer = require("../models/Customer");

const createLoan = async (req, res) => {
  try {
    const {
      customerId,
      loanAmount,
      loanTenure,
      interestRate,
      loanPurpose,
      disbursementDate,
    } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customer.cibilScore < 600) {
      return res.status(403).json({
        success: false,
        message: "CIBIL score too low. Minimum required: 600",
      });
    }

    const loanId = "LOAN_" + Date.now();
    const monthlyRate = interestRate / 12 / 100;
    const emi = Math.round(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTenure)) /
        (Math.pow(1 + monthlyRate, loanTenure) - 1),
    );

    const newLoan = new Loan({
      _id: loanId,
      customerId,
      loanAmount,
      loanTenure,
      interestRate,
      loanPurpose,
      disbursementDate: new Date(disbursementDate),
      emiAmount: emi,
      totalEmiCount: loanTenure,
      paidEmiCount: 0,
      status: "active",
    });

    await newLoan.save();

    customer.totalLoansCount += 1;
    customer.activeLoansCount += 1;
    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Loan created successfully",
      data: {
        loanId,
        customerId,
        loanAmount,
        emiAmount: emi,
        status: "active",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating loan",
      error: error.message,
    });
  }
};

const getAllLoans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await Loan.countDocuments();
    const loans = await Loan.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customerId", "name email mobile");

    return res.status(200).json({
      success: true,
      message: "Loans fetched successfully",
      data: loans,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching loans",
      error: error.message,
    });
  }
};

const getLoanDetails = async (req, res) => {
  try {
    const { loanId } = req.params;
    const loan = await Loan.findById(loanId).populate("customerId");

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Loan details fetched successfully",
      data: loan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching loan",
      error: error.message,
    });
  }
};

const updateLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const loan = await Loan.findByIdAndUpdate(loanId, req.body, { new: true });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: loan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating loan",
      error: error.message,
    });
  }
};

const recordPayment = async (req, res) => {
  try {
    const {
      customerId,
      loanId,
      emiNumber,
      amountPaid,
      paymentMethod,
      paymentDate,
    } = req.body;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    if (emiNumber > loan.totalEmiCount) {
      return res.status(400).json({
        success: false,
        message: `EMI number cannot exceed ${loan.totalEmiCount}`,
      });
    }

    loan.payments = loan.payments || [];
    loan.payments.push({
      emiNumber,
      amountPaid,
      paymentMethod,
      paymentDate: new Date(paymentDate),
      recordedAt: new Date(),
    });

    loan.paidEmiCount = emiNumber;

    if (emiNumber === loan.totalEmiCount) {
      loan.status = "completed";
    }

    await loan.save();

    return res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        loanId,
        customerId,
        emiNumber,
        amountPaid,
        loanStatus: loan.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error recording payment",
      error: error.message,
    });
  }
};

const getCustomerLoans = async (req, res) => {
  try {
    const { customerId } = req.params;
    const loans = await Loan.find({ customerId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Customer loans fetched successfully",
      data: loans,
      count: loans.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching customer loans",
      error: error.message,
    });
  }
};

const getLoanStats = async (req, res) => {
  try {
    const totalLoans = await Loan.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: "active" });
    const completedLoans = await Loan.countDocuments({ status: "completed" });

    return res.status(200).json({
      success: true,
      message: "Loan statistics",
      data: {
        totalLoans,
        activeLoans,
        completedLoans,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching loan statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createLoan,
  getAllLoans,
  getLoanDetails,
  updateLoan,
  recordPayment,
  getCustomerLoans,
  getLoanStats,
};

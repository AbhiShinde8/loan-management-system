const Customer = require("../models/Customer");

const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      address,
      occupation,
      monthlyIncome,
      cibilScore,
    } = req.body;

    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer with this email or mobile already exists",
      });
    }

    const customerId = "CUST_" + Date.now();

    const newCustomer = new Customer({
      _id: customerId,
      name,
      email,
      mobile,
      address,
      occupation,
      monthlyIncome,
      cibilScore,
      status: "active",
      totalLoansCount: 0,
      activeLoansCount: 0,
    });

    await newCustomer.save();

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        customerId,
        name,
        email,
        mobile,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating customer",
      error: error.message,
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await Customer.countDocuments();
    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching customers",
      error: error.message,
    });
  }
};

const getCustomerDetails = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer details fetched successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching customer",
      error: error.message,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findByIdAndUpdate(customerId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating customer",
      error: error.message,
    });
  }
};

const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: "active" });

    return res.status(200).json({
      success: true,
      message: "Customer statistics",
      data: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers: totalCustomers - activeCustomers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const customers = await Customer.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { mobile: { $regex: q, $options: "i" } },
      ],
    }).limit(20);

    return res.status(200).json({
      success: true,
      message: "Search results",
      data: customers,
      count: customers.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error searching customers",
      error: error.message,
    });
  }
};

module.exports = {
  createCustomer,
  getCustomerDetails,
  getAllCustomers,
  updateCustomer,
  getCustomerStats,
  searchCustomers,
};

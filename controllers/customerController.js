const Customer = require("../models/Customer");

// Import ID generator functions
let generateCustomerId;
let generateAccountNumber;

try {
  const idGenerator = require("../utils/idGenerator");
  generateCustomerId = idGenerator.generateCustomerId;
  generateAccountNumber = idGenerator.generateAccountNumber;

  console.log("✅ idGenerator functions imported successfully");
  console.log("   - generateCustomerId:", typeof generateCustomerId);
  console.log("   - generateAccountNumber:", typeof generateAccountNumber);
} catch (error) {
  console.error("❌ Error importing idGenerator:", error.message);
  console.error("   Stack:", error.stack);
  process.exit(1);
}

/**
 * ✅ CREATE NEW CUSTOMER
 * POST /api/customer/create
 */
const createCustomer = async (req, res) => {
  try {
    console.log("📌 createCustomer called");
    console.log("   Request body:", req.body);

    const validatedData = req.validatedData;
    console.log("✅ Validated data:", validatedData);

    // Check if mobile already exists
    const existingCustomer = await Customer.findOne({
      mobile: validatedData.mobile,
    });

    if (existingCustomer) {
      console.log(
        "⚠️ Customer with mobile already exists:",
        validatedData.mobile,
      );
      return res.status(409).json({
        success: false,
        message: "Customer with this mobile number already exists",
        data: null,
      });
    }

    // Generate unique IDs
    console.log("🆔 Generating Customer ID...");
    const customerId = await generateCustomerId();
    console.log("✅ Customer ID generated:", customerId);

    console.log("🆔 Generating Account Number...");
    const accountNumber = await generateAccountNumber();
    console.log("✅ Account Number generated:", accountNumber);

    // Create customer object
    const newCustomer = new Customer({
      _id: customerId,
      name: validatedData.name,
      address: validatedData.address,
      mobile: validatedData.mobile,
      referencePersonName: validatedData.referencePersonName,
      referencePersonMobile: validatedData.referencePersonMobile,
      referencePersonAddress: validatedData.referencePersonAddress,
      accountNumber,
      createdByAdmin: req.adminId || "system",
      status: "active",
      totalLoansCount: 0,
      currentOverdueCount: 0,
    });

    console.log("💾 Saving customer to database...");
    await newCustomer.save();
    console.log("✅ Customer saved successfully");

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        customerId: newCustomer._id,
        name: newCustomer.name,
        mobile: newCustomer.mobile,
        accountNumber: newCustomer.accountNumber,
        createdAt: newCustomer.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error creating customer:", error.message);
    console.error("   Stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Error creating customer",
      error: error.message,
    });
  }
};

/**
 * ✅ GET ALL CUSTOMERS
 */
const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { accountNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const customers = await Customer.find(filter)
      .skip(skip)
      .limit(limit)
      .select("-createdByAdmin")
      .lean()
      .sort({ createdAt: -1 });

    const totalCount = await Customer.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: customers,
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
    console.error("❌ Error fetching customers:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching customers",
      error: error.message,
    });
  }
};

/**
 * ✅ GET SINGLE CUSTOMER BY ID
 */
const getCustomerById = async (req, res) => {
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
      message: "Customer details fetched",
      data: customer,
    });
  } catch (error) {
    console.error("❌ Error fetching customer:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching customer",
      error: error.message,
    });
  }
};

/**
 * ✅ GET CUSTOMER BY MOBILE
 */
const getCustomerByMobile = async (req, res) => {
  try {
    const { mobile } = req.params;

    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number format",
      });
    }

    const customer = await Customer.findOne({ mobile });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found with this mobile number",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer fetched by mobile",
      data: customer,
    });
  } catch (error) {
    console.error("❌ Error fetching customer by mobile:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching customer",
      error: error.message,
    });
  }
};

/**
 * ✅ UPDATE CUSTOMER
 */
const updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const validatedData = req.validatedData;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (validatedData.mobile && validatedData.mobile !== customer.mobile) {
      const existingMobile = await Customer.findOne({
        mobile: validatedData.mobile,
        _id: { $ne: customerId },
      });

      if (existingMobile) {
        return res.status(409).json({
          success: false,
          message: "Mobile number already in use by another customer",
        });
      }
    }

    Object.keys(validatedData).forEach((key) => {
      if (validatedData[key] !== undefined) {
        customer[key] = validatedData[key];
      }
    });

    customer.updatedAt = new Date();
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: {
        customerId: customer._id,
        name: customer.name,
        mobile: customer.mobile,
        status: customer.status,
        updatedAt: customer.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error updating customer:", error);

    return res.status(500).json({
      success: false,
      message: "Error updating customer",
      error: error.message,
    });
  }
};

/**
 * ✅ DELETE CUSTOMER (Soft delete)
 */
const deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.status = "inactive";
    customer.updatedAt = new Date();

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: {
        customerId: customer._id,
        status: customer.status,
      },
    });
  } catch (error) {
    console.error("❌ Error deleting customer:", error);

    return res.status(500).json({
      success: false,
      message: "Error deleting customer",
      error: error.message,
    });
  }
};

/**
 * ✅ GET CUSTOMER STATISTICS
 */
const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: "active" });
    const inactiveCustomers = await Customer.countDocuments({
      status: "inactive",
    });
    const suspendedCustomers = await Customer.countDocuments({
      status: "suspended",
    });
    const overdueCustomers = await Customer.countDocuments({
      currentOverdueCount: { $gt: 0 },
    });

    return res.status(200).json({
      success: true,
      message: "Customer statistics",
      data: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        suspendedCustomers,
        overdueCustomers,
        statistics: {
          activePercentage:
            totalCustomers > 0
              ? ((activeCustomers / totalCustomers) * 100).toFixed(2) + "%"
              : "0%",
          overduePercentage:
            totalCustomers > 0
              ? ((overdueCustomers / totalCustomers) * 100).toFixed(2) + "%"
              : "0%",
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching customer stats:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByMobile,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
};

console.log("✅ customerController.js loaded successfully");

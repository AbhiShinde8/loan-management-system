const Joi = require("joi");

// ========================================
// CUSTOMER VALIDATION SCHEMAS
// ========================================

const customerValidationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim().messages({
    "string.empty": "Customer name is required",
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),

  address: Joi.string().min(5).max(250).required().trim().messages({
    "string.empty": "Address is required",
    "string.min": "Address must be at least 5 characters",
  }),

  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Mobile must be exactly 10 digits",
      "string.empty": "Mobile is required",
    }),

  referencePersonName: Joi.string().min(2).max(100).required().trim().messages({
    "string.empty": "Reference person name is required",
  }),

  referencePersonMobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Reference mobile must be 10 digits",
    }),

  referencePersonAddress: Joi.string()
    .min(5)
    .max(250)
    .required()
    .trim()
    .messages({
      "string.empty": "Reference address is required",
    }),
});

const customerUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim(),

  address: Joi.string().min(5).max(250).trim(),

  mobile: Joi.string().pattern(/^[0-9]{10}$/),

  referencePersonName: Joi.string().min(2).max(100).trim(),

  referencePersonMobile: Joi.string().pattern(/^[0-9]{10}$/),

  referencePersonAddress: Joi.string().min(5).max(250).trim(),

  status: Joi.string().valid("active", "inactive", "suspended"),
}).min(1);

// ========================================
// LOAN VALIDATION SCHEMAS
// ========================================

const loanValidationSchema = Joi.object({
  customerId: Joi.string().required().messages({
    "string.empty": "Customer ID is required",
  }),

  disbursedAmount: Joi.number()
    .integer()
    .min(1000)
    .max(500000)
    .required()
    .messages({
      "number.min": "Loan amount must be at least ₹1000",
      "number.max": "Loan amount cannot exceed ₹500000",
    }),

  deductionPercentage: Joi.number().min(0).max(100).default(10).messages({
    "number.min": "Deduction percentage cannot be less than 0",
    "number.max": "Deduction percentage cannot exceed 100",
  }),

  totalEmi: Joi.number().integer().min(1).max(36).default(10).messages({
    "number.min": "EMI count must be at least 1",
    "number.max": "EMI count cannot exceed 36",
  }),

  emiFrequency: Joi.string()
    .valid("every 8 days", "every 15 days", "every 30 days")
    .default("every 8 days"),

  startDate: Joi.date().required().messages({
    "date.base": "Start date must be a valid date",
  }),

  penaltyRate: Joi.number().min(0).max(100).default(5),
});

const updateLoanStatusSchema = Joi.object({
  status: Joi.string()
    .valid("active", "completed", "hold", "cancelled")
    .required()
    .messages({
      "any.only": "Status must be one of: active, completed, hold, cancelled",
    }),

  notes: Joi.string().max(500).optional(),
});

module.exports = {
  customerValidationSchema,
  customerUpdateSchema,
  loanValidationSchema,
  updateLoanStatusSchema,
};

const express = require('express');
const router = express.Router();
const validateRequest = require('../middleware/validateRequest');
const {
  customerValidationSchema,
  customerUpdateSchema
} = require('../middleware/validationSchema');
const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByMobile,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
} = require('../controllers/customerController');

console.log('✅ Customer routes loading...');

// 📊 STATS (पहले define करो)
router.get('/stats/overview', getCustomerStats);

// 📝 CREATE CUSTOMER
router.post(
  '/create',
  validateRequest(customerValidationSchema),
  createCustomer
);

// 📋 GET ALL CUSTOMERS
router.get('/list', getAllCustomers);

// 📍 GET BY MOBILE
router.get('/mobile/:mobile', getCustomerByMobile);

// 🔍 GET SINGLE CUSTOMER BY ID
router.get('/:customerId', getCustomerById);

// ✏️ UPDATE CUSTOMER
router.put(
  '/:customerId',
  validateRequest(customerUpdateSchema),
  updateCustomer
);

// 🗑️ DELETE CUSTOMER
router.delete('/:customerId', deleteCustomer);

console.log('✅ Customer routes loaded successfully');

module.exports = router;
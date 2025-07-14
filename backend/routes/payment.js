const express = require('express');
const router = express.Router();
const { createInvoiceAndSession } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Only clients can create invoices/pay
router.post('/invoice', protect, authorize('client'), createInvoiceAndSession);

// Stripe webhook route REMOVED from here. It is now handled directly in server.js.

module.exports = router;

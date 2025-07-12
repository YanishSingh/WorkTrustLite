const express = require('express');
const router = express.Router();
const { createInvoiceAndSession, handleStripeWebhook } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Only clients can create invoices/pay
router.post('/invoice', protect, authorize('client'), createInvoiceAndSession);

// Stripe webhook (called by Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;

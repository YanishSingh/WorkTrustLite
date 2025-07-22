const express = require('express');
const router = express.Router();
const { createInvoiceAndSession, payInvoiceSession } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Only clients can create invoices/pay
router.post('/invoice', protect, authorize('client'), createInvoiceAndSession);

// Client pays an existing invoice
router.post('/invoice/:invoiceId', protect, authorize('client'), payInvoiceSession);

// Stripe webhook route REMOVED from here. It is now handled directly in server.js.

module.exports = router;

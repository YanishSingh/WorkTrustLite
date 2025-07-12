const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices } = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Client creates invoice
router.post('/', protect, authorize('client'), createInvoice);

// Client/Freelancer view invoices
router.get('/', protect, getInvoices);

module.exports = router;

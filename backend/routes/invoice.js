const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getFreelancerInvoices,
  getClientInvoices
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Freelancer creates invoice for client
router.post('/', protect, authorize('freelancer'), createInvoice);

// Freelancer views invoices they created
router.get('/freelancer', protect, authorize('freelancer'), getFreelancerInvoices);

// Client views invoices assigned to them
router.get('/client', protect, authorize('client'), getClientInvoices);

module.exports = router;

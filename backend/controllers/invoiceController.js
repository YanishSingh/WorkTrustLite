const Invoice = require('../models/Invoice');
const { logActivity } = require('../utils/logger');

// Create new invoice (clients only)
exports.createInvoice = async (req, res) => {
  try {
    const { freelancerId, amount, description } = req.body;
    if (!freelancerId || !amount) return res.status(400).json({ msg: 'Missing data.' });

    const invoice = await Invoice.create({
      client: req.user.id,
      freelancer: freelancerId,
      amount,
      description,
    });

    logActivity(req.user.id, 'create_invoice', { invoiceId: invoice._id, amount });
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ msg: 'Could not create invoice', error: err.message });
  }
};

// Get invoices for current user (client or freelancer)
exports.getInvoices = async (req, res) => {
  try {
    const filter = req.user.role === 'client'
      ? { client: req.user.id }
      : { freelancer: req.user.id };

    const invoices = await Invoice.find(filter)
      .populate('client', 'name email')
      .populate('freelancer', 'name email');

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ msg: 'Could not fetch invoices', error: err.message });
  }
};

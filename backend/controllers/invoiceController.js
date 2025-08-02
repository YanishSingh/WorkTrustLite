const Invoice = require('../models/Invoice');
const { logActivity } = require('../utils/logger');
const { sendMail } = require('../utils/mailer');
const User = require('../models/User');

// Create new invoice (freelancers only)
exports.createInvoice = async (req, res) => {
  try {
    // Only freelancers can create invoices
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ msg: 'Only freelancers can create invoices.' });
    }
    const { clientId, amount, description, dueDate } = req.body;
    
    // Debug logging to see what we're receiving
    console.log('=== Invoice Creation Debug ===');
    console.log('Request body:', req.body);
    console.log('dueDate value:', dueDate);
    console.log('dueDate type:', typeof dueDate);
    console.log('dueDate truthy:', !!dueDate);
    console.log('Parsed date:', dueDate ? new Date(dueDate) : 'No date');
    console.log('================');
    
    if (!clientId || !amount) return res.status(400).json({ msg: 'Missing data.' });

    const invoiceData = {
      client: clientId,
      freelancer: req.user.id,
      amount,
      description,
    };
    
    // Only add dueDate if it exists and is not empty
    if (dueDate && dueDate.trim() !== '') {
      invoiceData.dueDate = new Date(dueDate);
    }
    
    console.log('Final invoice data:', invoiceData);
    
    const invoice = await Invoice.create(invoiceData);

    // Send email to client
    const client = await User.findById(clientId);
    if (client && client.email) {
      await sendMail(
        client.email,
        'New Invoice from WorkTrust Lite',
        `You have received a new invoice from your freelancer.\n\nAmount: $${amount}\nDescription: ${description || '-'}\nDue Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : '-'}\n\nPlease log in to your account to review and pay the invoice.`,
      );
    }

    logActivity(req.user.id, 'create_invoice', { invoiceId: invoice._id, amount });
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ msg: 'Could not create invoice', error: err.message });
  }
};

// Get invoices created by the freelancer
exports.getFreelancerInvoices = async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ msg: 'Only freelancers can view their created invoices.' });
    }
    const invoices = await Invoice.find({ freelancer: req.user.id })
      .populate('client', 'name email')
      .populate('freelancer', 'name email');
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ msg: 'Could not fetch invoices', error: err.message });
  }
};

// Get invoices assigned to the client
exports.getClientInvoices = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ msg: 'Only clients can view their received invoices.' });
    }
    const invoices = await Invoice.find({ client: req.user.id })
      .populate('client', 'name email')
      .populate('freelancer', 'name email');
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ msg: 'Could not fetch invoices', error: err.message });
  }
};

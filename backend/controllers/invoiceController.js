const Invoice = require('../models/Invoice');
const { logActivity } = require('../utils/logger');
const { sendMail } = require('../utils/mailer');
const User = require('../models/User');
const { validateAndSanitizeDescription } = require('../utils/inputValidator');

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

    // Validate and sanitize description
    let sanitizedDescription = '';
    if (description) {
      const descriptionValidation = validateAndSanitizeDescription(description, 'Description');
      if (!descriptionValidation.isValid) {
        return res.status(400).json({ msg: descriptionValidation.error });
      }
      sanitizedDescription = descriptionValidation.sanitizedValue;
    }

    const invoiceData = {
      client: clientId,
      freelancer: req.user.id,
      amount,
      description: sanitizedDescription,
    };
    
    // Only add dueDate if it exists and is not empty
    if (dueDate && dueDate.trim() !== '') {
      const parsedDueDate = new Date(dueDate);
      
      // Validate that due date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
      
      if (parsedDueDate < today) {
        return res.status(400).json({ 
          msg: 'Due date cannot be in the past. Please select a future date.' 
        });
      }
      
      invoiceData.dueDate = parsedDueDate;
    }
    
    console.log('Final invoice data:', invoiceData);
    
    const invoice = await Invoice.create(invoiceData);

    // Send email to client
    const client = await User.findById(clientId);
    if (client && client.email) {
      // Get decrypted email for sending
      const decryptedEmail = client.getDecryptedEmail();
      if (decryptedEmail) {
        await sendMail(
          decryptedEmail,
          'New Invoice from WorkTrust Lite',
          `You have received a new invoice from your freelancer.\n\nAmount: $${amount}\nDescription: ${description || '-'}\nDue Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : '-'}\n\nPlease log in to your account to review and pay the invoice.`,
        );
      }
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
    
    // Decrypt emails in populated user data
    const invoicesWithDecryptedEmails = invoices.map(invoice => {
      const invoiceObj = invoice.toObject();
      if (invoiceObj.client && invoiceObj.client.email) {
        const client = new User(invoiceObj.client);
        invoiceObj.client.email = client.getDecryptedEmail() || invoiceObj.client.email;
      }
      if (invoiceObj.freelancer && invoiceObj.freelancer.email) {
        const freelancer = new User(invoiceObj.freelancer);
        invoiceObj.freelancer.email = freelancer.getDecryptedEmail() || invoiceObj.freelancer.email;
      }
      return invoiceObj;
    });
    
    res.json(invoicesWithDecryptedEmails);
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
    
    // Decrypt emails in populated user data
    const invoicesWithDecryptedEmails = invoices.map(invoice => {
      const invoiceObj = invoice.toObject();
      if (invoiceObj.client && invoiceObj.client.email) {
        const client = new User(invoiceObj.client);
        invoiceObj.client.email = client.getDecryptedEmail() || invoiceObj.client.email;
      }
      if (invoiceObj.freelancer && invoiceObj.freelancer.email) {
        const freelancer = new User(invoiceObj.freelancer);
        invoiceObj.freelancer.email = freelancer.getDecryptedEmail() || invoiceObj.freelancer.email;
      }
      return invoiceObj;
    });
    
    res.json(invoicesWithDecryptedEmails);
  } catch (err) {
    res.status(500).json({ msg: 'Could not fetch invoices', error: err.message });
  }
};

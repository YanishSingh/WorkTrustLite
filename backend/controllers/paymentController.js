const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { logActivity } = require('../utils/logger');

// Create Invoice & Payment Session (Client triggers this)
exports.createInvoiceAndSession = async (req, res) => {
  try {
    const { freelancerId, amount, description } = req.body;
    const clientId = req.user.id;

    // Validate amount (no zero/negative payments)
    if (!amount || amount <= 0) return res.status(400).json({ msg: 'Amount must be positive.' });

    // Create invoice in DB (status: pending)
    const invoice = await Invoice.create({
      client: clientId,
      freelancer: freelancerId,
      amount,
      description,
    });

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Invoice from WorkTrust Lite` },
          unit_amount: Math.round(amount * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: { invoiceId: invoice._id.toString() },
    });

    invoice.stripeSessionId = session.id;
    await invoice.save();

    logActivity(clientId, 'create_invoice', { invoiceId: invoice._id, amount });
    res.json({ sessionId: session.id, invoiceId: invoice._id });
  } catch (err) {
    res.status(500).json({ msg: 'Stripe session creation failed.', error: err.message });
  }
};

// Stripe webhook to mark invoice as paid
exports.handleStripeWebhook = async (req, res) => {
  let event = req.body;

  // If you set a Stripe webhook secret, verify signature here.
  // For demo, we skip it for local dev.

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const invoiceId = session.metadata.invoiceId;

      const invoice = await Invoice.findById(invoiceId);
      if (invoice) {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        await invoice.save();

        logActivity(invoice.client, 'invoice_paid', { invoiceId, amount: invoice.amount });
      }
    }
    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

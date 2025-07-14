const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { logActivity } = require('../utils/logger');

/**
 * Create Invoice & Stripe Checkout Session (called by client)
 */
exports.createInvoiceAndSession = async (req, res) => {
  try {
    const { freelancerId, amount, description } = req.body;
    const clientId = req.user.id;

    // Validate input
    if (!freelancerId || !amount || amount <= 0) {
      return res.status(400).json({ msg: 'Freelancer and positive amount required.' });
    }

    // Create Invoice in DB (status: pending)
    const invoice = await Invoice.create({
      client: clientId,
      freelancer: freelancerId,
      amount,
      description,
      status: 'pending',
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Invoice from WorkTrust Lite' },
          unit_amount: Math.round(amount * 100),
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
    console.error('Error creating invoice/session:', err);
    res.status(500).json({ msg: 'Stripe session creation failed.', error: err.message });
  }
};

/**
 * Stripe Webhook Handler
 * Handles events from Stripe (called by Stripe CLI or Stripe server).
 * For local dev: event = req.body (raw).
 * For prod: use stripe.webhooks.constructEvent() and verify signature.
 */
exports.handleStripeWebhook = async (req, res) => {
  let event;
  const sig = req.headers['stripe-signature'];

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Received Stripe webhook event:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const invoiceId = session.metadata && session.metadata.invoiceId;
      if (!invoiceId) {
        console.warn('No invoiceId in Stripe session metadata');
        return res.json({ received: true });
      }
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        console.warn('No invoice found for id:', invoiceId);
        return res.json({ received: true });
      }
      if (invoice.status !== 'paid') {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        await invoice.save();
        logActivity(invoice.client, 'invoice_paid', { invoiceId, amount: invoice.amount });
        console.log('Invoice marked as paid:', invoiceId);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    res.status(500).json({ error: err.message });
  }
};

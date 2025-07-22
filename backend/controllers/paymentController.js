const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { logActivity } = require('../utils/logger');
const { sendMail } = require('../utils/mailer');

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
 * Create Stripe Checkout Session for existing invoice (client pays)
 */
exports.payInvoiceSession = async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;
    const clientId = req.user.id;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ msg: 'Invoice not found.' });
    const invoiceClientId = (typeof invoice.client === 'object' && invoice.client !== null)
      ? invoice.client._id.toString()
      : invoice.client.toString();
    console.log('DEBUG: Invoice client id:', invoiceClientId, 'Current user:', clientId.toString());
    if (invoiceClientId !== clientId.toString()) return res.status(403).json({ msg: 'Not authorized to pay this invoice.' });
    if (invoice.status !== 'pending') return res.status(400).json({ msg: 'Invoice is not pending.' });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Invoice from WorkTrust Lite' },
          unit_amount: Math.round(invoice.amount * 100),
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: { invoiceId: invoice._id.toString() },
    });

    invoice.stripeSessionId = session.id;
    await invoice.save();

    logActivity(clientId, 'pay_invoice', { invoiceId: invoice._id, amount: invoice.amount });
    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('Error creating Stripe session for invoice:', err);
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
      const invoice = await Invoice.findById(invoiceId).populate('client freelancer', 'email name');
      if (!invoice) {
        console.warn('No invoice found for id:', invoiceId);
        return res.json({ received: true });
      }
      if (invoice.status !== 'paid') {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        await invoice.save();
        logActivity(invoice.client._id, 'invoice_paid', { invoiceId, amount: invoice.amount });
        console.log('Invoice marked as paid:', invoiceId);
        // Send email notifications
        if (invoice.client?.email) {
          await sendMail(
            invoice.client.email,
            'Invoice Paid - WorkTrust Lite',
            `Your payment for invoice $${invoice.amount} to ${invoice.freelancer?.name || 'the freelancer'} has been received.\n\nThank you for using WorkTrust Lite!`
          );
        }
        if (invoice.freelancer?.email) {
          await sendMail(
            invoice.freelancer.email,
            'Invoice Paid - WorkTrust Lite',
            `Your invoice for $${invoice.amount} has been paid by ${invoice.client?.name || 'the client'}.\n\nThank you for using WorkTrust Lite!`
          );
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    res.status(500).json({ error: err.message });
  }
};

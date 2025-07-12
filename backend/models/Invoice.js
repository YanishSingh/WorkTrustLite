const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  stripeSessionId: String,  // For Stripe session tracking
  paidAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);

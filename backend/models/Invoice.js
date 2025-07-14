const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending',
    index: true,
  },
  stripeSessionId: {
    type: String,
    index: true,
  },
  paidAt: Date,
}, { timestamps: true });

// Populate user names/emails by default on find queries
invoiceSchema.pre(/^find/, function (next) {
  this.populate('client', 'name email')
      .populate('freelancer', 'name email');
  next();
});

// Prevent model overwrite in watch mode
module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

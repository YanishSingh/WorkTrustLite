const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const paymentController = require('./controllers/paymentController');

// 1. Webhook route FIRST, with express.raw
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);

// 2. All other middleware/routes AFTER
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

// Test route
app.get('/', (req, res) => res.send('API Running Securely'));

//routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/payment', require('./routes/payment')); // This will NOT include the webhook anymore
app.use('/api/invoice', require('./routes/invoice'));

app.use(errorHandler);

// Mongo connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

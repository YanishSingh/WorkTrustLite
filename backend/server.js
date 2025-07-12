const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

app.use('/api/payment/webhook', express.raw({type: 'application/json'}));

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Test route
app.get('/', (req, res) => res.send('API Running Securely'));

//routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/invoice', require('./routes/invoice'));



app.use(errorHandler);

// Mongo connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB error:', err));

// TODO: Import and use routes here

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

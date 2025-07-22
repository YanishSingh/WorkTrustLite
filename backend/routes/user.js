const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  resetExpiredPassword, 
  getFreelancers,
  getClients // <-- Add this controller function!
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Authenticated user profile routes
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);

// Endpoint for changing expired password (if needed)
router.put('/reset-password-expired', resetExpiredPassword);

// === GET all freelancers for dropdown ===
router.get('/freelancers', protect, getFreelancers); // <-- New endpoint!

// === GET all clients for dropdown ===
router.get('/clients', protect, require('../controllers/userController').getClients);

module.exports = router;

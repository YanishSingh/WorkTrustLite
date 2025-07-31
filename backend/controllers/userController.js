const User = require('../models/User');
const { logActivity } = require('../utils/logger');
const { 
  validateNewPassword, 
  comparePassword, 
  updateUserPassword 
} = require('../utils/passwordValidator');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Get User Profile Controller
 * Returns user profile data (excluding sensitive fields)
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -mfaSecret -passwordHistory -otpExpiry');
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        msg: MESSAGES.USER_NOT_FOUND 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.error('Get profile error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to retrieve profile' 
    });
  }
};

// UPDATE user profile (fields + password)
exports.updateProfile = async (req, res) => {
  const { name, bio, avatar, password, currentPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ msg: 'User not found.' });

  // Fields
  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (avatar) user.avatar = avatar;

  // Password change logic
  if (password) {
    if (!currentPassword)
      return res.status(400).json({ msg: 'Current password required.' });
    if (!(await bcrypt.compare(currentPassword, user.password)))
      return res.status(400).json({ msg: 'Current password incorrect.' });

    const msg = await validateNewPassword(user, password);
    if (msg) return res.status(400).json({ msg });

    // Hash & update history (keep 5)
    const newHash = await bcrypt.hash(password, 12);
    user.passwordHistory = [...(user.passwordHistory || []).slice(-4), user.password]; // 4+1
    user.password = newHash;
    user.passwordChangedAt = new Date();
    user.passwordExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    user.loginCountSincePasswordChange = 0; // Reset login count
  }

  await user.save();
  logActivity(user._id, 'update_profile', { fields: Object.keys(req.body) });
  res.json({ msg: 'Profile updated.' });
};

// FORCE password change (for password expiry)
exports.forcePasswordChange = async (req, res) => {
  const { userId, newPassword, currentPassword } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ msg: 'User not found.' });

  if (!currentPassword)
    return res.status(400).json({ msg: 'Current password required.' });
  if (!(await bcrypt.compare(currentPassword, user.password)))
    return res.status(400).json({ msg: 'Current password incorrect.' });

  const msg = await validateNewPassword(user, newPassword);
  if (msg) return res.status(400).json({ msg });

  const newHash = await bcrypt.hash(newPassword, 12);
  user.passwordHistory = [...(user.passwordHistory || []).slice(-4), user.password]; // 4+1
  user.password = newHash;
  user.passwordChangedAt = new Date();
  user.passwordExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  user.loginCountSincePasswordChange = 0; // Reset login count

  await user.save();
  logActivity(user._id, 'force_password_change', {});
  res.json({ msg: 'Password changed. Please log in again.' });
};

exports.resetExpiredPassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword)
      return res.status(400).json({ msg: "All fields required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });

    // Enforce password policy
    if (newPassword.length < 8) {
      return res.status(400).json({ msg: "Password must be at least 8 characters" });
    }
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
    if (!pattern.test(newPassword)) {
      return res.status(400).json({ msg: "Password must have uppercase, lowercase, number, symbol" });
    }

    const newHashed = await bcrypt.hash(newPassword, 12);
    // Optionally check password history, update expiry, etc
    user.password = newHashed;
    user.passwordChangedAt = new Date();
    user.passwordExpiry = new Date(Date.now() + 90*24*60*60*1000); // 90 days
    user.loginCountSincePasswordChange = 0;
    user.passwordHistory = [newHashed, ...(user.passwordHistory || [])].slice(0, 5);

    await user.save();
    res.json({ msg: "Password updated! Please log in." });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getFreelancers = async (req, res) => {
  try {
    const freelancers = await require('../models/User').find(
      { role: 'freelancer' }, // filter by freelancer role
      '_id name email' // only send these fields
    );
    res.json(freelancers);
  } catch (err) {
    res.status(500).json({ msg: 'Could not fetch freelancers' });
  }
};

exports.getClients = async (req, res) => {
  try {
    const clients = await require('../models/User').find(
      { role: 'client' },
      '_id name email'
    );
    res.json(clients);
  } catch (err) {
    res.status(500).json({ msg: 'Could not fetch clients' });
  }
};
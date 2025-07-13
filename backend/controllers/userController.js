const User = require('../models/User');
const bcrypt = require('bcryptjs');
const zxcvbn = require('zxcvbn');
const { logActivity } = require('../utils/logger');

// GET user profile (safe fields)
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -mfaSecret -passwordHistory');
  if (!user) return res.status(404).json({ msg: 'User not found.' });
  res.json(user);
};

// UPDATE user profile or password
exports.updateProfile = async (req, res) => {
  const { name, bio, avatar, password, currentPassword } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) return res.status(404).json({ msg: 'User not found.' });

  // Update normal fields
  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (avatar) user.avatar = avatar;

  // --- Password Change Logic ---
  if (password) {
    if (!currentPassword)
      return res.status(400).json({ msg: 'Current password required.' });

    // Must match current password
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ msg: 'Current password incorrect.' });

    // Length 8-32
    if (password.length < 8 || password.length > 32)
      return res.status(400).json({ msg: 'Password must be 8-32 characters.' });

    // Strength check (zxcvbn)
    const score = zxcvbn(password).score;
    if (score < 3)
      return res.status(400).json({ msg: 'Password too weak.' });

    // Must contain upper, lower, number, symbol
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
    if (!pattern.test(password))
      return res.status(400).json({ msg: 'Password must have upper, lower, number, symbol.' });

    // No reuse of recent N passwords (N=5 here)
    const recentHistory = user.passwordHistory ? user.passwordHistory.slice(-5) : [];
    for (let prev of recentHistory) {
      if (await bcrypt.compare(password, prev))
        return res.status(400).json({ msg: 'Cannot reuse recent password.' });
    }

    // Hash and update
    const newHash = await bcrypt.hash(password, 12);
    // Push current password to history (keep at most 5)
    user.passwordHistory = [...recentHistory, user.password].slice(-5);
    user.password = newHash;
    user.passwordChangedAt = new Date();
    user.passwordExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // +90 days
  }

  await user.save();
  logActivity(user._id, 'update_profile', { fields: Object.keys(req.body) });
  res.json({ msg: 'Profile updated.' });
};

// Optional: Endpoint to force change password on expiry (can be used in forced expiry UI)
exports.forcePasswordChange = async (req, res) => {
  const { userId, newPassword, currentPassword } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ msg: 'User not found.' });

  // Must match current password
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(400).json({ msg: 'Current password incorrect.' });

  // Repeat checks (same as above)
  if (newPassword.length < 8 || newPassword.length > 32)
    return res.status(400).json({ msg: 'Password must be 8-32 characters.' });

  const score = zxcvbn(newPassword).score;
  if (score < 3)
    return res.status(400).json({ msg: 'Password too weak.' });

  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
  if (!pattern.test(newPassword))
    return res.status(400).json({ msg: 'Password must have upper, lower, number, symbol.' });

  // Check recent N history (N=5)
  const recentHistory = user.passwordHistory ? user.passwordHistory.slice(-5) : [];
  for (let prev of recentHistory) {
    if (await bcrypt.compare(newPassword, prev))
      return res.status(400).json({ msg: 'Cannot reuse recent password.' });
  }

  // Hash and update
  const newHash = await bcrypt.hash(newPassword, 12);
  user.passwordHistory = [...recentHistory, user.password].slice(-5);
  user.password = newHash;
  user.passwordChangedAt = new Date();
  user.passwordExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  await user.save();
  logActivity(user._id, 'force_password_change', {});
  res.json({ msg: 'Password changed. Please log in again.' });
};

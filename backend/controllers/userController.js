const User = require('../models/User');
const bcrypt = require('bcryptjs');
const zxcvbn = require('zxcvbn');

// GET user profile (safe fields)
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -mfaSecret -passwordHistory');
  if (!user) return res.status(404).json({ msg: 'User not found.' });
  res.json(user);
};

// UPDATE user profile
exports.updateProfile = async (req, res) => {
  const { name, bio, avatar, password, currentPassword } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) return res.status(404).json({ msg: 'User not found.' });

  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (avatar) user.avatar = avatar;

  // Password change
  if (password) {
    if (!currentPassword)
      return res.status(400).json({ msg: 'Current password required.' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ msg: 'Current password incorrect.' });

    // Check new password against strength policy and history
    if (password.length < 8 || password.length > 32)
      return res.status(400).json({ msg: 'Password must be 8-32 characters.' });

    const score = zxcvbn(password).score;
    if (score < 3)
      return res.status(400).json({ msg: 'Password too weak.' });

    // No recent reuse
    for (let prev of user.passwordHistory.slice(-3)) {
      if (await bcrypt.compare(password, prev))
        return res.status(400).json({ msg: 'Cannot reuse recent password.' });
    }

    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
    if (!pattern.test(password))
      return res.status(400).json({ msg: 'Password must have upper, lower, number, symbol.' });

    const newHash = await bcrypt.hash(password, 12);
    user.password = newHash;
    user.passwordHistory.push(newHash);
    user.passwordChangedAt = new Date();
  }

await user.save();
const { logActivity } = require('../utils/logger');
logActivity(user._id, 'update_profile', { fields: Object.keys(req.body) });
res.json({ msg: 'Profile updated.' });
};

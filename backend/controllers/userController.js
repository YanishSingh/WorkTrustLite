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

    // Decrypt email for response
    const decryptedEmail = user.getDecryptedEmail();
    const userResponse = {
      ...user.toObject(),
      email: decryptedEmail || user.email // Fallback to encrypted if decryption fails
    };

    res.json({
      success: true,
      user: userResponse
    });

  } catch (err) {
    console.error('Get profile error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to retrieve profile' 
    });
  }
};

/**
 * Update User Profile Controller
 * Updates user profile information and optionally changes password
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar, password, currentPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        msg: MESSAGES.USER_NOT_FOUND 
      });
    }

    // Track which fields are being updated
    const updatedFields = [];

    // Update profile fields
    if (name && name.trim() !== user.name) {
      user.name = name.trim();
      updatedFields.push('name');
    }
    
    if (bio !== undefined && bio !== user.bio) {
      user.bio = bio ? bio.trim() : '';
      updatedFields.push('bio');
    }
    
    if (avatar !== undefined && avatar !== user.avatar) {
      user.avatar = avatar;
      updatedFields.push('avatar');
    }

    // Handle password change
    if (password) {
      // Verify current password is provided
      if (!currentPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
          msg: MESSAGES.CURRENT_PASSWORD_REQUIRED 
        });
      }

      // Verify current password is correct
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        logActivity(user._id, 'failed_password_change', { reason: 'incorrect_current_password' });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
          msg: MESSAGES.CURRENT_PASSWORD_INCORRECT 
        });
      }

      // Validate new password
      const passwordError = await validateNewPassword(user, password);
      if (passwordError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ msg: passwordError });
      }

      // Update password using utility function
      await updateUserPassword(user, password);
      updatedFields.push('password');
      
      logActivity(user._id, 'password_changed', { method: 'profile_update' });
    }

    // Save updated user
    await user.save();

    // Log profile update
    if (updatedFields.length > 0) {
      logActivity(user._id, 'profile_updated', { fields: updatedFields });
    }

    res.json({ 
      success: true,
      msg: MESSAGES.PROFILE_UPDATED,
      updatedFields
    });

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to update profile. Please try again.' 
    });
  }
};

/**
 * Force Password Change Controller
 * Forces password change for expired passwords
 */
exports.forcePasswordChange = async (req, res) => {
  try {
    const { userId, newPassword, currentPassword } = req.body;

    // Input validation
    if (!userId || !newPassword || !currentPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'All fields are required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        msg: MESSAGES.USER_NOT_FOUND 
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      logActivity(user._id, 'failed_force_password_change', { reason: 'incorrect_current_password' });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: MESSAGES.CURRENT_PASSWORD_INCORRECT 
      });
    }

    // Validate new password
    const passwordError = await validateNewPassword(user, newPassword);
    if (passwordError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ msg: passwordError });
    }

    // Update password
    await updateUserPassword(user, newPassword);
    await user.save();

    logActivity(user._id, 'force_password_change_successful', {});
    
    res.json({ 
      success: true,
      msg: MESSAGES.PASSWORD_CHANGED 
    });

  } catch (err) {
    console.error('Force password change error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Password change failed. Please try again.' 
    });
  }
};

/**
 * Reset Expired Password Controller
 * Handles password reset for expired passwords
 */
exports.resetExpiredPassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    
    // Input validation
    if (!email || !currentPassword || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: 'All fields are required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        msg: MESSAGES.USER_NOT_FOUND 
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      logActivity(user._id, 'failed_expired_password_reset', { reason: 'incorrect_current_password' });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        msg: MESSAGES.CURRENT_PASSWORD_INCORRECT 
      });
    }

    // Validate new password
    const passwordError = await validateNewPassword(user, newPassword);
    if (passwordError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ msg: passwordError });
    }

    // Update password
    await updateUserPassword(user, newPassword);
    await user.save();

    logActivity(user._id, 'expired_password_reset_successful', {});
    
    res.json({ 
      success: true,
      msg: 'Password updated successfully! Please log in.' 
    });

  } catch (err) {
    console.error('Reset expired password error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Password reset failed. Please try again.' 
    });
  }
};

/**
 * Get Freelancers Controller
 * Returns list of all freelancers (for client use)
 */
exports.getFreelancers = async (req, res) => {
  try {
    const freelancers = await User.find(
      { role: 'freelancer' },
      '_id name email'
    ).sort({ name: 1 });
    
    res.json({
      success: true,
      freelancers
    });

  } catch (err) {
    console.error('Get freelancers error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Could not fetch freelancers' 
    });
  }
};

/**
 * Get Clients Controller
 * Returns list of all clients (for freelancer use)
 */
exports.getClients = async (req, res) => {
  try {
    const clients = await User.find(
      { role: 'client' },
      '_id name email'
    ).sort({ name: 1 });
    
    res.json({
      success: true,
      clients
    });

  } catch (err) {
    console.error('Get clients error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Could not fetch clients' 
    });
  }
};
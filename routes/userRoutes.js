const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');
const { profileUpdatedEmail, passwordChangedEmail } = require('../utils/emailTemplates');

// ─── GET all users — Organizer only ──────────────────────────────────────────
router.get('/', protect, authorize('Organizer'), async (req, res) => {
  try {
    const users = await User.find({}, '-password -loginAttempts -lockUntil -lockCount').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET public exhibitors ────────────────────────────────────────────────────
router.get('/exhibitors', async (req, res) => {
  try {
    const exhibitors = await User.find({ role: 'Exhibitor' }, 'name companyName bio website avatar niche isVerified').sort({ createdAt: -1 });
    res.json(exhibitors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET own profile ──────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, '-password -loginAttempts -lockUntil -lockCount');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── UPDATE own profile (name, companyName, bio, phone, website, avatar) ─────
router.put('/me', protect, async (req, res) => {
  try {
    const { name, companyName, bio, phone, website, avatar, niche } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name)        user.name        = name;
    if (companyName !== undefined) user.companyName = companyName;
    if (bio  !== undefined)        user.bio   = bio;
    if (phone !== undefined)       user.phone = phone;
    if (website !== undefined)     user.website = website;
    if (avatar !== undefined)      user.avatar = avatar;
    if (niche !== undefined)       user.niche = niche;

    const updated = await user.save();

    // Profile update email (non-blocking)
    sendEmail({
      email: updated.email,
      subject: '✏️ Your EventSphere Profile Was Updated',
      message: `Hi ${updated.name}, your EventSphere profile has been successfully updated.`,
      htmlMessage: profileUpdatedEmail(updated.name),
    }).catch(err => console.warn('⚠️ Profile-update email failed:', err.message));

    const { password: _, loginAttempts: __, lockUntil: ___, lockCount: ____, ...safe } = updated.toObject();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
router.put('/me/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both currentPassword and newPassword are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });

    // Password strength check
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    const hasUpper   = /[A-Z]/.test(newPassword);
    const hasLower   = /[a-z]/.test(newPassword);
    const hasNumber  = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    if ([hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length < 2) {
      return res.status(400).json({ message: 'Password is too weak. Include uppercase, lowercase, numbers, or special characters.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Password changed notification (non-blocking)
    sendEmail({
      email: user.email,
      subject: '🔐 Your EventSphere Password Was Changed',
      message: `Hi ${user.name}, your EventSphere account password was just changed.`,
      htmlMessage: passwordChangedEmail(user.name),
    }).catch(err => console.warn('⚠️ Password-change email failed:', err.message));

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── VERIFICATION REQUEST ───────────────────────────────────────────────────────
router.post('/me/verification', protect, async (req, res) => {
  try {
    const { document } = req.body;
    if (!document) return res.status(400).json({ message: 'Verification document is required.' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'Exhibitor') return res.status(403).json({ message: 'Only exhibitors can request verification.' });

    user.verificationStatus = 'Pending';
    user.verificationDocument = document;
    await user.save();

    res.json({ message: 'Verification request submitted successfully.', status: user.verificationStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── VERIFICATION APPROVAL (Organizer only) ───────────────────────────────────
router.put('/:id/verification', protect, authorize('Organizer'), async (req, res) => {
  try {
    const { status } = req.body; // 'Verified' or 'Rejected'
    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verificationStatus = status;
    user.isVerified = (status === 'Verified');
    await user.save();

    res.json({ message: `User verification updated to ${status}.`, isVerified: user.isVerified, status: user.verificationStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE user — Organizer only ────────────────────────────────────────────
router.delete('/:id', protect, authorize('Organizer'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

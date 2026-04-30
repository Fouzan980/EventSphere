const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { welcomeEmail, passwordResetEmail } = require('../utils/emailTemplates');

const MAX_ATTEMPTS = 5;


const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, companyName } = req.body;

    // 1. Duplicate email check
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists. Please log in instead.' });
    }

    // 2. Server-side password strength check
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (strength < 2) {
      return res.status(400).json({ message: 'Password is too weak. Include uppercase, lowercase, numbers, or special characters.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'Attendee',
      companyName
    });

    // Send welcome email (non-blocking)
    sendEmail({
      email: user.email,
      subject: '🎪 Welcome to EventSphere — Account Created!',
      message: `Hi ${user.name}, welcome to EventSphere! Your account has been successfully created.`,
      htmlMessage: welcomeEmail(user.name, user.role)
    }).catch((err) => {
      console.warn('⚠️  Welcome email failed to send:', err.message);
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check lockout
    // Check lockout
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      const remaining = Math.ceil((user.lockUntil - now) / 1000 / 60);
      return res.status(429).json({
        message: `Account is temporarily locked. Try again in ${remaining} minute(s).`,
        lockedUntil: user.lockUntil
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const newAttempts = user.loginAttempts + 1;

      if (newAttempts >= MAX_ATTEMPTS) {
        // Progressive lockout: 1st lockout = 5 mins, 2nd+ = 10 mins
        const newLockCount = user.lockCount + 1;
        const lockMinutes = newLockCount === 1 ? 5 : 10;
        const lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);

        await User.findByIdAndUpdate(user._id, {
          loginAttempts: 0,
          lockUntil,
          lockCount: newLockCount
        });

        return res.status(429).json({
          message: `Too many failed attempts. Account locked for ${lockMinutes} minutes.`,
          lockedUntil: lockUntil
        });
      }

      await User.findByIdAndUpdate(user._id, { loginAttempts: newAttempts });
      const remaining = MAX_ATTEMPTS - newAttempts;
      return res.status(401).json({
        message: `Invalid email or password. ${remaining} attempt(s) remaining before lockout.`
      });
    }

    // Success – reset attempts
    await User.findByIdAndUpdate(user._id, { loginAttempts: 0, lockUntil: null });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: '🔒 EventSphere — Password Reset Request',
      message: `You requested a password reset. Please go to this link: ${resetUrl}`,
      htmlMessage: typeof passwordResetEmail === 'function' ? passwordResetEmail(user.name, resetUrl) : `<p>Reset URL: <a href="${resetUrl}">${resetUrl}</a></p>`
    });

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────
router.post('/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    // Server-side password strength check
    const password = req.body.password;
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset completely successful. You may now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

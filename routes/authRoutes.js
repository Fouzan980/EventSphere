const express = require('express');
const router = express.Router();

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/$/, '');
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  if (host.includes('fouzan.me') || host.startsWith('13.233.109.185')) {
    return 'https://fouzan.me/projects/eventsphere';
  }
  if (req.originalUrl.startsWith('/projects/eventsphere')) {
    return `${proto}://${host}/projects/eventsphere`;
  }
  return `${proto}://${host}`;
};

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { welcomeEmail, passwordResetEmail, verificationEmail } = require('../utils/emailTemplates');

const MAX_ATTEMPTS = 5;

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'yopmail.com', 'tempmail.com', 'temp-mail.org', 
  'getnada.com', 'guerrillamail.com', 'sharklasers.com', 'dispostable.com', 
  '10minutemail.com', 'boun.cr', 'trashmail.com', 'yopmail.fr', 'yopmail.net'
];

const validateRegisterInput = (data) => {
  const { name, email, password, role, companyName } = data;
  
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    return 'Name must be between 2 and 50 characters.';
  }
  // Allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name.trim())) {
    return 'Name contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed.';
  }

  if (!email || typeof email !== 'string') {
    return 'Email is required.';
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  
  const domain = email.trim().split('@')[1]?.toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return 'Disposable email addresses are not allowed. Please use a valid personal or corporate email.';
  }

  if (!role || !['Organizer', 'Exhibitor', 'Attendee'].includes(role)) {
    return 'Invalid role specified.';
  }

  if (role === 'Exhibitor' && (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2 || companyName.trim().length > 100)) {
    return 'Company Name is required for exhibitors and must be between 2 and 100 characters.';
  }

  // Password validation
  if (!password || typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const strengthCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (strengthCount < 3) {
    return 'Password must contain at least three of the following: uppercase, lowercase, numbers, or special characters.';
  }

  return null;
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    // 1. Enterprise validation
    const validationError = validateRegisterInput(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { name, email, password, role, companyName } = req.body;

    // 2. Duplicate email check
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists. Please log in instead.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Verification token generation
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'Attendee',
      companyName: role === 'Exhibitor' ? companyName.trim() : undefined,
      isVerified: false,
      verificationToken: hashedVerificationToken,
      verificationTokenExpire
    });

    // 4. Send verification email (non-blocking)
    const origin = getFrontendUrl(req);
    // Link goes to backend GET endpoint → verifies token → redirects to frontend
    const verificationUrl = `${origin}/api/auth/verify-email/${verificationToken}`;

    sendEmail({
      email: user.email,
      subject: '✉️ Verify your EventSphere Account',
      message: `Hi ${user.name}, please verify your account by visiting: ${verificationUrl}`,
      htmlMessage: verificationEmail(user.name, verificationUrl)
    }).catch((err) => {
      console.warn('⚠️ Verification email failed to send:', err.message);
    });

    res.status(201).json({
      message: 'Registration successful! Please check your email inbox to verify your account.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/verify-email/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      const frontendUrl = getFrontendUrl(req);
      return res.redirect(`${frontendUrl}/verify-email?error=invalid`);
    }

    user.isVerified = true;
    user.verificationStatus = 'Verified';
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    const frontendUrl = getFrontendUrl(req);
    return res.redirect(`${frontendUrl}/verify-email?success=1`);
  } catch (error) {
    const frontendUrl = getFrontendUrl(req);
    return res.redirect(`${frontendUrl}/verify-email?error=server`);
  }
});

// POST version kept for backward compatibility (called from frontend JS)
router.post('/verify-email/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationStatus = 'Verified';
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.json({ message: 'Your email has been successfully verified! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── RESEND VERIFICATION EMAIL ────────────────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return 200 for security to prevent user enumeration, but with a friendly message
      return res.json({ message: 'If an account exists with this email, a new verification link has been sent.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This email is already verified. Please log in.' });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    user.verificationToken = hashedVerificationToken;
    user.verificationTokenExpire = verificationTokenExpire;
    await user.save();

    const origin = getFrontendUrl(req);
    // Link goes to backend GET endpoint → verifies token → redirects to frontend
    const verificationUrl = `${origin}/api/auth/verify-email/${verificationToken}`;

    sendEmail({
      email: user.email,
      subject: '✉️ Verify your EventSphere Account',
      message: `Hi ${user.name}, please verify your account by visiting: ${verificationUrl}`,
      htmlMessage: verificationEmail(user.name, verificationUrl)
    }).catch((err) => {
      console.warn('⚠️ Verification email failed to send:', err.message);
    });

    res.json({ message: 'A new verification link has been sent to your email.' });
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

    // Check verification status before logging in
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Your email address is not verified. Please verify your email to log in.',
        isVerified: false,
        email: user.email
      });
    }

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

    const origin = getFrontendUrl(req);
    const resetUrl = `${origin}/reset-password/${resetToken}`;

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

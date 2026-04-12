const path    = require('path');
const dotenv  = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const User     = require('../models/User');
const auth     = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/sendEmail');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please provide name, email and password' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: 'Email already registered' });
    }

    const salt           = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verifyToken  = crypto.randomBytes(32).toString('hex');
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      name,
      email,
      password:          hashedPassword,
      verifyToken,
      verifyTokenExpiry: verifyExpiry,
      isVerified:        false,
    });

    await user.save();

    await sendVerificationEmail(email, name, verifyToken);

    return res.status(201).json({
      msg: 'Registration successful! Please check your email to verify your account.'
    });

  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ msg: err.message });
  }
});

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ msg: 'Verification token missing' });
    }

    const user = await User.findOne({
      verifyToken:       token,
      verifyTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired verification token' });
    }

    user.isVerified        = true;
    user.verifyToken       = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();

    return res.json({ msg: 'Email verified successfully! You can now login.' });

  } catch (err) {
    console.error('Verify error:', err.message);
    return res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ msg: 'Please verify your email before logging in. Check your inbox.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ msg: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -verifyToken -verifyTokenExpiry');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
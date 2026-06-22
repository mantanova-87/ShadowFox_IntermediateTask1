const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Order, SupportTicket } = require('../models');
const { jwtSecret, jwtExpiresIn, bcryptRounds } = require('../config/env');
const { sendEmail } = require('../utils/email');

const generateToken = () => crypto.randomBytes(32).toString('hex');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error('Email is already in use');
      err.statusCode = 400;
      return next(err);
    }

    const passwordHash = await bcrypt.hash(password, parseInt(bcryptRounds, 10));
    const verifyToken = generateToken();

    const user = new User({
      name,
      email,
      passwordHash,
      verifyToken
    });

    await user.save();

    // Send Verification Email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify/${verifyToken}`;
    const emailHtml = `
      <h1>Welcome to E-Bazar!</h1>
      <p>Hi ${user.name},</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `;

    // Fire and forget email (or await it depending on strictness)
    sendEmail({
      to: user.email,
      subject: 'Verify your E-Bazar account',
      html: emailHtml
    }).catch(err => console.error('Failed to send verification email:', err));

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      return next(err);
    }

    if (user.status === 'banned' || user.status === 'suspended') {
      const err = new Error('Your account is blocked. Please contact support.');
      err.statusCode = 403;
      return next(err);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      return next(err);
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.cookie('auth_token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verifyToken: token });

    if (!user) {
      return res.status(400).send('<h1>Invalid or expired verification link</h1>');
    }

    user.isVerified = true;
    user.verifyToken = undefined;
    await user.save();

    res.send('<h1>Email verified successfully! You can now log in.</h1><a href="/">Go Home</a>');
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return success even if not found to prevent email enumeration
      return res.json({ success: true, message: 'If the email exists, a reset link was sent.' });
    }

    const resetToken = generateToken();
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    const emailHtml = `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: emailHtml
    });

    res.json({ success: true, message: 'If the email exists, a reset link was sent.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      const err = new Error('Invalid or expired reset token');
      err.statusCode = 400;
      return next(err);
    }

    user.passwordHash = await bcrypt.hash(password, parseInt(bcryptRounds, 10));
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // BR-03: Account Deletion Guard
    // Check pending orders (not delivered, not cancelled, not refunded)
    const pendingOrders = await Order.countDocuments({
      customer: userId,
      status: { $nin: ['delivered', 'cancelled', 'returned'] }
    });

    if (pendingOrders > 0) {
      const err = new Error('Cannot delete account: You have pending orders.');
      err.statusCode = 400;
      return next(err);
    }

    // Check open support tickets
    const openTickets = await SupportTicket.countDocuments({
      customer: userId,
      status: { $in: ['open', 'in_review', 'escalated'] }
    });

    if (openTickets > 0) {
      const err = new Error('Cannot delete account: You have open support tickets.');
      err.statusCode = 400;
      return next(err);
    }

    await User.deleteOne({ _id: userId });

    // Clear session
    res.cookie('auth_token', '', { httpOnly: true, expires: new Date(0) });
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

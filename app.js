const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');

const { env, adminPath } = require('./config/env');

const app = express();

// ── Global Middlewares ────────────────────────────────────────────────────────
app.use(cors());
app.use(cookieParser());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logging
if (env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ── View Engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    db: dbStates[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',     require('./routes/authRoutes'));
app.use('/api/v1/products', require('./routes/productRoutes'));
app.use('/api/v1/cart',     require('./routes/cartRoutes'));
app.use('/api/v1/orders',   require('./routes/orderRoutes'));
app.use('/api/v1/seller',   require('./routes/sellerRoutes'));
app.use('/api/v1/chat',     require('./routes/chatRoutes'));

// ── Admin Panel (hidden URL from .env) ────────────────────────────────────────
app.use(`${adminPath}/api`, require('./routes/adminRoutes'));

// ── Page Routes ───────────────────────────────────────────────────────────────
const { auth, optionalAuth } = require('./middleware/auth');

app.get('/', optionalAuth, (req, res) => {
  res.render('customer/home', {
    title: 'E-Bazar — Online Marketplace',
    description: 'Discover thousands of products at unbeatable prices.',
    user: req.user || null,
  });
});

app.get('/account', auth, (req, res) => {
  res.render('customer/profile', {
    title: 'My Account — E-Bazar',
    description: 'Manage your E-Bazar account, orders, and settings.',
    user: req.user,
  });
});

app.get('/seller/register', auth, (req, res) => {
  res.render('seller/register', {
    title: 'Become a Seller — E-Bazar',
    description: 'Start selling on E-Bazar and reach millions of customers.',
    user: req.user,
  });
});

// Admin dashboard page (hidden)
app.get(adminPath, auth, (req, res) => {
  if (req.user?.role !== 'admin') return res.redirect('/');
  res.render('admin/dashboard', {
    title: 'Admin Dashboard — E-Bazar',
    description: 'E-Bazar administration panel.',
    user: req.user,
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  // Render EJS 404 for page requests, JSON for API
  if (req.accepts('html') && !req.path.startsWith('/api/')) {
    return res.status(404).render('errors/404', {
      title: 'Page Not Found — E-Bazar',
      description: 'The page you are looking for does not exist.',
      user: null,
    });
  }
  res.status(404).json({ success: false, error: 'Resource not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (env !== 'production') console.error(err.stack);

  if (req.accepts('html') && !req.path.startsWith('/api/')) {
    return res.status(statusCode).render('errors/error', {
      title: `Error ${statusCode} — E-Bazar`,
      description: message,
      statusCode,
      message,
      user: null,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env !== 'production' && { stack: err.stack }),
  });
});

module.exports = app;

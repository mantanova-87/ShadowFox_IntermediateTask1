const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');

const { env } = require('./config/env');

const app = express();

// Global Middlewares
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
// Add local upload folder support for dev
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Set View Engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Layout support via express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Core Health Check Endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    db: dbStates[dbStatus] || 'unknown',
    timestamp: new Date()
  });
});

// Root Route - Temp greeting placeholder before we wire view pages
app.get('/', (req, res) => {
  res.render('customer/home', { title: 'Welcome to E-Bazar' });
});

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found'
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  if (env !== 'production') {
    console.error(err.stack);
  }
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env !== 'production' && { stack: err.stack })
  });
});

module.exports = app;

const { body, validationResult } = require('express-validator');

// Reusable validation result checker
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If we have an array of errors, pick the first one's msg
    const err = new Error(errors.array()[0].msg);
    err.statusCode = 400;
    return next(err);
  }
  next();
};

// Password policy: min 8 chars, uppercase, digit, special char
const passwordPolicy = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
  .matches(/[0-9]/).withMessage('Password must contain at least one number')
  .matches(/[\W_]/).withMessage('Password must contain at least one special character');

// Signup validation
const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  passwordPolicy,
  validateResult
];

// Login validation
const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateResult
];

// Reset password validation
const resetPasswordValidation = [
  passwordPolicy,
  validateResult
];

module.exports = {
  signupValidation,
  loginValidation,
  resetPasswordValidation,
  passwordPolicy,
  validateResult
};

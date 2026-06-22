const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { signupValidation, loginValidation, resetPasswordValidation } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

router.post('/signup', signupValidation, authController.signup);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);

router.get('/verify/:token', authController.verifyEmail);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, authController.resetPassword);

router.delete('/account', auth, authController.deleteAccount);

module.exports = router;

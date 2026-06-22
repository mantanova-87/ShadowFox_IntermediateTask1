const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { auth } = require('../middleware/auth');
const { sellerApproved } = require('../middleware/roleGuard');

// Any authenticated user can apply to become a seller
router.post('/register', auth, sellerController.registerSeller);

// Seller-only routes
router.get('/dashboard', auth, sellerApproved, sellerController.getDashboard);
router.get('/orders', auth, sellerApproved, sellerController.getSellerOrders);
router.get('/inventory', auth, sellerApproved, sellerController.getInventory);

module.exports = router;

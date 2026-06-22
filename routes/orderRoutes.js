const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth } = require('../middleware/auth');
const { sellerApproved } = require('../middleware/roleGuard');
const upload = require('../middleware/upload');

// Customer routes
router.post('/checkout', auth, orderController.checkout);
router.get('/', auth, orderController.listOrders);
router.get('/:id', auth, orderController.getOrder);
router.post('/:id/return', auth, upload.array('images', 4), orderController.requestReturn);

// Seller routes
router.patch('/:id/status', auth, sellerApproved, orderController.updateOrderStatus);
router.patch('/:id/return', auth, sellerApproved, orderController.handleReturn);

module.exports = router;

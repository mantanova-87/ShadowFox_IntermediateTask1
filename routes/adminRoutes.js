const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// All admin routes require JWT + admin role
router.use(auth, roleGuard('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Users
router.get('/users', adminController.listUsers);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.patch('/users/:userId/seller', adminController.approveSeller);

// Products
router.get('/products', adminController.listProducts);
router.delete('/products/:productId', adminController.removeProduct);

// Support Tickets
router.get('/tickets', adminController.listTickets);
router.patch('/tickets/:ticketId', adminController.updateTicket);

// Coupons
router.get('/coupons', adminController.listCoupons);
router.post('/coupons', adminController.createCoupon);
router.delete('/coupons/:couponId', adminController.deleteCoupon);

module.exports = router;

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth } = require('../middleware/auth');
const { roleGuard, sellerApproved } = require('../middleware/roleGuard');
const upload = require('../middleware/upload');

// Public routes
router.get('/', productController.listProducts);
router.get('/compare', productController.compareProducts);
router.get('/:id', productController.getProduct);
router.post('/search/voice', productController.voiceSearch);
router.post('/search/image', upload.single('image'), productController.imageSearch);

// Seller routes
router.post('/', auth, sellerApproved, upload.array('images', 8), productController.createProduct);
router.patch('/:id', auth, sellerApproved, productController.updateProduct);
router.delete('/:id', auth, sellerApproved, productController.deleteProduct);

module.exports = router;

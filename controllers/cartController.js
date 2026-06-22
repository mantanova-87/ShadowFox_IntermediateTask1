const { Cart, Product } = require('../models');

/* ─── GET CART ───────────────────────────────────────────────────────── */
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ customer: req.user._id })
      .populate('items.product', 'title price images status stock');
    if (!cart) cart = { items: [], subtotal: 0, total: 0, itemCount: 0 };
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

/* ─── ADD ITEM ───────────────────────────────────────────────────────── */
exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found'); err.statusCode = 404; return next(err);
    }
    if (product.stock === 0 || product.status === 'out_of_stock') {
      const err = new Error('Product is out of stock'); err.statusCode = 400; return next(err);
    }
    if (quantity > product.stock) {
      const err = new Error(`Only ${product.stock} units available`); err.statusCode = 400; return next(err);
    }

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) cart = new Cart({ customer: req.user._id, items: [] });

    const existing = cart.items.find(i => i.product.toString() === productId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + Number(quantity), product.stock);
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

/* ─── UPDATE ITEM QTY ────────────────────────────────────────────────── */
exports.updateItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) { const err = new Error('Cart not found'); err.statusCode = 404; return next(err); }

    const item = cart.items.find(i => i.product.toString() === req.params.productId);
    if (!item) { const err = new Error('Item not in cart'); err.statusCode = 404; return next(err); }

    if (Number(quantity) < 1) {
      cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    } else {
      item.quantity = Number(quantity);
    }
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

/* ─── REMOVE ITEM ────────────────────────────────────────────────────── */
exports.removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) { const err = new Error('Cart not found'); err.statusCode = 404; return next(err); }
    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

/* ─── CLEAR CART ─────────────────────────────────────────────────────── */
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({ customer: req.user._id });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
};

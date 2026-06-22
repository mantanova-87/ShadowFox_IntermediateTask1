const { Order, Cart, Product, Coupon, Notification } = require('../models');

/* ─── CHECKOUT ───────────────────────────────────────────────────────── */
exports.checkout = async (req, res, next) => {
  try {
    const { shippingAddress, couponCode } = req.body;

    const cart = await Cart.findOne({ customer: req.user._id })
      .populate('items.product', 'title price stock status seller');
    if (!cart || cart.items.length === 0) {
      const err = new Error('Cart is empty'); err.statusCode = 400; return next(err);
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (!item.product || item.product.status === 'out_of_stock' || item.product.stock < item.quantity) {
        const err = new Error(`"${item.product?.title}" is unavailable or has insufficient stock`);
        err.statusCode = 400; return next(err);
      }
    }

    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && !coupon.isExpired) {
        const subtotalForCoupon = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
        discount = coupon.calculateDiscount(subtotalForCoupon);
        coupon.usageCount += 1;
        await coupon.save();
      }
    }

    const items = cart.items.map(i => ({
      product: i.product._id,
      seller: i.product.seller,
      title: i.product.title,
      price: i.product.price,
      quantity: i.quantity,
    }));
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = Math.max(0, subtotal - discount);

    // Decrement stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    const order = new Order({
      customer: req.user._id,
      items,
      shippingAddress,
      couponCode: couponCode?.toUpperCase(),
      discount,
      subtotal,
      total,
      paymentStatus: 'pending',
    });
    await order.save();

    // Clear cart
    await Cart.findOneAndDelete({ customer: req.user._id });

    // Notify customer
    await Notification.create({
      recipient: req.user._id,
      type: 'order_placed',
      message: `Your order #${order._id} has been placed successfully.`,
      relatedDoc: order._id,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
};

/* ─── LIST OWN ORDERS ────────────────────────────────────────────────── */
exports.listOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find({ customer: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Order.countDocuments({ customer: req.user._id }),
    ]);
    res.json({ success: true, data: orders, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) { next(err); }
};

/* ─── GET ORDER DETAIL ───────────────────────────────────────────────── */
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id })
      .populate('items.product', 'title images');
    if (!order) { const err = new Error('Order not found'); err.statusCode = 404; return next(err); }
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

/* ─── SUBMIT RETURN REQUEST ──────────────────────────────────────────── */
exports.requestReturn = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) { const err = new Error('Order not found'); err.statusCode = 404; return next(err); }
    if (order.status !== 'delivered') {
      const err = new Error('Only delivered orders can be returned'); err.statusCode = 400; return next(err);
    }
    const images = (req.files || []).map(f => f.path);
    order.status = 'return_requested';
    order.returnReason = req.body.reason;
    if (images.length) order.returnImages = images;
    await order.save();
    res.json({ success: true, message: 'Return request submitted', data: order });
  } catch (err) { next(err); }
};

/* ─── SELLER: UPDATE ORDER STATUS ────────────────────────────────────── */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['processing', 'shipped', 'delivered'];
    if (!allowed.includes(status)) {
      const err = new Error(`Invalid status. Allowed: ${allowed.join(', ')}`); err.statusCode = 400; return next(err);
    }
    // Find order where this seller has at least one item
    const order = await Order.findOne({ _id: req.params.id, 'items.seller': req.user._id });
    if (!order) { const err = new Error('Order not found'); err.statusCode = 404; return next(err); }
    order.status = status;
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

/* ─── SELLER: HANDLE RETURN ──────────────────────────────────────────── */
exports.handleReturn = async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    const order = await Order.findOne({ _id: req.params.id, 'items.seller': req.user._id });
    if (!order) { const err = new Error('Order not found'); err.statusCode = 404; return next(err); }
    if (order.status !== 'return_requested') {
      const err = new Error('No pending return request'); err.statusCode = 400; return next(err);
    }
    order.status = action === 'accept' ? 'returned' : 'delivered';
    if (action === 'accept') order.paymentStatus = 'refunded';
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

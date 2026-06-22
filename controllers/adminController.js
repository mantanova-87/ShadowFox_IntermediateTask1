const { User, Product, Order, Coupon, SupportTicket } = require('../models');
const { sendEmail } = require('../utils/email');

/* ─── DASHBOARD ──────────────────────────────────────────────────────── */
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalSellers, totalProducts, totalOrders, pendingSellers, openTickets] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments({}),
      User.countDocuments({ sellerStatus: 'pending' }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_review', 'escalated'] } }),
    ]);
    res.json({ success: true, data: { totalUsers, totalSellers, totalProducts, totalOrders, pendingSellers, openTickets } });
  } catch (err) { next(err); }
};

/* ─── LIST USERS ─────────────────────────────────────────────────────── */
exports.listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, q } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) { next(err); }
};

/* ─── BAN / SUSPEND / ACTIVATE USER ─────────────────────────────────── */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      const err = new Error('Invalid status'); err.statusCode = 400; return next(err);
    }
    const user = await User.findByIdAndUpdate(req.params.userId, { status }, { new: true }).select('-passwordHash');
    if (!user) { const err = new Error('User not found'); err.statusCode = 404; return next(err); }
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

/* ─── APPROVE / REJECT SELLER ────────────────────────────────────────── */
exports.approveSeller = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const user = await User.findById(req.params.userId);
    if (!user || user.sellerStatus !== 'pending') {
      const err = new Error('No pending seller application found'); err.statusCode = 404; return next(err);
    }

    if (action === 'approve') {
      user.role = 'seller';
      user.sellerStatus = 'approved';
    } else {
      user.sellerStatus = 'rejected';
    }
    await user.save();

    const subject = action === 'approve' ? 'Seller Application Approved!' : 'Seller Application Update';
    const html = action === 'approve'
      ? `<h2>Congratulations ${user.name}!</h2><p>Your seller application has been approved. You can now list products on E-Bazar.</p>`
      : `<h2>Hi ${user.name},</h2><p>Unfortunately, your seller application has been rejected. Contact support for more information.</p>`;

    sendEmail({ to: user.email, subject, html }).catch(console.error);

    res.json({ success: true, message: `Seller ${action}d`, data: user });
  } catch (err) { next(err); }
};

/* ─── LIST PRODUCTS (admin view) ─────────────────────────────────────── */
exports.listProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).populate('seller', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, data: products, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) { next(err); }
};

/* ─── REMOVE PRODUCT ─────────────────────────────────────────────────── */
exports.removeProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.productId, { status: 'unpublished' }, { new: true });
    if (!product) { const err = new Error('Product not found'); err.statusCode = 404; return next(err); }
    res.json({ success: true, message: 'Product removed from listing' });
  } catch (err) { next(err); }
};

/* ─── LIST SUPPORT TICKETS ───────────────────────────────────────────── */
exports.listTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).populate('customer', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      SupportTicket.countDocuments(filter),
    ]);
    res.json({ success: true, data: tickets, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) { next(err); }
};

/* ─── UPDATE TICKET STATUS ───────────────────────────────────────────── */
exports.updateTicket = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.ticketId,
      { ...(status && { status }), ...(adminNotes && { adminNotes }) },
      { new: true }
    );
    if (!ticket) { const err = new Error('Ticket not found'); err.statusCode = 404; return next(err); }
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

/* ─── CREATE COUPON ──────────────────────────────────────────────────── */
exports.createCoupon = async (req, res, next) => {
  try {
    const { code, type, value, minOrder, maxUsage, expiresAt } = req.body;
    const coupon = new Coupon({ code: code.toUpperCase(), type, value, minOrder, maxUsage, expiresAt });
    await coupon.save();
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

/* ─── LIST / DELETE COUPONS ──────────────────────────────────────────── */
exports.listCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.couponId);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
};

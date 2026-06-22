const { User, Product, Order, Review } = require('../models');
const { sendEmail } = require('../utils/email');

/* ─── REGISTER AS SELLER ─────────────────────────────────────────────── */
exports.registerSeller = async (req, res, next) => {
  try {
    const { businessName, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (user.role === 'seller') {
      const err = new Error('You are already a seller'); err.statusCode = 400; return next(err);
    }
    if (user.sellerStatus === 'pending') {
      const err = new Error('Your seller application is already under review'); err.statusCode = 400; return next(err);
    }

    user.businessName = businessName;
    user.sellerStatus = 'pending';
    if (phone) user.phone = phone;
    if (address) user.addresses = [address];
    await user.save();

    res.json({ success: true, message: 'Seller registration submitted. Awaiting admin approval.' });
  } catch (err) { next(err); }
};

/* ─── SELLER DASHBOARD ───────────────────────────────────────────────── */
exports.getDashboard = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    const [totalRevenue, totalOrders, activeListings, returns] = await Promise.all([
      Order.aggregate([
        { $match: { 'items.seller': sellerId, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ 'items.seller': sellerId }),
      Product.countDocuments({ seller: sellerId, status: 'active' }),
      Order.countDocuments({ 'items.seller': sellerId, status: { $in: ['return_requested', 'returned'] } }),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders,
        activeListings,
        returns,
      },
    });
  } catch (err) { next(err); }
};

/* ─── SELLER ORDERS ──────────────────────────────────────────────────── */
exports.getSellerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { 'items.seller': req.user._id };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: orders, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) { next(err); }
};

/* ─── SELLER INVENTORY ───────────────────────────────────────────────── */
exports.getInventory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { seller: req.user._id };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, data: products, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) { next(err); }
};

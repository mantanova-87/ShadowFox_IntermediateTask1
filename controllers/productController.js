const { Product } = require('../models');
const { generateSlug } = require('../utils/helpers');

/* ─── LIST / SEARCH ──────────────────────────────────────────────────── */
exports.listProducts = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, rating, sort, page = 1, limit = 20 } = req.query;
    const filter = { status: 'active' };

    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (rating) filter.averageRating = { $gte: Number(rating) };

    const sortMap = {
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      rating:     { averageRating: -1 },
      newest:     { createdAt: -1 },
    };
    const sortBy = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortBy).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/* ─── DETAIL ─────────────────────────────────────────────────────────── */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name businessName').lean();
    if (!product) {
      const err = new Error('Product not found'); err.statusCode = 404; return next(err);
    }
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

/* ─── CREATE (Seller) ────────────────────────────────────────────────── */
exports.createProduct = async (req, res, next) => {
  try {
    const { title, description, category, price, stock, specifications } = req.body;
    const images = (req.files || []).map(f => f.path);  // Cloudinary/multer paths
    const slug = await generateSlug(title);

    const product = new Product({
      seller: req.user._id,
      title, description, category,
      price: Number(price),
      stock: Number(stock || 0),
      images, slug, specifications,
    });
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

/* ─── UPDATE (Seller own) ────────────────────────────────────────────── */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) {
      const err = new Error('Product not found or not authorised'); err.statusCode = 404; return next(err);
    }
    const allowed = ['title', 'description', 'category', 'price', 'stock', 'status', 'specifications'];
    allowed.forEach(k => { if (req.body[k] !== undefined) product[k] = req.body[k]; });
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

/* ─── DELETE / UNPUBLISH (Seller own) ───────────────────────────────── */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) {
      const err = new Error('Product not found or not authorised'); err.statusCode = 404; return next(err);
    }
    product.status = 'unpublished';
    await product.save();
    res.json({ success: true, message: 'Product unpublished' });
  } catch (err) { next(err); }
};

/* ─── VOICE SEARCH ───────────────────────────────────────────────────── */
exports.voiceSearch = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) { const err = new Error('Query is required'); err.statusCode = 400; return next(err); }
    const products = await Product.find({ status: 'active', $text: { $search: query } })
      .limit(20).lean();
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
};

/* ─── IMAGE SEARCH ───────────────────────────────────────────────────── */
exports.imageSearch = async (req, res, next) => {
  try {
    // Placeholder — real impl calls Vision API, returns category keywords, then searches
    const { category } = req.body;
    const products = await Product.find({ status: 'active', ...(category && { category }) }).limit(20).lean();
    res.json({ success: true, data: products, note: 'Vision API integration required for production' });
  } catch (err) { next(err); }
};

/* ─── COMPARE ────────────────────────────────────────────────────────── */
exports.compareProducts = async (req, res, next) => {
  try {
    const ids = (req.query.ids || '').split(',').slice(0, 3);
    if (ids.length < 2) {
      const err = new Error('Provide 2–3 product IDs'); err.statusCode = 400; return next(err);
    }
    const products = await Product.find({ _id: { $in: ids } }).lean();
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
};

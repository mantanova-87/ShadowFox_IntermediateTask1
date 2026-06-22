const mongoose = require('mongoose');
const { Schema } = mongoose;

const WishlistItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const WishlistSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  products: [WishlistItemSchema]
}, { 
  timestamps: true 
});

// Indexes
WishlistSchema.index({ customer: 1 }, { unique: true });
WishlistSchema.index({ 'products.product': 1 });

module.exports = mongoose.model('Wishlist', WishlistSchema);

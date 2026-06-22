const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtAdd: { type: Number, required: true }
}, { _id: false });

const CartSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [CartItemSchema],
  couponCode: { 
    type: String, 
    uppercase: true, 
    trim: true 
  },
  discount: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
CartSchema.index({ customer: 1 }, { unique: true });
CartSchema.index({ 'items.product': 1 });

// Virtuals
CartSchema.virtual('subtotal').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((sum, item) => sum + (item.priceAtAdd * item.quantity), 0);
});

CartSchema.virtual('total').get(function() {
  const sub = this.subtotal;
  const tot = sub - this.discount;
  return Math.max(0, tot);
});

CartSchema.virtual('itemCount').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

module.exports = mongoose.model('Cart', CartSchema);

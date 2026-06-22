const mongoose = require('mongoose');
const { Schema } = mongoose;

const AddressSnapshotSchema = new Schema({
  fullName: { type: String },
  phone: { type: String },
  line1: { type: String },
  line2: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String }
}, { _id: false });

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  seller: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  sku: { type: String }
}, { _id: false });

const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  note: { type: String },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const OrderSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [OrderItemSchema], required: true },
  shippingAddress: { type: AddressSnapshotSchema, required: true },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  couponCode: { type: String },
  paymentMethod: { type: String, enum: ['card', 'upi', 'cod'], required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded', 'failed'], 
    default: 'pending' 
  },
  paymentRef: { type: String },
  status: { 
    type: String, 
    enum: [
      'placed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 
      'cancelled', 'return_requested', 'return_accepted', 'return_rejected', 
      'returned', 'refund_initiated', 'refunded'
    ], 
    default: 'placed' 
  },
  statusHistory: [StatusHistorySchema],
  returnReason: { type: String },
  returnImages: [{ type: String }],
  returnRequestedAt: { type: Date },
  refundAmount: { type: Number },
  estimatedDelivery: { type: Date }
}, { 
  timestamps: true 
});

// Indexes
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ 'items.seller': 1, status: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

// Pre-save middleware to auto-log status history on change
OrderSchema.pre('save', function(next) {
  if (this.isModified('status') || this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: this.isNew ? 'Order placed successfully' : `Order status updated to ${this.status}`
    });
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);

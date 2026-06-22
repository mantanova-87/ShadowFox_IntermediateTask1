const mongoose = require('mongoose');
const { Schema } = mongoose;

const CouponSchema = new Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true 
  },
  type: { 
    type: String, 
    enum: ['percent', 'flat'], 
    required: true 
  },
  value: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  maxDiscount: { type: Number, min: 0 },
  minOrderValue: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true },
  usageLimit: { type: Number, default: null }, // null = unlimited
  usageCount: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  description: { type: String }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, expiresAt: 1 });

// Virtuals
CouponSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

CouponSchema.virtual('isUsable').get(function() {
  const notExpired = !this.isExpired;
  const limitNotReached = this.usageLimit === null || this.usageCount < this.usageLimit;
  return this.isActive && notExpired && limitNotReached;
});

// Instance Methods
CouponSchema.methods.calculateDiscount = function(orderTotal) {
  if (!this.isUsable || orderTotal < this.minOrderValue) {
    return 0;
  }

  let discount = 0;
  if (this.type === 'percent') {
    discount = (this.value / 100) * orderTotal;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.type === 'flat') {
    discount = this.value;
  }

  return Math.min(discount, orderTotal); // Discount cannot exceed order total
};

module.exports = mongoose.model('Coupon', CouponSchema);

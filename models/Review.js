const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReviewSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: {
    type: Number, required: true, min: 1, max: 5, validate: {
      validator: Number.isInteger,
      message: '{VALUE} must be an integer'
    }
  },
  title: { type: String, maxlength: 120 },
  body: { type: String, maxlength: 2000 },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['published', 'flagged', 'removed'],
    default: 'published'
  },
  adminNote: { type: String },
  helpfulCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
ReviewSchema.index({ product: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ customer: 1 });
ReviewSchema.index({ product: 1, customer: 1, order: 1 }, { unique: true }); // Prevent duplicate reviews

// Static method to calculate average rating and update Product
ReviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, status: 'published' } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  const Product = mongoose.model('Product');
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      reviewCount: 0
    });
  }
};

// Post-save hook to recalculate stats
ReviewSchema.post('save', async function () {
  // Call the static calculation method
  await this.constructor.calculateAverageRating(this.product);
});

// Also recalculate stats when a review status changes or gets deleted
ReviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.product);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);



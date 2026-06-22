const mongoose = require('mongoose');
const { Schema } = mongoose;

const SpecificationSchema = new Schema({
  key: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const ProductSchema = new Schema({
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String },
  category: { type: String, required: true },
  images: [{ type: String }], // Cloudinary URLs. images[0] is the cover.
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, min: 0 },
  sku: { type: String, unique: true, sparse: true, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  status: { 
    type: String, 
    enum: ['active', 'out_of_stock', 'unpublished', 'flagged', 'pending_review'], 
    default: 'active' 
  },
  specifications: [SpecificationSchema],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  adminNote: { type: String },
  isFeatured: { type: Boolean, default: false },
  tags: [{ type: String }]
}, { 
  timestamps: true 
});

// Indexes
ProductSchema.index({ seller: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ status: 1, averageRating: -1 });
ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ isFeatured: 1, status: 1 });

// Middleware (pre-validate / pre-save)
ProductSchema.pre('validate', function(next) {
  // Slug generation: slug = title-lowercased-hyphenated-timestamp
  if (!this.slug && this.title) {
    const cleanTitle = this.title
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-')       // replace spaces with -
      .replace(/-+/g, '-');       // collapse duplicate -
      
    this.slug = `${cleanTitle}-${Date.now()}`;
  }
  
  // Stock -> Status sync (BR-04)
  if (this.isModified('stock')) {
    if (this.stock === 0 && this.status === 'active') {
      this.status = 'out_of_stock';
    } else if (this.stock > 0 && this.status === 'out_of_stock') {
      this.status = 'active';
    }
  }
  
  // Ensure tags are lowercased
  if (this.tags && this.tags.length > 0) {
    this.tags = this.tags.map(tag => tag.toLowerCase().trim());
  }
  
  next();
});

module.exports = mongoose.model('Product', ProductSchema);

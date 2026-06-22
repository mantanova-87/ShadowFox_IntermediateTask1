const mongoose = require('mongoose');
const { Schema } = mongoose;

const AddressSchema = new Schema({
  label: { type: String, default: 'Home' },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false }
}, { _id: true }); // Keep ID for sub-documents to enable easy CRUD actions

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }, // Exclude by default for security
  role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
  status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
  isVerified: { type: Boolean, default: false },
  verifyToken: { type: String },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  avatar: { type: String }, // Cloudinary URL
  phone: { type: String },
  addresses: [AddressSchema],
  
  // Seller fields
  sellerStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', null], 
    default: null 
  },
  businessName: { type: String },
  businessType: { type: String },
  taxId: { type: String },
  bankDetails: {
    accountHolder: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String }
  },
  sellerRejectionNote: { type: String }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ sellerStatus: 1 });

// Virtuals
UserSchema.virtual('isSeller').get(function() {
  return this.role === 'seller' && this.sellerStatus === 'approved';
});

module.exports = mongoose.model('User', UserSchema);

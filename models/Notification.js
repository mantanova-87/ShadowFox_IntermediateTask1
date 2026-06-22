const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    required: true,
    enum: [
      'order_placed', 'order_status_update', 'return_status_update',
      'refund_initiated', 'refund_completed', 'complaint_update',
      'seller_approved', 'seller_rejected', 'low_stock_alert',
      'review_flagged', 'coupon_created', 'general'
    ]
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedModel: { 
    type: String, 
    enum: ['Order', 'Product', 'SupportTicket', 'Review', null], 
    default: null 
  },
  relatedId: { type: Schema.Types.ObjectId, refPath: 'relatedModel' }, // Polymorphic reference using refPath
  actionUrl: { type: String },
  createdAt: { type: Date, default: Date.now, expires: '90d' } // TTL index (90 days)
}, { 
  timestamps: { createdAt: false, updatedAt: true } // Let mongoose handle updatedAt, createdAt is custom with TTL
});

// Compound Index for notifications panel query
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

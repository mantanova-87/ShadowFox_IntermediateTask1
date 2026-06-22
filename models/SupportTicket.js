const mongoose = require('mongoose');
const { Schema } = mongoose;

const TicketStatusHistorySchema = new Schema({
  status: { type: String, required: true },
  note: { type: String },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const SupportTicketSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order' },
  category: { 
    type: String, 
    required: true,
    enum: ['order_issue', 'payment_issue', 'return_refund', 'product_quality', 'seller_conduct', 'account_issue', 'other']
  },
  subject: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 3000 },
  attachments: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 3 attachments']
  },
  status: { 
    type: String, 
    enum: ['open', 'in_review', 'escalated', 'resolved', 'closed'], 
    default: 'open' 
  },
  statusHistory: [TicketStatusHistorySchema],
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  adminNotes: { type: String },
  resolvedAt: { type: Date },
  closedAt: { type: Date },
  isEscalated: { type: Boolean, default: false },
  escalationNote: { type: String }
}, { 
  timestamps: true 
});

function arrayLimit(val) {
  return val.length <= 3;
}

// Indexes
SupportTicketSchema.index({ customer: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, createdAt: -1 });
SupportTicketSchema.index({ isEscalated: 1, status: 1 });
SupportTicketSchema.index({ assignedTo: 1 });

// Pre-save hook
SupportTicketSchema.pre('save', function(next) {
  if (this.isModified('status') || this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: this.isNew ? 'Ticket created' : `Ticket status changed to ${this.status}`
    });

    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    } else if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);

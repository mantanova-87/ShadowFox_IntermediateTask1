const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatMessageSchema = new Schema({
  role: { type: String, required: true, enum: ['user', 'assistant'] },
  content: { type: String, required: true, maxlength: 4000 },
  timestamp: { type: Date, default: Date.now },
  context: {
    type: { type: String, enum: ['product', 'order', null], default: null },
    refId: { type: Schema.Types.ObjectId }
  }
}, { _id: false });

const ChatHistorySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true },
  messages: [ChatMessageSchema],
  isActive: { type: Boolean, default: true },
  endedAt: { type: Date },
  escalated: { type: Boolean, default: false },
  supportTicketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket' },
  createdAt: { type: Date, default: Date.now, expires: '180d' } // TTL index (180 days)
}, { 
  timestamps: { createdAt: false, updatedAt: true }
});

// Indexes
ChatHistorySchema.index({ user: 1, createdAt: -1 });
ChatHistorySchema.index({ sessionId: 1 }, { unique: true });

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);

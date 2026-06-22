const { ChatHistory } = require('../models');

/* ─── GET SESSION HISTORY ────────────────────────────────────────────── */
exports.getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const chat = await ChatHistory.findOne({ user: req.user._id, sessionId });
    res.json({ success: true, data: chat || { messages: [] } });
  } catch (err) { next(err); }
};

/* ─── SEND MESSAGE ───────────────────────────────────────────────────── */
exports.sendMessage = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;
    if (!message) {
      const err = new Error('Message is required'); err.statusCode = 400; return next(err);
    }

    let chat = await ChatHistory.findOne({ user: req.user._id, sessionId });
    if (!chat) {
      chat = new ChatHistory({ user: req.user._id, sessionId, messages: [] });
    }

    // Push user message
    chat.messages.push({ role: 'user', content: message });

    // Generate AI reply (stub — replace with real AI service call)
    let aiReply = 'Thank you for your message! How can I help you with your shopping today?';
    try {
      const { getAIReply } = require('../services/aiService');
      aiReply = await getAIReply(chat.messages);
    } catch (aiErr) {
      console.warn('AI service unavailable, using fallback reply:', aiErr.message);
    }

    chat.messages.push({ role: 'assistant', content: aiReply });
    await chat.save();

    res.json({ success: true, reply: aiReply, sessionId });
  } catch (err) { next(err); }
};

/* ─── DELETE SESSION ─────────────────────────────────────────────────── */
exports.deleteSession = async (req, res, next) => {
  try {
    await ChatHistory.findOneAndDelete({ user: req.user._id, sessionId: req.params.sessionId });
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) { next(err); }
};

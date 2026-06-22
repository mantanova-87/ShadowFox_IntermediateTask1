/**
 * aiService.js
 * Provides AI chat completions via a configurable LLM provider.
 * Falls back gracefully when no API key is configured.
 */
const { aiApiKey } = require('../config/env');

/**
 * Converts chat history array to a prompt string and calls the LLM.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>} AI reply text
 */
async function getAIReply(messages) {
  if (!aiApiKey) {
    return buildFallbackReply(messages);
  }

  // Attempt OpenAI-compatible API call
  // Replace the endpoint/model to switch providers (e.g. Anthropic, Gemini)
  try {
    const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful shopping assistant for E-Bazar marketplace. Help users find products, track orders, and answer questions about the platform. Be concise and friendly.',
          },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`LLM API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || buildFallbackReply(messages);
  } catch (err) {
    console.error('[aiService] LLM call failed:', err.message);
    return buildFallbackReply(messages);
  }
}

/**
 * Simple rule-based fallback when the AI API is unavailable.
 */
function buildFallbackReply(messages) {
  const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();

  if (lastMsg.includes('order')) return 'You can track your orders in the My Orders section of your account.';
  if (lastMsg.includes('return') || lastMsg.includes('refund')) return 'To request a return, visit your order details and click "Return Item". Our team will review within 48 hours.';
  if (lastMsg.includes('payment')) return 'We accept all major payment methods. Payment issues can be resolved through your bank or contact our support team.';
  if (lastMsg.includes('ship') || lastMsg.includes('deliver')) return 'Estimated delivery is 3–7 business days. Express shipping is available at checkout.';
  if (lastMsg.includes('cancel')) return 'Orders can be cancelled before they are processed. Visit "My Orders" to cancel.';
  if (lastMsg.includes('contact') || lastMsg.includes('support')) return 'You can reach our support team via the Help Centre or raise a support ticket in your account.';

  const greetings = ['hello', 'hi', 'hey', 'good'];
  if (greetings.some(g => lastMsg.includes(g))) {
    return 'Hello! Welcome to E-Bazar. How can I help you today?';
  }

  return "I'm here to help with product searches, order tracking, and shopping questions. What can I assist you with?";
}

module.exports = { getAIReply };

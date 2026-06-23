/**
 * aiService.js
 * Provides AI chat completions via Google Gemini.
 * Falls back gracefully when no API key is configured.
 */

const { aiApiKey } = require('../config/env');

/**
 * Gets AI response from Gemini.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
async function getAIReply(messages) {
  if (!aiApiKey) {
    return buildFallbackReply(messages);
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: f }) => f(...args));

    const prompt = `
You are a helpful shopping assistant for E-Bazar marketplace.

Help users:
- Find products
- Track orders
- Understand shipping information
- Handle returns and refunds
- Answer questions about the platform

Be concise, friendly, and helpful.

Conversation:

${messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n')}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(
        `Gemini API error ${response.status}: ${errBody}`
      );
    }

    const data = await response.json();

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      buildFallbackReply(messages)
    );
  } catch (err) {
    console.error('[aiService] Gemini call failed:', err.message);
    return buildFallbackReply(messages);
  }
}

/**
 * Simple rule-based fallback when Gemini is unavailable.
 */
function buildFallbackReply(messages) {
  const lastMsg = (
    messages[messages.length - 1]?.content || ''
  ).toLowerCase();

  if (lastMsg.includes('order')) {
    return 'You can track your orders in the My Orders section of your account.';
  }

  if (lastMsg.includes('return') || lastMsg.includes('refund')) {
    return 'To request a return, visit your order details and click "Return Item". Our team will review within 48 hours.';
  }

  if (lastMsg.includes('payment')) {
    return 'We accept all major payment methods. Payment issues can be resolved through your bank or contact our support team.';
  }

  if (
    lastMsg.includes('ship') ||
    lastMsg.includes('delivery') ||
    lastMsg.includes('deliver')
  ) {
    return 'Estimated delivery is 3–7 business days. Express shipping is available at checkout.';
  }

  if (lastMsg.includes('cancel')) {
    return 'Orders can be cancelled before they are processed. Visit "My Orders" to cancel.';
  }

  if (
    lastMsg.includes('contact') ||
    lastMsg.includes('support')
  ) {
    return 'You can reach our support team via the Help Centre or raise a support ticket in your account.';
  }

  const greetings = ['hello', 'hi', 'hey', 'good'];

  if (greetings.some((g) => lastMsg.includes(g))) {
    return 'Hello! Welcome to E-Bazar. How can I help you today?';
  }

  return "I'm here to help with product searches, order tracking, and shopping questions. What can I assist you with?";
}

module.exports = {
  getAIReply,
};
/**
 * notificationService.js
 * Helper to create in-app notifications and optionally send emails.
 */
const { Notification } = require('../models');
const { sendEmail } = require('../utils/email');

/**
 * Creates a Notification document in the database.
 * @param {Object} opts
 * @param {string} opts.recipient   - User ObjectId
 * @param {string} opts.type        - Notification type (e.g. 'order_placed')
 * @param {string} opts.message     - Human-readable message
 * @param {string} [opts.relatedDoc] - Optional related ObjectId
 */
async function createNotification({ recipient, type, message, relatedDoc }) {
  try {
    await Notification.create({ recipient, type, message, ...(relatedDoc && { relatedDoc }) });
  } catch (err) {
    console.error('[notificationService] Failed to create notification:', err.message);
  }
}

/**
 * Sends an email notification to a user.
 * Wraps sendEmail with error isolation so it never crashes the caller.
 */
async function emailNotify({ to, subject, html }) {
  try {
    await sendEmail({ to, subject, html });
  } catch (err) {
    console.error('[notificationService] Email send failed:', err.message);
  }
}

module.exports = { createNotification, emailNotify };

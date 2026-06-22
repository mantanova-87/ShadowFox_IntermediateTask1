const nodemailer = require('nodemailer');
const { smtp } = require('../config/env');

let transporter;

if (smtp.host && smtp.user) {
  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465, // true for 465, false for other ports
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
} else {
  // Fallback to ethereal email for local development if not configured
  console.warn('SMTP not fully configured. Falling back to test transporter.');
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('--- EMAIL MOCK ---');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Text:', mailOptions.text);
      console.log('------------------');
      return { messageId: 'mock-id' };
    }
  };
}

/**
 * Sends an email using the configured transporter.
 * @param {Object} options { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: smtp.from,
    to,
    subject,
    html,
    text: text || 'Please view this email in a client that supports HTML.',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Email send failed:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = {
  transporter,
  sendEmail
};

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

export const isEmailConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

const getTransporter = () => {
  if (!isEmailConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
};

/**
 * Sends mail when SMTP is configured; otherwise logs the message so local
 * development still works without a mail provider. Failures are swallowed on
 * purpose — a mail outage must not break the password-reset request flow.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const mailer = getTransporter();

  if (!mailer) {
    logger.warn(`SMTP not configured — email to ${to} was not sent. Subject: "${subject}"`);
    return { delivered: false, reason: 'smtp-not-configured' };
  }

  try {
    const info = await mailer.sendMail({ from: env.smtp.from, to, subject, text, html });
    logger.info(`Email sent to ${to} (${info.messageId})`);
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email delivery failed for ${to}: ${error.message}`);
    return { delivered: false, reason: error.message };
  }
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl, expiresInMinutes }) => {
  const subject = 'Reset your password';
  const text = [
    `Hi ${name},`,
    '',
    'We received a request to reset your password.',
    `Open this link to choose a new one (valid for ${expiresInMinutes} minutes):`,
    resetUrl,
    '',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');

  const html = `
  <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#111827">
    <h2 style="margin:0 0 16px">Reset your password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. This link is valid for
       <strong>${expiresInMinutes} minutes</strong>.</p>
    <p style="margin:28px 0">
      <a href="${resetUrl}"
         style="background:#4f46e5;color:#fff;padding:12px 22px;border-radius:8px;
                text-decoration:none;font-weight:600;display:inline-block">Choose a new password</a>
    </p>
    <p style="font-size:13px;color:#6b7280">If the button does not work, paste this into your browser:<br>
      <span style="word-break:break-all">${resetUrl}</span>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:12px;color:#6b7280">If you did not request a password reset, ignore this email —
       your password stays unchanged.</p>
  </div>`;

  return sendEmail({ to, subject, text, html });
};

export const sendOrderConfirmationEmail = async ({ to, name, order }) => {
  const subject = `Order ${order.orderNumber} received`;
  const text = [
    `Hi ${name},`,
    '',
    `Thanks for your order ${order.orderNumber}.`,
    `Items: ${order.totalQuantity}`,
    `Total: ${order.totalPrice}`,
    '',
    'We will notify you as the order progresses.',
  ].join('\n');

  return sendEmail({ to, subject, text, html: `<p>${text.replace(/\n/g, '<br>')}</p>` });
};

/**
 * KejaMarket Email Service
 * Uses Nodemailer with Gmail/SendGrid/SMTP
 * Falls back to console logging if not configured
 */

const nodemailer = require('nodemailer');

let transporter = null;

function initEmailService() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');

  if (!emailUser || !emailPass) {
    console.log('📧 Email: Not configured (set EMAIL_USER and EMAIL_PASS)');
    return false;
  }

  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: { user: emailUser, pass: emailPass },
    tls: { rejectUnauthorized: false }
  });

  console.log(`📧 Email service initialized (${emailHost})`);
  return true;
}

async function sendEmail({ to, subject, html, text }) {
  if (!to) return { success: false, error: 'No recipient' };

  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@kejamarket.co.ke';

  if (!transporter) {
    console.log(`[EMAIL LOG] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL BODY] ${text || html}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"KejaMarket" <${emailFrom}>`,
      to,
      subject,
      html: html || `<p>${text}</p>`,
      text: text || ''
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── Templated emails ────────────────────────────────────────────────

async function sendPasswordResetEmail(to, name, resetToken) {
  const resetUrl = `${process.env.APP_URL || 'https://kejamarket.co.ke'}/?reset_token=${resetToken}`;
  return sendEmail({
    to,
    subject: 'KejaMarket — Reset Your Password',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #00b53f;">Reset Your KejaMarket Password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display:inline-block;background:#00b53f;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#64748b;font-size:0.85rem;">This link expires in 30 minutes. If you did not request a reset, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#94a3b8;font-size:0.8rem;">KejaMarket — Kenya's #1 Rental Marketplace — kejamarket.co.ke</p>
      </div>
    `,
    text: `Reset your KejaMarket password: ${resetUrl} (expires in 30 minutes)`
  });
}

async function sendWelcomeEmail(to, name, role) {
  const roleLabel = role === 'landlord' ? 'Landlord' : role === 'agency' ? 'Agency' : role === 'service' ? 'Service Provider' : 'Tenant';
  return sendEmail({
    to,
    subject: `Welcome to KejaMarket, ${name}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #00b53f;">🏠 Welcome to KejaMarket!</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${roleLabel}</strong> account is now active on <a href="https://kejamarket.co.ke">kejamarket.co.ke</a>.</p>
        ${role === 'landlord' || role === 'agency' ? '<p>You can now post property listings and manage inquiries from your Landlord Portal.</p>' : ''}
        ${role === 'tenant' ? '<p>You can now browse verified rentals and contact landlords directly.</p>' : ''}
        <a href="https://kejamarket.co.ke" style="display:inline-block;background:#00b53f;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
          Visit KejaMarket
        </a>
        <p style="color:#94a3b8;font-size:0.8rem;">KejaMarket — Keja Rahisi, Maisha Bora</p>
      </div>
    `,
    text: `Welcome to KejaMarket, ${name}! Visit https://kejamarket.co.ke`
  });
}

async function sendPaymentReceiptEmail(to, name, receiptCode, amount, itemName) {
  return sendEmail({
    to,
    subject: `KejaMarket Payment Confirmed — ${receiptCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #00b53f;">✅ Payment Confirmed</h2>
        <p>Hi ${name},</p>
        <p>Your payment has been confirmed:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;color:#64748b;">Item</td><td style="padding:8px;font-weight:700;">${itemName}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px;color:#64748b;">Amount</td><td style="padding:8px;font-weight:700;">KSh ${Number(amount).toLocaleString()}</td></tr>
          <tr><td style="padding:8px;color:#64748b;">M-Pesa Receipt</td><td style="padding:8px;font-weight:700;color:#00b53f;">${receiptCode}</td></tr>
        </table>
        <p style="color:#94a3b8;font-size:0.8rem;">KejaMarket — kejamarket.co.ke</p>
      </div>
    `,
    text: `Payment confirmed. Receipt: ${receiptCode}. Amount: KSh ${amount}. Item: ${itemName}`
  });
}

async function sendListingApprovedEmail(to, name, propertyTitle) {
  return sendEmail({
    to,
    subject: `✅ Your listing "${propertyTitle}" is now LIVE on KejaMarket`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #00b53f;">✅ Listing Approved & Live!</h2>
        <p>Hi ${name},</p>
        <p>Great news! Your property <strong>"${propertyTitle}"</strong> has been approved and is now live on KejaMarket.</p>
        <p>Tenants can now find and contact you directly.</p>
        <a href="https://kejamarket.co.ke" style="display:inline-block;background:#00b53f;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
          View Your Listing
        </a>
        <p style="color:#94a3b8;font-size:0.8rem;">KejaMarket — kejamarket.co.ke</p>
      </div>
    `,
    text: `Your listing "${propertyTitle}" is now live on KejaMarket!`
  });
}

module.exports = {
  initEmailService,
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPaymentReceiptEmail,
  sendListingApprovedEmail
};

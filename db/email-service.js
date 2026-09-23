/**
 * KejaMarket Email Service
 * - Password-reset links: Resend HTTP API (RESEND_API_KEY + RESEND_FROM)
 * - All other emails: Nodemailer/SMTP (EMAIL_HOST/USER/PASS)
 * Falls back to console logging if neither is configured (dev mode).
 */

const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

let transporter = null;
let resendReady = false;

function initEmailService() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');

  if (!emailUser || !emailPass) {
    console.log('📧 SMTP email: Not configured (set EMAIL_USER and EMAIL_PASS)');
  } else {
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false }
    });
    console.log(`📧 SMTP email service initialized (${emailHost})`);
  }

  initResendService();
  return !!(transporter || resendReady);
}

function initResendService() {
  const key = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const from = (process.env.RESEND_FROM || '').trim().replace(/^["']|["']$/g, '');

  if (!key || !key.startsWith('re_')) {
    console.log('📧 Resend: Not configured (add RESEND_API_KEY=re_... to environment)');
    resendReady = false;
    return false;
  }
  resendReady = true;
  console.log(`📧 Resend email service ready (from: ${from || 'noreply@kejamarket.co.ke'})`);
  return true;
}

async function sendEmail({ to, subject, html, text }) {
  if (!to) return { success: false, error: 'No recipient' };

  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@kejamarket.co.ke';

  if (!transporter) {
    const resendKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    if (resendReady || (resendKey && resendKey.startsWith('re_'))) {
      return sendViaResend({ to, subject, html, text });
    }
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

// ── Resend sender (password-reset links only) ────────────────────────────────

async function sendViaResend({ to, subject, html, text }) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  let from = (process.env.RESEND_FROM || 'noreply@kejamarket.co.ke').trim().replace(/^["']|["']$/g, '');

  if (!apiKey || !apiKey.startsWith('re_')) {
    console.warn(`[RESEND WARNING] Cannot send email to ${to}: RESEND_API_KEY is missing or invalid`);
    console.log(`[RESEND FALLBACK] To: ${to} | Subject: ${subject}`);
    console.log(`[RESEND FALLBACK BODY] ${text || '(html only)'}`);
    return { success: false, error: 'RESEND_API_KEY not configured or does not start with re_', simulated: true };
  }

  try {
    let fromHeader = from;
    if (!fromHeader.includes('<')) {
      fromHeader = `KejaMarket <${fromHeader}>`;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromHeader,
        to: [to],
        subject,
        html,
        text: text || ''
      })
    });
    const body = await res.json();
    if (!res.ok) {
      console.error(`❌ Resend API error (${res.status}):`, JSON.stringify(body));
      return { success: false, error: body.message || `HTTP ${res.status}`, details: body };
    }
    console.log(`📧 Resend email sent successfully to ${to}: id=${body.id}`);
    return { success: true, id: body.id };
  } catch (err) {
    console.error('❌ Resend fetch error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Templated emails ────────────────────────────────────────────────

/**
 * Send password-reset link via Resend.
 * resetUrl already contains the raw token — never logged here.
 */
async function sendPasswordResetLink(to, name, resetUrl) {
  const year = new Date().getFullYear();
  return sendViaResend({
    to,
    subject: 'Reset your KejaMarket password',
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);">
<tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
  <p style="margin:0;font-size:26px;font-weight:800;color:#fff;">&#127968; KejaMarket</p>
  <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px;">Kenya's Rental Marketplace</p>
</td></tr>
<tr><td style="padding:40px;">
  <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;">Reset your password</h1>
  <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">Hi ${name},<br><br>We received a request to reset your KejaMarket password. Click below to set a new one.</p>
  <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:8px 0 32px;">
    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 36px;border-radius:10px;">Reset Password</a>
  </td></tr></table>
  <div style="background:#f8fafc;border-left:4px solid #e2e8f0;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">This link expires in <strong>1 hour</strong> and can only be used once.<br>If you did not request this, you can safely ignore this email.</p>
  </div>
  <p style="margin:0;color:#94a3b8;font-size:12px;">If the button does not work, paste this into your browser:<br><span style="color:#7c3aed;word-break:break-all;">${resetUrl}</span></p>
</td></tr>
<tr><td style="background:#f8fafc;padding:18px 40px;text-align:center;border-top:1px solid #e2e8f0;">
  <p style="margin:0;color:#94a3b8;font-size:12px;">&copy; ${year} KejaMarket &mdash; <a href="https://kejamarket.co.ke" style="color:#7c3aed;text-decoration:none;">kejamarket.co.ke</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`,
    text: `Reset your KejaMarket password\n\nHi ${name},\n\nClick to reset (expires in 1 hour):\n${resetUrl}\n\nIgnore this if you did not request it.\n\n— KejaMarket`
  });
}

// Legacy alias — kept so any stray caller does not crash; internally delegates to link-based flow.
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

/**
 * Send House Hunt activation / confirmation email to customer
 */
async function sendHouseHuntConfirmation(to, name, hunt) {
  const huntId = hunt.id || '';
  const shortId = huntId.slice(-6).toUpperCase();
  const trackUrl = `${process.env.APP_URL || 'https://kejamarket.co.ke'}/?track_hunt=${huntId}`;
  const locations = Array.isArray(hunt.preferredLocations) ? hunt.preferredLocations.join(', ') : (hunt.preferredLocations || 'Nairobi');
  const budgetStr = hunt.budgetMin && hunt.budgetMax
    ? `KSh ${Number(hunt.budgetMin).toLocaleString('en-KE')} - ${Number(hunt.budgetMax).toLocaleString('en-KE')}`
    : hunt.budgetMax ? `Up to KSh ${Number(hunt.budgetMax).toLocaleString('en-KE')}` : 'Flexible';
  const bedsStr = hunt.bedrooms ? `${hunt.bedrooms} Bedroom(s)` : 'Any size';
  const year = new Date().getFullYear();

  return sendEmail({
    to,
    subject: `🏠 3-Day House Hunt Activated! (Ref: #${shortId})`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 12px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;max-width:100%;">
      <tr>
        <td style="background:linear-gradient(135deg,#00b53f,#059669);padding:28px 32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🏡 KejaMarket Concierge</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Your 3-Day House Hunt is officially ACTIVE</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Hi ${name || 'Neighbor'},</h2>
          <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
            We've received your requirements and your dedicated house-hunting concierge has been dispatched. Our field agents are actively inspecting units matching your criteria.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:10px;padding:16px;margin-bottom:24px;">
            <tr>
              <td style="padding:6px 12px;color:#64748b;font-size:13px;font-weight:600;width:40%;">Hunt Reference</td>
              <td style="padding:6px 12px;color:#0f172a;font-size:13px;font-weight:700;">#${shortId}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;color:#64748b;font-size:13px;font-weight:600;">Preferred Area(s)</td>
              <td style="padding:6px 12px;color:#0f172a;font-size:13px;font-weight:700;">${locations}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;color:#64748b;font-size:13px;font-weight:600;">Monthly Budget</td>
              <td style="padding:6px 12px;color:#00b53f;font-size:13px;font-weight:700;">${budgetStr}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;color:#64748b;font-size:13px;font-weight:600;">House Type</td>
              <td style="padding:6px 12px;color:#0f172a;font-size:13px;font-weight:700;">${bedsStr} (${hunt.propertyType || 'Apartment'})</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;color:#64748b;font-size:13px;font-weight:600;">Timeline</td>
              <td style="padding:6px 12px;color:#0f172a;font-size:13px;font-weight:700;">72-Hour Search Guarantee</td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
              <td align="center">
                <a href="${trackUrl}" style="display:inline-block;background:#00b53f;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;box-shadow:0 3px 12px rgba(0,181,63,0.3);">
                  🔍 Track House Hunt Live
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 10px;color:#64748b;font-size:13px;line-height:1.5;">
            Whenever a matching unit is verified, it will instantly appear in your live tracker with photos, landlord verification badges, and viewing slots.
          </p>
          <p style="margin:0;color:#94a3b8;font-size:12px;">Need help? Reply to this email or chat with our team on WhatsApp at +254 792 409 540.</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">&copy; ${year} KejaMarket &mdash; Kenya's #1 Rental Marketplace &mdash; kejamarket.co.ke</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
    text: `Your 3-Day House Hunt (#${shortId}) is ACTIVE!\n\nPreferred Locations: ${locations}\nBudget: ${budgetStr}\nType: ${bedsStr}\n\nTrack your search live here: ${trackUrl}\n\n— KejaMarket Concierge Team`
  });
}

/**
 * Send notification when admin adds a matched property to customer's hunt
 */
async function sendHouseHuntPropertyFound(to, name, hunt, property) {
  const huntId = hunt.id || '';
  const trackUrl = `${process.env.APP_URL || 'https://kejamarket.co.ke'}/?track_hunt=${huntId}`;
  const priceStr = property.price ? `KSh ${Number(property.price).toLocaleString('en-KE')}/mo` : 'Price on request';
  const year = new Date().getFullYear();

  return sendEmail({
    to,
    subject: `✨ New Match Found: ${property.title || 'Verified Property'} in ${property.location || 'Nairobi'}`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 12px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;max-width:100%;">
      <tr>
        <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px 32px;text-align:center;">
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">✨ New Property Match!</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">Added to your House Hunt search</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <h2 style="margin:0 0 10px;font-size:17px;color:#0f172a;">Hi ${name || 'there'},</h2>
          <p style="margin:0 0 18px;color:#475569;font-size:14px;line-height:1.5;">
            Our team just added a newly verified unit that fits your preferences:
          </p>

          <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-bottom:20px;">
            <h3 style="margin:0 0 8px;font-size:16px;color:#0f172a;">${property.title || 'Verified Rental'}</h3>
            <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#00b53f;">${priceStr}</p>
            <p style="margin:0;font-size:13px;color:#64748b;">📍 ${property.location || 'Nairobi'} &bull; ${property.bedrooms ? property.bedrooms + ' Beds' : ''}</p>
            ${property.adminNote ? `<p style="margin:8px 0 0;font-size:13px;color:#1e293b;font-style:italic;">"${property.adminNote}"</p>` : ''}
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
            <tr>
              <td align="center">
                <a href="${trackUrl}" style="display:inline-block;background:#00b53f;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;">
                  View Property & Book Viewing
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafc;padding:14px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; ${year} KejaMarket &bull; kejamarket.co.ke</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
    text: `New Property Match for your House Hunt!\n\n${property.title} in ${property.location}\nRent: ${priceStr}\n\nReview matches here: ${trackUrl}`
  });
}

/**
 * Send Similar Property / Demand Alert confirmation to tenant
 */
async function sendSimilarPropertyAlert(to, alertData) {
  const budgetStr = alertData.maxBudget ? `under KSh ${Number(alertData.maxBudget).toLocaleString('en-KE')}` : '';
  const searchUrl = `https://kejamarket.co.ke/?location=${encodeURIComponent(alertData.location || 'Nairobi')}`;
  const year = new Date().getFullYear();

  return sendEmail({
    to,
    subject: `🔔 KejaMarket Alert: We'll notify you for ${alertData.category || 'rentals'} in ${alertData.location || 'Nairobi'}`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 12px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);border:1px solid #e2e8f0;max-width:100%;">
      <tr>
        <td style="background:#00b53f;padding:24px;text-align:center;">
          <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:800;">🔔 Alert Confirmed!</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">
            You have successfully subscribed to alerts for <strong>${alertData.category || 'Rentals'}</strong> in <strong>${alertData.location || 'Nairobi'}</strong> ${budgetStr}.
          </p>
          <div style="background:#f1f5f9;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
              Because units in high-demand estates get taken fast, you'll be among the first to receive an instant notification when a matching unit is posted or becomes vacant.
            </p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${searchUrl}" style="display:inline-block;background:#00b53f;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;">
                  Explore Current Rentals
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafc;padding:14px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; ${year} KejaMarket &bull; kejamarket.co.ke</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
    text: `KejaMarket Alert Confirmed!\n\nWe will notify you the moment a similar unit in ${alertData.location} ${budgetStr} is available.\n\nBrowse now: ${searchUrl}`
  });
}

module.exports = {
  initEmailService,
  initResendService,
  sendEmail,
  sendViaResend,
  sendPasswordResetLink,
  sendPasswordResetEmail,  // legacy alias
  sendWelcomeEmail,
  sendPaymentReceiptEmail,
  sendListingApprovedEmail,
  sendHouseHuntConfirmation,
  sendHouseHuntPropertyFound,
  sendSimilarPropertyAlert
};

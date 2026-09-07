/**
 * Keja – M-Pesa Daraja STK Push Backend
 * ========================================
 * Simple Node.js/Express proxy server that:
 *  1. Gets an OAuth token from Safaricom
 *  2. Initiates an STK Push to the customer's phone
 *  3. Returns the transaction status
 *
 * SETUP:
 *   npm install express cors node-fetch dotenv
 *   node server.js
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fetch   = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const app  = express();
app.use(cors());
app.use(express.json());

// ─── SERVE STATIC FILES (HTML, CSS, JS, icons) ───────────────────────────────
app.use(express.static(__dirname));

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONSUMER_KEY    = process.env.MPESA_CONSUMER_KEY    || 'YOUR_CONSUMER_KEY';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || 'YOUR_CONSUMER_SECRET';
const PAYBILL         = process.env.MPESA_PAYBILL         || '303030';
const ACCOUNT_NUMBER  = process.env.MPESA_ACCOUNT         || '2057103992';
const PASSKEY         = process.env.MPESA_PASSKEY         || 'YOUR_PASSKEY';
const CALLBACK_URL    = process.env.MPESA_CALLBACK_URL    || 'https://keja.co.ke/api/mpesa/callback';

// Use sandbox for testing, switch to live when ready:
// Sandbox: https://sandbox.safaricom.co.ke
// Live:    https://api.safaricom.co.ke
const MPESA_BASE = process.env.MPESA_ENV === 'live'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function getToken() {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res  = await fetch(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  const data = await res.json();
  return data.access_token;
}

function generatePassword(timestamp) {
  const str = `${PAYBILL}${PASSKEY}${timestamp}`;
  return Buffer.from(str).toString('base64');
}

function formatPhone(phone) {
  // Convert 07XXXXXXXX → 2547XXXXXXXX
  phone = phone.replace(/\s/g, '');
  if (phone.startsWith('0'))   return '254' + phone.slice(1);
  if (phone.startsWith('+254')) return phone.slice(1);
  return phone;
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// POST /api/mpesa/stk-push
// Body: { phone, amount, description }
app.post('/api/mpesa/stk-push', async (req, res) => {
  try {
    const { phone, amount, description } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: 'phone and amount are required' });
    }

    const token     = await getToken();
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const password  = generatePassword(timestamp);

    const payload = {
      BusinessShortCode: PAYBILL,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            Math.ceil(Number(amount)),
      PartyA:            formatPhone(phone),
      PartyB:            PAYBILL,
      PhoneNumber:       formatPhone(phone),
      CallBackURL:       CALLBACK_URL,
      AccountReference:  ACCOUNT_NUMBER,
      TransactionDesc:   description || 'Keja Payment',
    };

    const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === '0') {
      res.json({ success: true, checkoutRequestID: stkData.CheckoutRequestID, message: 'STK push sent. Please check your phone.' });
    } else {
      res.status(400).json({ success: false, message: stkData.errorMessage || 'STK push failed', raw: stkData });
    }
  } catch (err) {
    console.error('STK Push error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/mpesa/callback  ← Safaricom posts the payment result here
app.post('/api/mpesa/callback', (req, res) => {
  const body = req.body;
  console.log('M-Pesa Callback:', JSON.stringify(body, null, 2));

  const stkCallback = body?.Body?.stkCallback;
  if (stkCallback?.ResultCode === 0) {
    // ✅ Payment successful
    const items  = stkCallback.CallbackMetadata.Item;
    const amount = items.find(i => i.Name === 'Amount')?.Value;
    const receipt = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
    const phone  = items.find(i => i.Name === 'PhoneNumber')?.Value;
    console.log(`✅ Payment confirmed: KSh ${amount} | Receipt: ${receipt} | Phone: ${phone}`);
    // TODO: save to database, mark order as paid, send WhatsApp confirmation, etc.
  } else {
    console.log(`❌ Payment failed: ${stkCallback?.ResultDesc}`);
  }

  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Keja M-Pesa server running on port ${PORT}`));

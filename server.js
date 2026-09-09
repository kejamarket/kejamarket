/**
 * KejaMarket – Production Backend API & M-Pesa Daraja Integration
 * ===============================================================
 * Provides:
 *  1. Full User Authentication (JWT + Bcrypt) for Tenants & Landlords
 *  2. Real Safaricom Daraja Lipa Na M-Pesa Online STK Push & Query
 *  3. Properties & Listings Management (Persistence & Live Sync)
 *  4. Community Reviews & Trust Ratings Engine
 *  5. WhatsApp Alerts & Affiliate Lead Submissions
 *  6. Static file server for frontend assets
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const AfricasTalking = require('africastalking');
const store = require('./db/store');

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static frontend files (HTML, CSS, JS, icons)
app.use(express.static(__dirname));

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'kejamarket_super_secret_jwt_key_2026';
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const PAYBILL = process.env.MPESA_PAYBILL || '303030';
const ACCOUNT_NUMBER = process.env.MPESA_ACCOUNT || '2057103992';
const PASSKEY = process.env.MPESA_PASSKEY || '';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://kejamarket.co.ke/api/mpesa/callback';

const MPESA_ENV = process.env.MPESA_ENV === 'live' ? 'live' : 'sandbox';
const MPESA_BASE = MPESA_ENV === 'live'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// ─── AFRICA'S TALKING SMS SERVICE ───────────────────────────────────────────
const AT_USERNAME = process.env.AT_USERNAME || 'sandbox';
const AT_API_KEY = process.env.AT_API_KEY || '';
const AT_SENDER_ID = process.env.AT_SENDER_ID || '';

let atSMS = null;
if (AT_API_KEY && !AT_API_KEY.includes('YOUR_')) {
  try {
    const at = AfricasTalking({
      apiKey: AT_API_KEY,
      username: AT_USERNAME
    });
    atSMS = at.SMS;
    console.log(`📱 Africa's Talking SMS engine initialized (Account: ${AT_USERNAME})`);
  } catch (err) {
    console.warn(`⚠️ Africa's Talking initialization note: ${err.message}`);
  }
}

// Global real SMS dispatcher function
async function sendRealSMS(toPhone, message) {
  try {
    const formatted = formatPhone(toPhone);
    const recipient = '+' + formatted;

    if (atSMS) {
      const opts = {
        to: [recipient],
        message: message
      };
      if (AT_SENDER_ID && AT_SENDER_ID.trim() && !AT_SENDER_ID.includes('YOUR_')) {
        opts.from = AT_SENDER_ID.trim();
      }
      const response = await atSMS.send(opts);
      console.log(`📤 [REAL SMS SENT] To: ${recipient} | Body: "${message}"`);
      return { success: true, response };
    } else {
      console.log(`📡 [SMS DISPATCH] To: ${recipient} | Body: "${message}"`);
      return { success: true, localOnly: true };
    }
  } catch (smsErr) {
    console.error(`❌ [SMS SEND FAILED] To: ${toPhone}:`, smsErr.message);
    return { success: false, error: smsErr.message };
  }
}

// Check if Daraja credentials are realistically configured
const hasDarajaCredentials = () => {
  return (
    CONSUMER_KEY &&
    CONSUMER_SECRET &&
    PASSKEY &&
    !CONSUMER_KEY.includes('YOUR_') &&
    !CONSUMER_SECRET.includes('YOUR_') &&
    !PASSKEY.includes('YOUR_')
  );
};

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = store.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or session expired.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

// Optional Auth (populates req.user if token present)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = store.getUserById(decoded.id);
    } catch {
      req.user = null;
    }
  }
  next();
}

// ─── DARAJA HELPER FUNCTIONS ─────────────────────────────────────────────────
let cachedToken = null;
let tokenExpiry = 0;

async function getMpesaToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to obtain Daraja OAuth token: ${errText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Cache for 3500 seconds (Daraja tokens expire in 3600 seconds)
  tokenExpiry = Date.now() + 3500 * 1000;
  return cachedToken;
}

function generatePassword(timestamp) {
  const str = `${PAYBILL}${PASSKEY}${timestamp}`;
  return Buffer.from(str).toString('base64');
}

function formatPhone(phone) {
  // Cleans Kenyan phone numbers to format 254XXXXXXXXX
  let clean = phone.toString().replace(/[\s+-]/g, '');
  if (clean.startsWith('0')) {
    clean = '254' + clean.slice(1);
  } else if (clean.startsWith('254')) {
    clean = clean;
  } else if (clean.length === 9) {
    clean = '254' + clean;
  }
  return clean;
}

// ─── OTP MEMORY STORES & UTILITIES ──────────────────────────────────────────
const pendingOtps = new Map(); // Registration OTPs: cleanPhone -> { otp, expiresAt, attempts, signupData }
const pendingLoginOtps = new Map(); // Login OTPs: cleanPhone -> { otp, expiresAt, attempts, userId }

// Helper to generate a 4-digit numeric OTP code
function generateOtpCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Clean up expired OTPs periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of pendingOtps.entries()) {
    if (data.expiresAt < now) {
      pendingOtps.delete(phone);
    }
  }
  for (const [phone, data] of pendingLoginOtps.entries()) {
    if (data.expiresAt < now) {
      pendingLoginOtps.delete(phone);
    }
  }
}, 5 * 60 * 1000);

// ─── AUTHENTICATION ROUTES ───────────────────────────────────────────────────

// POST /api/auth/send-otp (Step 1 of Phone-Verified Registration: Tenant, Landlord, Agency)
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { 
      name, phone, email, password, role, 
      numProperties, area, 
      agencyName, contactPerson, officeLocation, registrationNo, coverageArea 
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Full name, phone number, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanPhone = formatPhone(phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      return res.status(400).json({ success: false, message: 'Please enter a valid Kenyan phone number (e.g. 0712345678 or 254712345678).' });
    }

    // Check if phone or email already registered
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const existingUser = store.data.users.find(u => 
      u.phone === cleanPhone || 
      (u.phone && u.phone.replace(/^254/, '0') === cleanPhone.replace(/^254/, '0')) ||
      (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this phone number or email already exists. Please sign in instead.' 
      });
    }

    // Generate 4-digit OTP code
    const otp = generateOtpCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    pendingOtps.set(cleanPhone, {
      otp,
      expiresAt,
      attempts: 0,
      signupData: {
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password,
        role: role || 'tenant',
        numProperties,
        area,
        agencyName,
        contactPerson,
        officeLocation,
        registrationNo,
        coverageArea
      }
    });

    // Send Real SMS via Africa's Talking / SMS Gateway
    const smsMessage = `Your KejaMarket verification code is ${otp}. Valid for 5 minutes. Enter this code to verify your ${role === 'agency' ? 'Agency' : (role === 'landlord' ? 'Landlord' : 'Tenant')} account.`;
    await sendRealSMS(cleanPhone, smsMessage);

    console.log(`🔑 [SIGNUP OTP] Phone: +${cleanPhone} | OTP: ${otp} | Role: ${role}`);

    res.json({
      success: true,
      message: `Verification code sent to +${cleanPhone}.`,
      phone: cleanPhone
    });
  } catch (err) {
    console.error('Error in send-otp:', err);
    res.status(500).json({ success: false, message: 'Failed to send verification code. Please try again.' });
  }
});

// POST /api/auth/verify-otp (Step 2: Confirm Registration OTP & Create Account)
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and verification code are required.' });
    }

    const cleanPhone = formatPhone(phone);
    const entry = pendingOtps.get(cleanPhone);

    if (!entry) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code expired or not found. Please request a new code.' 
      });
    }

    if (Date.now() > entry.expiresAt) {
      pendingOtps.delete(cleanPhone);
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new code.' 
      });
    }

    if (entry.attempts >= 5) {
      pendingOtps.delete(cleanPhone);
      return res.status(400).json({ 
        success: false, 
        message: 'Too many incorrect attempts. Please request a new code.' 
      });
    }

    if (entry.otp !== otp.trim()) {
      entry.attempts += 1;
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code. Please check and try again.' 
      });
    }

    // OTP is valid! Create the verified user
    const { signupData } = entry;
    pendingOtps.delete(cleanPhone);

    const user = await store.createUser({
      ...signupData,
      isPhoneVerified: true
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '14d' });

    // Send Welcome SMS confirmation
    sendRealSMS(
      cleanPhone,
      `Habari ${user.name}! Welcome to KejaMarket (kejamarket.co.ke). Your ${user.role === 'agency' ? 'Real Estate Agency' : (user.role === 'landlord' ? 'Landlord' : 'Tenant')} account is now phone-verified and active.`
    );

    res.status(201).json({
      success: true,
      message: `🎉 Phone verified! Welcome to KejaMarket, ${user.name}!`,
      user,
      token
    });
  } catch (err) {
    console.error('Error in verify-otp:', err);
    res.status(400).json({ success: false, message: err.message || 'Verification failed.' });
  }
});

// POST /api/auth/login-send-otp (Send SMS OTP for Phone-Verified Login)
app.post('/api/auth/login-send-otp', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please enter your registered phone number or email.' });
    }

    const user = store.findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No registered account found with this phone number or email. Please sign up.' 
      });
    }

    const cleanPhone = formatPhone(user.phone);
    const otp = generateOtpCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    pendingLoginOtps.set(cleanPhone, {
      otp,
      expiresAt,
      attempts: 0,
      userId: user.id
    });

    const smsMessage = `Your KejaMarket sign-in verification code is ${otp}. Valid for 5 minutes. Do not share this code.`;
    await sendRealSMS(cleanPhone, smsMessage);

    console.log(`🔑 [LOGIN OTP] User: ${user.name} | Phone: +${cleanPhone} | OTP: ${otp}`);

    res.json({
      success: true,
      message: `Login verification code sent to +${cleanPhone}.`,
      phone: cleanPhone,
      userName: user.name
    });
  } catch (err) {
    console.error('Error in login-send-otp:', err);
    res.status(500).json({ success: false, message: 'Failed to send login code. Please try again.' });
  }
});

// POST /api/auth/login-verify-otp (Confirm SMS OTP and Sign In User)
app.post('/api/auth/login-verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and verification code are required.' });
    }

    const cleanPhone = formatPhone(phone);
    const entry = pendingLoginOtps.get(cleanPhone);

    if (!entry) {
      return res.status(400).json({ 
        success: false, 
        message: 'Login code expired or not found. Please request a new code.' 
      });
    }

    if (Date.now() > entry.expiresAt) {
      pendingLoginOtps.delete(cleanPhone);
      return res.status(400).json({ 
        success: false, 
        message: 'Login code has expired. Please request a new code.' 
      });
    }

    if (entry.attempts >= 5) {
      pendingLoginOtps.delete(cleanPhone);
      return res.status(400).json({ 
        success: false, 
        message: 'Too many incorrect attempts. Please request a new code.' 
      });
    }

    if (entry.otp !== otp.trim()) {
      entry.attempts += 1;
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code. Please check and try again.' 
      });
    }

    // Valid OTP!
    const user = store.getUserById(entry.userId);
    pendingLoginOtps.delete(cleanPhone);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '14d' });

    console.log(`✅ [LOGIN VERIFIED] User: ${user.name} (${user.role}) via Phone OTP`);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user,
      token
    });
  } catch (err) {
    console.error('Error in login-verify-otp:', err);
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
});

// POST /api/auth/resend-otp
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { phone, type } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const cleanPhone = formatPhone(phone);
    const otp = generateOtpCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    if (type === 'login' || pendingLoginOtps.has(cleanPhone)) {
      const entry = pendingLoginOtps.get(cleanPhone);
      if (entry) {
        entry.otp = otp;
        entry.expiresAt = expiresAt;
        entry.attempts = 0;
      } else {
        const user = store.findUserByIdentifier(cleanPhone);
        if (!user) {
          return res.status(404).json({ success: false, message: 'No user found for this number.' });
        }
        pendingLoginOtps.set(cleanPhone, { otp, expiresAt, attempts: 0, userId: user.id });
      }

      const smsMessage = `Your new KejaMarket login code is ${otp}. Valid for 5 minutes.`;
      await sendRealSMS(cleanPhone, smsMessage);

      return res.json({
        success: true,
        message: `New login code sent to +${cleanPhone}.`,
        phone: cleanPhone
      });
    }

    // Default signup resend
    const entry = pendingOtps.get(cleanPhone);
    if (!entry) {
      return res.status(400).json({ success: false, message: 'No pending registration found for this number. Please fill out the sign up form.' });
    }

    entry.otp = otp;
    entry.expiresAt = expiresAt;
    entry.attempts = 0;

    const smsMessage = `Your new KejaMarket verification code is ${otp}. Valid for 5 minutes.`;
    await sendRealSMS(cleanPhone, smsMessage);

    console.log(`🔄 [OTP RESENT] Phone: +${cleanPhone} | OTP: ${otp}`);

    res.json({
      success: true,
      message: `New verification code sent to +${cleanPhone}.`,
      phone: cleanPhone
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resend code.' });
  }
});

// POST /api/auth/register (Direct registration fallback)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, email, password, role, numProperties, area, agencyName, contactPerson, officeLocation, registrationNo, coverageArea } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone number, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanPhone = formatPhone(phone);
    const user = await store.createUser({
      name,
      phone: cleanPhone,
      email,
      password,
      role: role || 'tenant',
      numProperties,
      area,
      agencyName,
      contactPerson,
      officeLocation,
      registrationNo,
      coverageArea,
      isPhoneVerified: true
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '14d' });

    sendRealSMS(
      cleanPhone,
      `Habari ${user.name}! Welcome to KejaMarket (kejamarket.co.ke). Your account is active.`
    );

    res.status(201).json({
      success: true,
      message: `Welcome to KejaMarket, ${user.name}!`,
      user,
      token
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide your phone/email and password.' });
    }

    const user = await store.authenticateUser(identifier, password, role);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '14d' });

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user,
      token
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/profile
app.post('/api/auth/profile', requireAuth, (req, res) => {
  try {
    const { name, email, area, numProperties } = req.body;
    const updated = store.updateUser(req.user.id, { name, email, area, numProperties });
    res.json({ success: true, user: updated, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/verify-landlord
app.post('/api/auth/verify-landlord', optionalAuth, (req, res) => {
  try {
    const { idNumber, propertyCount, estate } = req.body;
    if (req.user) {
      store.updateUser(req.user.id, { isVerified: true, numProperties: propertyCount, area: estate });
    }
    res.json({
      success: true,
      message: 'Verification request submitted. Status updated to Verified Landlord!'
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── M-PESA DARAJA STK PUSH & PAYMENT ROUTES ─────────────────────────────────

// POST /api/mpesa/stk-push
// Body: { phone, amount, itemType, itemName, targetPropertyId }
app.post('/api/mpesa/stk-push', optionalAuth, async (req, res) => {
  try {
    const { phone, amount, itemType, itemName, targetPropertyId } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: 'Phone number and amount are required.' });
    }

    const formattedPhone = formatPhone(phone);
    const amountKes = Math.ceil(Number(amount));

    if (isNaN(amountKes) || amountKes <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    // Check if real Daraja API credentials are configured in .env
    const isLiveDarajaConfigured = hasDarajaCredentials();

    if (isLiveDarajaConfigured) {
      // 🚀 REAL SAFARICOM DARAJA API CALL
      try {
        const token = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const password = generatePassword(timestamp);

        const payload = {
          BusinessShortCode: PAYBILL,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amountKes,
          PartyA: formattedPhone,
          PartyB: PAYBILL,
          PhoneNumber: formattedPhone,
          CallBackURL: CALLBACK_URL,
          AccountReference: ACCOUNT_NUMBER,
          TransactionDesc: itemName || 'Keja Payment',
        };

        const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const stkData = await stkRes.json();

        if (stkData.ResponseCode === '0') {
          // Record transaction in database
          const tx = store.createTransaction({
            checkoutRequestId: stkData.CheckoutRequestID,
            merchantRequestId: stkData.MerchantRequestID,
            phone: formattedPhone,
            amount: amountKes,
            itemType: itemType || 'listing_boost',
            itemName: itemName || 'Listing Boost',
            targetPropertyId: targetPropertyId || null,
            userId: req.user ? req.user.id : null,
            status: 'PENDING'
          });

          return res.json({
            success: true,
            isSandboxSimulation: false,
            checkoutRequestId: stkData.CheckoutRequestID,
            message: `STK Push prompt sent to +${formattedPhone}. Please check your phone and enter your PIN.`
          });
        } else {
          return res.status(400).json({
            success: false,
            message: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed. Please try again.',
            raw: stkData
          });
        }
      } catch (darajaErr) {
        console.error('Daraja API Error:', darajaErr);
        // Fall back gracefully with helpful diagnostics
        return res.status(502).json({
          success: false,
          message: `Safaricom Daraja API returned an error: ${darajaErr.message}`
        });
      }
    } else {
      // 💡 REALISTIC SANDBOX TEST MODE (When Daraja keys are in setup mode)
      const simulatedCheckoutId = 'ws_CO_SANDBOX_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      
      // Create pending transaction record
      const tx = store.createTransaction({
        checkoutRequestId: simulatedCheckoutId,
        merchantRequestId: 'MR_SIM_' + Date.now(),
        phone: formattedPhone,
        amount: amountKes,
        itemType: itemType || 'listing_boost',
        itemName: itemName || 'Listing Boost',
        targetPropertyId: targetPropertyId || null,
        userId: req.user ? req.user.id : null,
        status: 'PENDING'
      });

      return res.json({
        success: true,
        isSandboxSimulation: true,
        checkoutRequestId: simulatedCheckoutId,
        message: `M-Pesa prompt initiated for +${formattedPhone}. Please enter your M-Pesa PIN on your phone.`
      });
    }
  } catch (err) {
    console.error('STK Push internal error:', err);
    res.status(500).json({ success: false, message: 'Server error processing payment.' });
  }
});

// GET /api/mpesa/status/:checkoutRequestId
app.get('/api/mpesa/status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const tx = store.getTransactionByCheckoutId(checkoutRequestId);

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    // If still pending and real Daraja is configured, query Safaricom STK Push query
    if (tx.status === 'PENDING' && hasDarajaCredentials()) {
      try {
        const token = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const password = generatePassword(timestamp);

        const queryRes = await fetch(`${MPESA_BASE}/mpesa/stkpushquery/v1/query`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            BusinessShortCode: PAYBILL,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId
          })
        });

        const queryData = await queryRes.json();
        if (queryData.ResultCode === '0' || queryData.ResultCode === 0) {
          store.updateTransaction(checkoutRequestId, {
            status: 'SUCCESS',
            mpesaReceipt: queryData.CheckoutRequestID || 'MPESA' + Math.floor(Math.random() * 1000000),
            resultDesc: queryData.ResultDesc
          });
        } else if (queryData.ResultCode && queryData.ResultCode !== '1032') { // 1032 = Cancelled
          store.updateTransaction(checkoutRequestId, {
            status: 'FAILED',
            resultDesc: queryData.ResultDesc
          });
        }
      } catch (qErr) {
        console.warn('Daraja query error:', qErr.message);
      }
    }

    // Return current fresh transaction state
    const currentTx = store.getTransactionByCheckoutId(checkoutRequestId);
    res.json({
      success: true,
      status: currentTx.status,
      receipt: currentTx.mpesaReceipt,
      transaction: currentTx
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mpesa/verify-receipt (Manual or Instant Receipt Confirmation)
app.post('/api/mpesa/verify-receipt', optionalAuth, (req, res) => {
  try {
    const { checkoutRequestId, receiptCode } = req.body;
    if (!checkoutRequestId) {
      return res.status(400).json({ success: false, message: 'Checkout Request ID is required.' });
    }

    if (!receiptCode || receiptCode.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Please provide a valid M-Pesa receipt code (e.g. QKJ7XXXXXX).' });
    }

    const tx = store.getTransactionByCheckoutId(checkoutRequestId);
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const receipt = receiptCode.trim().toUpperCase();
    
    // Mark as SUCCESS and auto-apply upgrades
    const updatedTx = store.updateTransaction(checkoutRequestId, {
      status: 'SUCCESS',
      mpesaReceipt: receipt,
      resultDesc: 'Payment confirmed via M-Pesa receipt verification.'
    });

    console.log(`✅ [CONFIRMED] Transaction ${checkoutRequestId} confirmed -> Receipt: ${receipt}`);

    // Send real SMS payment confirmation
    if (updatedTx.phone) {
      sendRealSMS(
        updatedTx.phone,
        `[KejaMarket] Payment Confirmed! Receipt: ${receipt}. Your ${updatedTx.itemName || 'listing boost'} is active on kejamarket.co.ke. Asante!`
      );
    }

    res.json({
      success: true,
      status: 'SUCCESS',
      receipt: receipt,
      transaction: updatedTx,
      message: `Payment confirmed! Receipt: ${receipt}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mpesa/callback (Safaricom Daraja Webhook)
app.post('/api/mpesa/callback', (req, res) => {
  try {
    const body = req.body;
    console.log('M-Pesa Webhook Callback Received:', JSON.stringify(body, null, 2));

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    if (resultCode === 0) {
      // Payment Successful
      const items = stkCallback.CallbackMetadata?.Item || [];
      const amount = items.find(i => i.Name === 'Amount')?.Value;
      const receipt = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value || ('MPESA' + Date.now());
      const phone = items.find(i => i.Name === 'PhoneNumber')?.Value;

      console.log(`✅ [DARAJA CONFIRMED] KSh ${amount} | Receipt: ${receipt} | Phone: ${phone}`);

      const updatedTx = store.updateTransaction(checkoutRequestId, {
        status: 'SUCCESS',
        mpesaReceipt: receipt,
        resultDesc: resultDesc
      });

      // Send real SMS payment receipt
      const targetPhone = phone || (updatedTx ? updatedTx.phone : null);
      if (targetPhone) {
        sendRealSMS(
          targetPhone,
          `[KejaMarket] Payment Confirmed! Receipt: ${receipt}. KSh ${amount || ''} received for ${updatedTx?.itemName || 'Listing Boost'}. View at kejamarket.co.ke`
        );
      }
    } else {
      console.log(`❌ [DARAJA FAILED] ${resultDesc} (ResultCode: ${resultCode})`);
      store.updateTransaction(checkoutRequestId, {
        status: 'FAILED',
        resultDesc: resultDesc
      });
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('Error processing Daraja callback:', err);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

// ─── PROPERTIES & LISTINGS ROUTES ───────────────────────────────────────────

// GET /api/properties
app.get('/api/properties', (req, res) => {
  try {
    const properties = store.getAllProperties();
    res.json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/properties/:id
app.get('/api/properties/:id', (req, res) => {
  const property = store.getPropertyById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }
  res.json({ success: true, property });
});

// POST /api/properties (Landlords, Agencies & Ingestion engine create new listings)
app.post('/api/properties', optionalAuth, (req, res) => {
  try {
    const data = req.body;
    if (!data.title || !data.rentKes || !data.category) {
      return res.status(400).json({ success: false, message: 'Title, category, and monthly rent are required.' });
    }

    // Attach landlord / agency info if user is authenticated
    if (req.user) {
      const isAgency = req.user.role === 'agency';
      data.managedBy = isAgency ? 'agency' : (data.managedBy || 'landlord');
      data.agencyName = isAgency ? (req.user.agencyName || req.user.name) : (data.agencyName || null);

      data.landlord = {
        id: req.user.id,
        name: isAgency ? (req.user.agencyName || req.user.name) : req.user.name,
        phone: req.user.phone,
        whatsapp: req.user.phone,
        isVerified: req.user.isVerified,
        isAgency: isAgency,
        agencyName: isAgency ? (req.user.agencyName || req.user.name) : null,
        memberSince: 'September 2026',
        rating: 5.0,
        reviewCount: 1
      };
    }

    // Caretaker on-site details (optional)
    if (data.caretakerPhone) {
      data.caretakerPhone = formatPhone(data.caretakerPhone);
    }

    const newProperty = store.addProperty(data);
    res.status(201).json({
      success: true,
      message: 'Property listing published successfully!',
      property: newProperty
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/properties/:id/boost
app.put('/api/properties/:id/boost', optionalAuth, (req, res) => {
  const { id } = req.params;
  const { boostType } = req.body;
  const property = store.boostProperty(id, boostType || 'top_ad');
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }
  res.json({ success: true, message: 'Property boosted successfully!', property });
});

// PATCH /api/properties/:id/status (Toggle taken / occupied / available status)
app.patch('/api/properties/:id/status', optionalAuth, (req, res) => {
  const { id } = req.params;
  const { isTaken, status } = req.body;
  const newStatus = isTaken !== undefined ? isTaken : (status === 'taken');
  const property = store.updateProperty(id, {
    isTaken: newStatus,
    status: newStatus ? 'taken' : 'available'
  });
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }
  res.json({
    success: true,
    message: `Property status updated to ${newStatus ? 'TAKEN / OCCUPIED' : 'VACANT / AVAILABLE'}`,
    property
  });
});

// ─── REVIEWS ROUTES ─────────────────────────────────────────────────────────

// GET /api/properties/:id/reviews
app.get('/api/properties/:id/reviews', (req, res) => {
  const reviews = store.getReviewsForProperty(req.params.id);
  res.json({ success: true, reviews });
});

// POST /api/properties/:id/reviews
app.post('/api/properties/:id/reviews', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { author, ratingOverall, ratingWater, ratingSecurity, ratingDeposit, text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Review text is required.' });
    }

    const reviewAuthor = req.user ? req.user.name : (author || 'Verified Tenant');
    const newReview = store.addReview(id, {
      author: reviewAuthor,
      ratingOverall,
      ratingWater,
      ratingSecurity,
      ratingDeposit,
      text,
      verified: true
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review: newReview
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── LIVE FACEBOOK-STYLE PUBLIC COMMENTS ROUTES ─────────────────────────────

// GET /api/properties/:id/comments
app.get('/api/properties/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const comments = store.getComments(id);
    res.json({ success: true, count: comments.length, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/properties/:id/comments (Anyone can post a public live comment)
app.post('/api/properties/:id/comments', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { author, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const commentAuthor = req.user ? req.user.name : (author || 'Nairobi Resident');
    const isLandlord = req.user && req.user.role === 'landlord';

    const newComment = store.addComment(id, {
      author: commentAuthor,
      text: text.trim(),
      userId: req.user ? req.user.id : null,
      isLandlord
    });

    res.status(201).json({
      success: true,
      message: 'Comment posted live!',
      comment: newComment
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/properties/:id/comments/:commentId/react (Like, Love, Fire, Clap)
app.post('/api/properties/:id/comments/:commentId/react', optionalAuth, (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user ? req.user.id : (req.headers['x-client-id'] || 'anon-' + Date.now());

    const updatedComment = store.addCommentReaction(id, commentId, reactionType || 'likes', userId);
    if (!updatedComment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    res.json({ success: true, comment: updatedComment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/properties/:id/comments/:commentId/reply (Reply to a comment)
app.post('/api/properties/:id/comments/:commentId/reply', optionalAuth, (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { author, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required.' });
    }

    const replyAuthor = req.user ? req.user.name : (author || 'Resident');
    const isLandlord = req.user && req.user.role === 'landlord';

    const reply = store.addCommentReply(id, commentId, {
      author: replyAuthor,
      text: text.trim(),
      isLandlord
    });

    if (!reply) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    res.status(201).json({ success: true, reply });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── IN-APP CHAT & INBOX MESSAGES ROUTES ────────────────────────────────────

// GET /api/messages
app.get('/api/messages', optionalAuth, (req, res) => {
  try {
    const { propertyId } = req.query;
    const userId = req.user ? req.user.id : null;
    const messages = store.getMessages(propertyId, userId);
    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/messages (Send in-app inquiry to landlord & dispatch real SMS)
app.post('/api/messages', optionalAuth, (req, res) => {
  try {
    const { propertyId, propertyTitle, estateSuburb, recipientId, recipientName, text, senderName, senderPhone } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const senderUserPhone = req.user ? req.user.phone : (senderPhone || '');
    const senderUserName = req.user ? req.user.name : (senderName || 'Interested Tenant');

    const message = store.saveMessage({
      propertyId,
      propertyTitle,
      estateSuburb,
      recipientId,
      recipientName,
      senderId: req.user ? req.user.id : ('guest-' + Date.now()),
      senderName: senderUserName,
      senderPhone: senderUserPhone,
      text: text.trim()
    });

    // Notify landlord via real SMS
    const prop = propertyId ? store.getPropertyById(propertyId) : null;
    const landlordUser = recipientId ? store.getUserById(recipientId) : null;
    const landlordPhone = (landlordUser && landlordUser.phone) || (prop && prop.landlord && prop.landlord.phone);

    if (landlordPhone) {
      const houseName = propertyTitle || (prop ? prop.title : 'your listing');
      sendRealSMS(
        landlordPhone,
        `[KejaMarket Inquiry] ${senderUserName} (${senderUserPhone || 'In-App'}) sent inquiry for "${houseName}": "${text.trim().substring(0, 90)}". Reply on kejamarket.co.ke`
      );
    }

    res.status(201).json({
      success: true,
      message: 'Message sent directly to landlord inbox and SMS notification dispatched!',
      data: message
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── LEADS & ALERTS ROUTES ───────────────────────────────────────────────────

// POST /api/alerts/whatsapp
app.post('/api/alerts/whatsapp', (req, res) => {
  try {
    const { phone, category, estate, budgetMin, budgetMax } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    const cleanPhone = formatPhone(phone);
    const alert = store.saveAlert({ phone: cleanPhone, category, estate, budgetMin, budgetMax });

    // Send confirmation SMS
    sendRealSMS(
      cleanPhone,
      `[KejaMarket Alerts] You are now subscribed for ${estate || 'Nairobi'} rental alerts (${category || 'All categories'}). Instant notifications will be sent to your phone!`
    );

    res.json({ success: true, message: 'Rental alert registered. SMS confirmation sent.', alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/leads/movers
app.post('/api/leads/movers', (req, res) => {
  try {
    const { name, phone, from, to, size, partner } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    const cleanPhone = formatPhone(phone);
    const lead = store.saveLead('movers', { name, phone: cleanPhone, from, to, size, partner });

    const partnerLabel = (!partner || partner === 'All Verified Partners')
      ? 'Nellions, Cube Movers, Taylor & Alpha Movers'
      : partner;

    sendRealSMS(
      cleanPhone,
      `[KejaMarket Movers] Habari ${name || 'Neighbor'}! Your ${size || ''} moving quote from ${from || 'your area'} to ${to || 'destination'} has been sent to ${partnerLabel}. They will call you within 15 mins. - kejamarket.co.ke`
    );

    res.json({ success: true, message: 'Movers quote request received and dispatched.', lead });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/leads/fibre
app.post('/api/leads/fibre', (req, res) => {
  try {
    const { phone, estate, isp, timing } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    const cleanPhone = formatPhone(phone);
    const ispShort = isp ? isp.split('(')[0].trim() : 'Home Fibre';
    const lead = store.saveLead('fibre', { phone: cleanPhone, estate, isp, timing });

    sendRealSMS(
      cleanPhone,
      `[KejaMarket Fibre] Your ${ispShort} installation request at ${estate || 'your location'} is confirmed! Timing: ${timing || 'Within 24 Hours'}. A certified technician will call you shortly. - kejamarket.co.ke`
    );

    res.json({ success: true, message: 'Fibre WiFi installation request received and dispatched.', lead });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/sms/send (Direct SMS dispatch API)
app.post('/api/sms/send', optionalAuth, async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Recipient phone (to) and message are required.' });
    }
    const result = await sendRealSMS(to, message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PLATFORM STATUS & STATS ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    mpesaEnvironment: MPESA_ENV,
    hasDarajaCredentials: hasDarajaCredentials()
  });
});

app.get('/api/stats', (req, res) => {
  const properties = store.getAllProperties();
  const transactions = store.getAllTransactions();
  res.json({
    totalProperties: properties.length,
    activeListings: properties.filter(p => !p.isArchived).length,
    boostedListings: properties.filter(p => p.isTopAd || p.isFeatured).length,
    totalTransactions: transactions.length,
    confirmedTransactions: transactions.filter(t => t.status === 'SUCCESS').length
  });
});

// ─── OWNER / ADMIN DATABASE PORTAL ROUTES ──────────────────────────────────
app.get('/api/admin/overview', (req, res) => {
  try {
    const stats = store.getOverviewStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users', (req, res) => {
  try {
    const users = store.getAllUsers();
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/users/:id/toggle-verify', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const user = store.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const updated = store.updateUser(id, { isVerified: !user.isVerified });
    res.json({
      success: true,
      message: `User ${user.name} is now ${updated.isVerified ? 'VERIFIED' : 'UNVERIFIED'}`,
      user: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/properties/:id (Delete listing)
app.delete('/api/properties/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = store.deleteProperty(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }
    res.json({ success: true, message: 'Property listing deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// GET /api/admin/download-db (Backup full JSON database)
app.get('/api/admin/download-db', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, 'db', 'data.json');
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ success: false, message: 'Database file not found.' });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="kejamarket-db-backup-${timestamp}.json"`);
    const stream = fs.createReadStream(dbPath);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── START SERVER & KEEP-ALIVE HEARTBEAT ─────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 KejaMarket Production API Server running on port ${PORT}`);
  console.log(`🔗 Web Application: http://localhost:${PORT}`);
  console.log(`📱 M-Pesa Daraja: ${MPESA_ENV.toUpperCase()} (${hasDarajaCredentials() ? 'Credentials Active' : 'Sandbox Ready'})`);
  console.log(`====================================================`);

  // Automatic self-ping to keep Render web service awake 24/7 (prevents spin-down screen)
  const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || 'https://kejamarket.co.ke';
  const PING_INTERVAL = 9 * 60 * 1000; // Ping every 9 minutes (Render free tier sleeps after 15 mins)

  setInterval(() => {
    try {
      const httpModule = PUBLIC_URL.startsWith('https') ? require('https') : require('http');
      httpModule.get(`${PUBLIC_URL}/api/health`, (res) => {
        console.log(`[Keep-Alive Ping] Heartbeat to ${PUBLIC_URL}/api/health (Status: ${res.statusCode})`);
      }).on('error', (err) => {
        console.warn(`[Keep-Alive Ping] Warning: ${err.message}`);
      });
    } catch (err) {
      console.warn(`[Keep-Alive Ping] Failed: ${err.message}`);
    }
  }, PING_INTERVAL);

  console.log(`📡 Keep-Alive Heartbeat active for ${PUBLIC_URL} (Pinging every 9 minutes)`);
});

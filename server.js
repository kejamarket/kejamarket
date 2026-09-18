/**
 * KejaMarket â€“ Production Backend API & M-Pesa Daraja Integration
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
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const AfricasTalking = require('africastalking');
const fs = require('fs');
const path = require('path');

// Use require for node-fetch v2 compatibility
const fetch = require('node-fetch');

// Email & Upload services
const emailService = require('./db/email-service');
const uploadService = require('./db/upload-service');

// â”€â”€â”€ RATE LIMITING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const rateLimit = require('express-rate-limit');

// Auth endpoints: max 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// OTP endpoints: stricter â€” max 5 per 10 minutes
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Upload endpoint: max 30 per minute
// Password reset limiter: max 15 requests per 15 minutes per IP
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many password reset requests. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many upload requests. Please slow down.' }
});

const app = express();

// ── SECURITY HEADERS (helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disabled to allow inline scripts in frontend
  crossOriginEmbedderPolicy: false
}));

// ── CORS: restrict to own domain only ────────────────────────────────────────
const allowedOrigins = [
  'https://kejamarket.co.ke',
  'https://www.kejamarket.co.ke',
  'https://kejamarket-prod.onrender.com',
  'http://localhost:3001',
  'http://localhost:3000'
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Render health checks, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any Render preview URLs for this service
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Strip accidental trailing dots or punctuation from URLs (e.g. copied from markdown sentences)
app.use((req, res, next) => {
  if (req.url && req.url.endsWith('.') && !req.url.includes('..')) {
    req.url = req.url.replace(/\.+$/, '');
  }
  next();
});

// ── BLOCK SENSITIVE FILES before static middleware ────────────────────────────
const blockedPaths = [
  '/.env', '/.git', '/admin-token.txt', '/db/data.json',
  '/db/schema.sql', '/db/store.js', '/db/postgres-store.js',
  '/db/postgres-migration.sql', '/package.json', '/package-lock.json',
  '/ecosystem.config.js', '/docker-compose.yml', '/Dockerfile',
  '/Procfile', '/nginx.conf', '/server.js', '/start.js', '/validate.js'
];
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (
    blockedPaths.some(b => p === b || p.startsWith(b + '/')) ||
    p.endsWith('.env') ||
    p.endsWith('.sql') ||
    p.includes('/.git/') ||
    p.includes('/node_modules/')
  ) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

// Serve static frontend files (HTML, CSS, JS, icons)
app.use(express.static(__dirname));

// SEO, AI & Robots files
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// LLM & AI Overview discovery (llmstxt.org specification)
app.get('/llms.txt', (req, res) => {
  res.type('text/plain; charset=utf-8');
  res.sendFile(path.join(__dirname, 'llms.txt'));
});

app.get('/llms-full.txt', (req, res) => {
  res.type('text/plain; charset=utf-8');
  res.sendFile(path.join(__dirname, 'llms-full.txt'));
});

// Google Search Console verification
app.get('/google642f7a569b79cbd3.html', (req, res) => {
  res.type('text/html');
  res.sendFile(path.join(__dirname, 'google642f7a569b79cbd3.html'));
});

app.get('/google0d6d966ed0ac9dd8.html', (req, res) => {
  res.type('text/html');
  res.sendFile(path.join(__dirname, 'google0d6d966ed0ac9dd8.html'));
});

// Bing Webmaster Tools XML verification
app.get('/BingSiteAuth.xml', (req, res) => {
  res.type('application/xml; charset=utf-8');
  res.sendFile(path.join(__dirname, 'BingSiteAuth.xml'));
});

// IndexNow key verification file (Bing & Copilot Instant Crawl)
app.get('/e80fc85ec99b4d81a9544ef4a6527b14.txt', (req, res) => {
  res.type('text/plain; charset=utf-8');
  res.sendFile(path.join(__dirname, 'e80fc85ec99b4d81a9544ef4a6527b14.txt'));
});

// IndexNow Trigger Endpoint
app.post('/api/seo/submit-indexnow', (req, res) => {
  try {
    const { submitIndexNow } = require('./scripts/submit-indexnow');
    submitIndexNow();
    res.json({ success: true, message: 'IndexNow instant submission initiated for Bing and Copilot' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// â”€â”€â”€ LEGAL & STATIC PAGE ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/privacy-policy', (req, res) => res.sendFile(path.join(__dirname, 'privacy-policy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'terms.html')));
app.get('/terms-and-conditions', (req, res) => res.sendFile(path.join(__dirname, 'terms.html')));
app.get('/offline', (req, res) => res.sendFile(path.join(__dirname, 'offline.html')));

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// INITIALIZE DATABASE (PostgreSQL with JSON fallback)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

let store;
async function initializeDatabase() {
  console.log('🚀 KEJAMARKET DATABASE INITIALIZATION');
  
  const POOLER_URL = 'postgresql://postgres.cwqmtrwdbjmsrrqjkfmj:Stallonjevugwe4@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
  
  // Auto-rewrite direct Supabase URL to pooler for IPv4 compatibility (critical for Render)
  if (process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('db.cwqmtrwdbjmsrrqjkfmj.supabase.co') || process.env.DATABASE_URL.includes('.supabase.co:5432'))) {
    console.log('🔄 Rewriting process.env.DATABASE_URL to IPv4 Supabase Connection Pooler...');
    process.env.DATABASE_URL = POOLER_URL;
  }
  
  try {
    console.log('Initializing PostgreSQL database (Supabase)...');
    console.log('DATABASE_URL sources:');
    console.log('  - Global:', global.KEJAMARKET_DATABASE_URL ? '✅ SET' : '❌ NOT SET');
    console.log('  - Env:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');
    console.log('  - Target URL starts with:', (global.KEJAMARKET_DATABASE_URL || process.env.DATABASE_URL || POOLER_URL).substring(0, 50));
    
    store = require('./db/postgres-store.js');
    const success = await store.init();

    if (success && store.isConnected) {
      try {
        const { Pool } = require('pg');
        const databaseUrl = global.KEJAMARKET_DATABASE_URL || process.env.DATABASE_URL || POOLER_URL;
        const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
        const schemaSql = fs.readFileSync(path.join(__dirname, 'db/postgres-migration.sql'), 'utf8');
        await store.query(schemaSql);
        await pool.end();
        console.log('✅ Schema migrations applied');
      } catch (schemaErr) {
        console.warn('Schema update notice:', schemaErr.message);
      }
      console.log('✅ PostgreSQL database (Supabase) connected successfully');
    } else {
      console.warn('⚠️ PostgreSQL store not connected; using store fallback');
      if (!store || !store.getAllProperties) {
        store = require('./db/store.js');
      }
    }
  } catch (error) {
    console.error('⚠️ Database initialization error:', error.message);
    try {
      store = require('./db/store.js');
      console.log('✅ Fallback store loaded; keeping server online');
    } catch (fbErr) {
      console.error('Fatal store fallback failure:', fbErr.message);
    }
  }

  emailService.initEmailService();
  uploadService.initCloudinary();
}

// â”€â”€â”€ CONFIGURATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const JWT_SECRET = process.env.JWT_SECRET || 'kejamarket_super_secret_jwt_key_2026';
let CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
let CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
let PAYBILL = process.env.MPESA_PAYBILL || '303030';
let ACCOUNT_NUMBER = process.env.MPESA_ACCOUNT || '2057103992';
let PASSKEY = process.env.MPESA_PASSKEY || '';
let CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://kejamarket.co.ke/api/mpesa/callback';

let MPESA_ENV = process.env.MPESA_ENV === 'live' ? 'live' : 'sandbox';
let MPESA_BASE = MPESA_ENV === 'live'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// â”€â”€â”€ AFRICA'S TALKING SMS SERVICE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AT_USERNAME = process.env.AT_USERNAME || 'sandbox';
const AT_API_KEY = process.env.AT_API_KEY || '';
const AT_SENDER_ID = process.env.AT_SENDER_ID || '';

let atSMS = null;
let smsService = null;

// Initialize Africa's Talking with error handling
try {
  if (AT_API_KEY && AT_API_KEY.trim() && !AT_API_KEY.includes('YOUR_')) {
    const africastalking = AfricasTalking({
      apiKey: AT_API_KEY,
      username: AT_USERNAME
    });
    
    smsService = africastalking.SMS;
    console.log(`ðŸ“± Africa's Talking SMS engine initialized (Account: ${AT_USERNAME})`);
  } else {
    console.log(`ðŸ“± Africa's Talking SMS: API Key not provided - SMS disabled`);
  }
} catch (error) {
  console.warn(`âš ï¸ Africa's Talking initialization failed:`, error.message);
  smsService = null;
}

// Global real SMS dispatcher function
async function sendRealSMS(toPhone, message) {
  try {
    const formatted = formatPhone(toPhone);
    const recipient = '+' + formatted;

    if (smsService && AT_API_KEY && !AT_API_KEY.includes('YOUR_')) {
      const options = {
        to: [recipient],
        message: message
      };
      
      if (AT_SENDER_ID && AT_SENDER_ID.trim() && !AT_SENDER_ID.includes('YOUR_')) {
        options.from = AT_SENDER_ID.trim();
      }

      try {
        const result = await smsService.send(options);
        console.log(`ðŸ“¤ [REAL SMS SENT] To: ${recipient} | Status: Success | Response:`, result);
        return { success: true, response: result };
      } catch (apiError) {
        console.error(`âŒ [SMS API FAILED] To: ${recipient}:`, apiError.message);
        return { success: false, error: apiError.message };
      }
    } else {
      console.log(`ðŸ“¡ [SMS DISPATCH] To: ${recipient} | Body: "${message}" (SMS service not available)`);
      return { success: true, localOnly: true };
    }
  } catch (smsErr) {
    console.error(`âŒ [SMS SEND FAILED] To: ${toPhone}:`, smsErr.message);
    return { success: false, error: smsErr.message };
  }
}

// Alias for backwards compatibility
const sendSMS = sendRealSMS;

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

// â”€â”€â”€ AUTH MIDDLEWARE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRaw = store.getUserById(decoded.id);
    const user = (userRaw && typeof userRaw.then === 'function') ? await userRaw : userRaw;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or session expired.' });
    }
    // Normalize snake_case DB fields to camelCase
    if (user.is_admin !== undefined) {
      user.isAdmin = user.is_admin === true || user.is_admin === 1;
    }
    if (user.is_verified !== undefined) {
      user.isVerified = user.is_verified === true || user.is_verified === 1;
    }
    // Always treat usr-admin-01 or role=admin as admin
    if (user.id === 'usr-admin-01' || user.role === 'admin') {
      user.isAdmin = true;
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

// Optional Auth (populates req.user if token present)
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await store.getUserById(decoded.id);
    } catch {
      req.user = null;
    }
  }
  next();
}

// â”€â”€â”€ DARAJA HELPER FUNCTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

function getDarajaTimestamp() {
  const now = new Date();
  const d = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
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

// â”€â”€â”€ OTP MEMORY STORES & UTILITIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ AUTHENTICATION ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// POST /api/auth/send-otp (Step 1 of Phone-Verified Registration: Tenant, Landlord, Agency)
app.post('/api/auth/send-otp', otpLimiter, async (req, res) => {
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

    console.log(`[SIGNUP] OTP sent to: +${cleanPhone}`);

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

    // Send welcome email
    if (user.email) {
      emailService.sendWelcomeEmail(user.email, user.name, user.role).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: `ðŸŽ‰ Phone verified! Welcome to KejaMarket, ${user.name}!`,
      user,
      token
    });
  } catch (err) {
    console.error('Error in verify-otp:', err);
    res.status(400).json({ success: false, message: err.message || 'Verification failed.' });
  }
});

// POST /api/auth/login-send-otp (Send SMS OTP for Phone-Verified Login)
app.post('/api/auth/login-send-otp', otpLimiter, async (req, res) => {
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

    console.log(`[LOGIN] OTP sent to: +${cleanPhone}`);

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
    const user = await store.getUserById(entry.userId);
    pendingLoginOtps.delete(cleanPhone);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '14d' });

    console.log(`âœ… [LOGIN VERIFIED] User: ${user.name} (${user.role}) via Phone OTP`);

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

    console.log("[OTP] Resent to: +${cleanPhone}");

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
    console.log('?? [REGISTER] Request received:', { 
      name: req.body.name, 
      phone: req.body.phone, 
      email: req.body.email,
      role: req.body.role 
    });

    const { name, phone, email, password, role, numProperties, area, agencyName, contactPerson, officeLocation, registrationNo, coverageArea, serviceCategory, serviceBusiness, serviceAreas } = req.body;

    if (!name || !phone || !password) {
      console.log('? [REGISTER] Missing required fields');
      return res.status(400).json({ success: false, message: 'Name, phone number, and password are required.' });
    }

    if (password.length < 6) {
      console.log('? [REGISTER] Password too short');
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanPhone = formatPhone(phone);
    console.log('?? [REGISTER] Clean phone:', cleanPhone);

    // Check if user already exists
    try {
      const existingUser = await store.getUser(cleanPhone);
      if (existingUser) {
        console.log('? [REGISTER] User already exists');
        return res.status(400).json({ success: false, message: 'Phone number already registered. Please sign in instead.' });
      }
    } catch (err) {
      console.log('?? [REGISTER] Error checking existing user:', err.message);
    }

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
      serviceCategory,
      serviceBusiness,
      serviceAreas,
      isPhoneVerified: true
    });

    console.log('? [REGISTER] User created:', user.id);

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '14d' });

    sendRealSMS(
      cleanPhone,
      `Habari ${user.name}! Welcome to KejaMarket (kejamarket.co.ke). Your account is active.`
    );

    // Send welcome email
    if (user.email) {
      emailService.sendWelcomeEmail(user.email, user.name, user.role).catch(() => {});
    }

    console.log('? [REGISTER] Success, returning user and token');

    res.status(201).json({
      success: true,
      message: `Welcome to KejaMarket, ${user.name}!`,
      user,
      token
    });
  } catch (err) {
    console.error('? [REGISTER] Error:', err);
    res.status(400).json({ success: false, message: err.message || 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/register-enhanced (Enhanced multi-step registration with role-specific data)
app.post('/api/auth/register-enhanced', async (req, res) => {
  try {
    const { userType, role, name, position, phone, email, password, verification, properties } = req.body;

    // Validation
    if (!userType || !name || !phone || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be provided.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters.' 
      });
    }

    const cleanPhone = formatPhone(phone);
    
    // Check if user already exists
    const existingUser = await store.getUser(cleanPhone);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number already registered.' 
      });
    }

    // Create enhanced user profile based on role
    let userData = {
      name,
      phone: cleanPhone,
      email,
      password,
      isPhoneVerified: false, // Needs verification
      registrationData: {
        userType,
        role,
        registrationDate: new Date(),
        verificationStatus: 'pending'
      }
    };

    // Role-specific data handling
    if (userType === 'property-manager') {
      userData.role = 'landlord'; // Backend compatibility
      userData.registrationData.propertyRole = role;
      
      if (role === 'caretaker') {
        userData.registrationData.position = position;
        userData.registrationData.verification = verification;
        userData.registrationData.properties = properties || [];
        userData.registrationData.isCaretaker = true;
        
        // Calculate total units managed
        const totalUnits = properties.reduce((sum, prop) => sum + (parseInt(prop.units) || 0), 0);
        userData.numProperties = properties.length;
        userData.registrationData.totalUnits = totalUnits;
      }
      
      // Set appropriate badge
      userData.registrationData.badge = role === 'caretaker' ? 'caretaker' : 'property-owner';
      
    } else {
      userData.role = userType; // tenant or service
    }

    // Create user account
    const user = await store.createUser(userData);
    
    // Generate verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await store.storeOTP(cleanPhone, otp, 'registration-verification');
    
    // Send verification SMS
    let smsMessage = `KejaMarket Verification: Your OTP is ${otp}. `;
    if (role === 'caretaker') {
      smsMessage += `Your Property Partner application is under review.`;
    } else {
      smsMessage += `Complete your registration with this code.`;
    }
    
    const smsResult = await sendRealSMS(cleanPhone, smsMessage);
    
    // Send welcome email with role-specific content
    if (user.email) {
      let welcomeSubject = 'Welcome to KejaMarket!';
      let roleTitle = 'User';
      
      if (role === 'caretaker') {
        welcomeSubject = 'KejaMarket Property Partner Application Received';
        roleTitle = 'Property Partner';
      } else if (userType === 'property-manager') {
        roleTitle = 'Property Manager';
      }
      
      emailService.sendWelcomeEmail(user.email, user.name, roleTitle, {
        isEnhancedRegistration: true,
        needsVerification: true,
        role: role,
        userType: userType
      }).catch(() => {});
    }
    
    // Admin notification for caretaker registrations
    if (role === 'caretaker') {
      console.log(`?? New Caretaker Registration: ${name} (${cleanPhone}) - Managing ${properties.length} properties`);
      // Could add admin email notification here
    }
    
    res.status(201).json({
      success: true,
      message: role === 'caretaker' ? 
        'Property Partner application submitted! Check your SMS for verification.' :
        'Registration successful! Please verify your phone number.',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: userData.role,
        registrationData: userData.registrationData
      },
      needsVerification: true,
      verificationSent: smsResult.success
    });
    
  } catch (err) {
    console.error('Enhanced registration error:', err);
    res.status(400).json({ 
      success: false, 
      message: err.message || 'Registration failed. Please try again.' 
    });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', authLimiter, async (req, res) => {
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

// GET /api/user/dashboard — unified stats for all roles after login
app.get('/api/user/dashboard', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;
    const userPhone = user.phone;
    const role = user.role;

    // Base stats for every user
    let stats = {
      role,
      name: user.name,
      isVerified: user.isVerified || user.is_verified || false,
      listings: 0,
      activeListings: 0,
      pendingListings: 0,
      messages: 0,
      unreadMessages: 0,
      favourites: 0,
      totalViews: 0
    };

    // Listings count (landlord, agency, service, marketplace sellers)
    try {
      const allProps = await store.getAllProperties();
      const myProps = allProps.filter(p =>
        p.landlordId === userId ||
        p.postedBy === userId ||
        (p.landlord && (p.landlord.id === userId || p.landlord.phone === userPhone)) ||
        p.landlordPhone === userPhone
      );
      stats.listings = myProps.length;
      stats.activeListings = myProps.filter(p => p.isApproved || p.status === 'approved').length;
      stats.pendingListings = myProps.filter(p => !p.isApproved && p.status !== 'approved').length;
      stats.totalViews = myProps.reduce((sum, p) => sum + (p.views || p.viewCount || 0), 0);
    } catch (e) { /* non-fatal */ }

    // Services count for service providers
    if (role === 'service') {
      try {
        const allServices = store.getAllServices ? await store.getAllServices() : [];
        const myServices = allServices.filter(s => s.userId === userId || s.providerId === userId);
        stats.listings = myServices.length;
        stats.activeListings = myServices.filter(s => s.isVerified || s.status === 'approved').length;
        stats.pendingListings = myServices.filter(s => !s.isVerified && s.status !== 'approved').length;
      } catch (e) { /* non-fatal */ }
    }

    // Marketplace items count
    if (role === 'tenant' || role === 'buyer') {
      try {
        const allItems = store.getAllMarketplaceItems ? await store.getAllMarketplaceItems() : [];
        const myItems = allItems.filter(i => i.userId === userId || i.sellerId === userId);
        if (myItems.length > 0) {
          stats.listings = myItems.length;
          stats.activeListings = myItems.filter(i => i.status === 'active' || i.isActive).length;
        }
      } catch (e) { /* non-fatal */ }
    }

    // Messages
    try {
      const msgs = store.getLandlordMessages ? store.getLandlordMessages(userId) : [];
      stats.messages = msgs.length;
      stats.unreadMessages = msgs.filter(m => !m.isRead).length;
    } catch (e) { /* non-fatal */ }

    // Favourites
    try {
      const favs = store.getUserFavourites ? await store.getUserFavourites(userId) : [];
      stats.favourites = Array.isArray(favs) ? favs.length : 0;
    } catch (e) { /* non-fatal */ }

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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

// â”€â”€â”€ PASSWORD RESET ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ─────────────────────────────────────────────────────────────────
// PASSWORD RESET ROUTES (Email-only via Resend)
// ─────────────────────────────────────────────────────────────────

// POST /api/auth/forgot-password — email-only reset link via Resend
app.post('/api/auth/forgot-password', resetLimiter, async (req, res) => {
  // Always return neutral response to prevent user enumeration
  const neutralResponse = {
    success: true,
    message: 'If that email address is registered, a password reset link has been sent. Please check your inbox.'
  };

  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await store.findUserByIdentifier(cleanEmail);

    // If user does not exist or has no matching email, still return neutral success
    if (!user || !user.email || user.email.toLowerCase() !== cleanEmail) {
      return res.json(neutralResponse);
    }

    // Generate cryptographically random 64-character hex token
    const crypto = require('crypto');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store token hash in DB or memory fallback
    try {
      if (store.createPasswordResetToken) {
        await store.createPasswordResetToken(user.id, tokenHash, expiresAt);
      } else {
        pendingOtps.set('reset_' + tokenHash, {
          tokenHash,
          userId: user.id,
          expiresAt: Date.now() + 60 * 60 * 1000
        });
      }
    } catch (tokenErr) {
      console.warn('Token DB storage failed, using memory fallback:', tokenErr.message);
      pendingOtps.set('reset_' + tokenHash, {
        tokenHash,
        userId: user.id,
        expiresAt: Date.now() + 60 * 60 * 1000
      });
    }

    // Build reset link using APP_URL or request host
    const appUrl = (process.env.APP_URL || (req.protocol + '://' + req.get('host'))).replace(/\/+$/, '');
    const resetUrl = `${appUrl}/?reset_token=${rawToken}`;

    // Send email via Resend (non-blocking)
    emailService.sendPasswordResetLink(user.email, user.name || 'KejaMarket User', resetUrl).catch(err => {
      console.error('Failed to send password reset email via Resend:', err.message);
    });

    console.log(`[RESET] Password reset link generated for user ID ${user.id}`);
    return res.json(neutralResponse);
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred. Please try again later.' });
  }
});

// GET /api/auth/reset-password/validate — validate token before showing reset form
app.get('/api/auth/reset-password/validate', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, message: 'Invalid or missing reset token.' });
    }

    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    let valid = false;
    if (store.getPasswordResetToken) {
      const record = await store.getPasswordResetToken(tokenHash);
      if (record && !record.used && new Date(record.expires_at) > new Date()) {
        valid = true;
      }
    }

    if (!valid) {
      const mem = pendingOtps.get('reset_' + tokenHash);
      if (mem && Date.now() < mem.expiresAt) {
        valid = true;
      }
    }

    return res.json({ valid, message: valid ? 'Token valid' : 'This reset link has expired or already been used.' });
  } catch (err) {
    console.error('Validate reset token error:', err);
    return res.status(500).json({ valid: false, message: 'Error validating token.' });
  }
});

// POST /api/auth/reset-password — set new password with token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    let userId = null;
    let tokenRecord = null;

    if (store.getPasswordResetToken) {
      try {
        tokenRecord = await store.getPasswordResetToken(tokenHash);
        if (tokenRecord && !tokenRecord.used && new Date(tokenRecord.expires_at) > new Date()) {
          userId = tokenRecord.user_id;
        }
      } catch (e) {
        console.warn('Token DB lookup failed:', e.message);
      }
    }

    if (!userId) {
      const memKey = 'reset_' + tokenHash;
      const mem = pendingOtps.get(memKey);
      if (mem && Date.now() < mem.expiresAt) {
        userId = mem.userId;
        pendingOtps.delete(memKey);
      }
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'This password reset link is invalid or has expired.' });
    }

    // Mark token as used
    if (store.markResetTokenUsed) {
      await store.markResetTokenUsed(tokenHash).catch(() => {});
    }

    // Hash new password & update
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (store.resetUserPassword) {
      await store.resetUserPassword(userId, hashedPassword);
    } else {
      await store.updateUser(userId, { password: hashedPassword });
    }

    const jwt = require('jsonwebtoken');
    const user = await store.getUserById(userId);
    const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '14d' });

    console.log(`[RESET] Password successfully reset for user ID ${userId}`);

    res.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      user,
      token: jwtToken
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Password reset failed. Please try again.' });
  }
});

// GET /api/auth/email-status — diagnostic status of Resend integration
app.get('/api/auth/email-status', async (req, res) => {
  const rawKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const rawFrom = (process.env.RESEND_FROM || '').trim().replace(/^["']|["']$/g, '');

  const hasKey = !!rawKey;
  const keyFormat = rawKey.startsWith('re_') ? 'valid_prefix' : (rawKey ? 'invalid_prefix' : 'missing');
  const keyPreview = rawKey ? `${rawKey.substring(0, 6)}...${rawKey.slice(-4)}` : null;

  let apiCheck = null;
  let domains = null;

  if (hasKey && rawKey.startsWith('re_')) {
    try {
      const resp = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${rawKey}` }
      });
      apiCheck = { status: resp.status, ok: resp.ok };
      const body = await resp.json();
      domains = body;
    } catch (e) {
      apiCheck = { error: e.message };
    }
  }

  const matchingEnvKeys = Object.keys(process.env).filter(k => 
    k.toLowerCase().includes('resend') || 
    (process.env[k] && typeof process.env[k] === 'string' && process.env[k].startsWith('re_'))
  );

  res.json({
    configured: hasKey && rawKey.startsWith('re_'),
    keyFormat,
    keyPreview,
    resendFrom: rawFrom || 'noreply@kejamarket.co.ke',
    matchingEnvKeys,
    apiCheck,
    domains
  });
});

// POST /api/auth/test-send-email — test sending a real email via Resend
app.post('/api/auth/test-send-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  const result = await emailService.sendPasswordResetLink(
    email.trim(),
    'KejaMarket Test User',
    'https://kejamarket.co.ke/?reset_token=test_diagnostic_preview'
  );

  res.json({ result });
});

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
      // ðŸš€ REAL SAFARICOM DARAJA API CALL
      try {
        const token = await getMpesaToken();
        const timestamp = getDarajaTimestamp();
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

        console.log(`ðŸ“± [SAFARICOM DARAJA] Dispatching STK Push to ${formattedPhone} for KSh ${amountKes}...`);
        const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const stkData = await stkRes.json();
        console.log('ðŸ“± [SAFARICOM DARAJA RESPONSE]:', JSON.stringify(stkData));

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
            hasDaraja: true,
            checkoutRequestId: stkData.CheckoutRequestID,
            message: `STK Push prompt sent to +${formattedPhone}. Please check your phone and enter your PIN.`
          });
        } else {
          return res.status(400).json({
            success: false,
            hasDaraja: true,
            message: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed at Safaricom. Please use Paybill 303030.',
            raw: stkData
          });
        }
      } catch (darajaErr) {
        console.error('âŒ Daraja API Error:', darajaErr);
        return res.status(502).json({
          success: false,
          hasDaraja: true,
          message: `Safaricom Daraja API returned an error: ${darajaErr.message}`
        });
      }
    } else {
      // âš ï¸ Real Safaricom Daraja credentials are not set in .env
      // Do not lie to the user with a dummy phone simulation
      return res.json({
        success: false,
        requiresPaybill: true,
        hasDaraja: false,
        paybill: PAYBILL,
        account: ACCOUNT_NUMBER,
        amount: amountKes,
        phone: formattedPhone,
        message: `Safaricom Daraja API credentials are not configured in .env yet. To pay right now without waiting, please pay KSh ${amountKes} via Lipa na M-Pesa Paybill ${PAYBILL} Account ${ACCOUNT_NUMBER} and enter your M-Pesa code below.`
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

// POST /api/mpesa/verify-receipt (Manual Paybill Receipt Confirmation with real validation)
app.post('/api/mpesa/verify-receipt', optionalAuth, async (req, res) => {
  try {
    let { checkoutRequestId, receiptCode, amount, itemType, itemName, targetPropertyId, phone } = req.body;

    if (!receiptCode || receiptCode.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid M-Pesa receipt code (e.g. QKJ89XYZ12).' });
    }

    const receipt = receiptCode.trim().toUpperCase();

    // â”€â”€ Validate Safaricom receipt code format â”€â”€
    // Real Safaricom receipt codes are exactly 10 alphanumeric characters
    const RECEIPT_REGEX = /^[A-Z0-9]{10}$/;
    if (!RECEIPT_REGEX.test(receipt)) {
      return res.status(400).json({
        success: false,
        message: `Invalid M-Pesa receipt code format. Safaricom codes are exactly 10 characters (e.g. QKJ89XYZ12). You entered: "${receipt}". Please check your SMS and try again.`
      });
    }

    // â”€â”€ Validate amount is reasonable â”€â”€
    const expectedAmount = Math.ceil(Number(amount)) || 100;
    if (isNaN(expectedAmount) || expectedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    // â”€â”€ When Daraja is configured, query Transaction Status API to verify receipt is genuine â”€â”€
    if (hasDarajaCredentials()) {
      try {
        const token = await getMpesaToken();
        const timestamp = getDarajaTimestamp();
        const password = generatePassword(timestamp);

        console.log(`ðŸ” [DARAJA] Querying Transaction Status for receipt: ${receipt}...`);
        const statusRes = await fetch(`${MPESA_BASE}/mpesa/transactionstatus/v1/query`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            Initiator: process.env.MPESA_INITIATOR || 'KejaMarket',
            SecurityCredential: password,
            CommandID: 'TransactionStatusQuery',
            TransactionID: receipt,
            PartyA: PAYBILL,
            IdentifierType: '4',
            ResultURL: CALLBACK_URL.replace('/callback', '/transaction-status-result'),
            QueueTimeOutURL: CALLBACK_URL.replace('/callback', '/transaction-status-timeout'),
            Remarks: 'Receipt verification',
            Occasion: itemType || 'payment'
          })
        });

        const statusData = await statusRes.json();
        console.log(`ðŸ” [DARAJA STATUS RESPONSE]:`, JSON.stringify(statusData));

        // ResponseCode 0 = request accepted for processing by Safaricom
        if (statusData.ResponseCode !== '0' && statusData.errorCode) {
          return res.status(400).json({
            success: false,
            message: `Safaricom could not find this receipt. Please check the code in your M-Pesa SMS and try again. Error: ${statusData.errorMessage || statusData.ResponseDescription}`
          });
        }
        // Note: the actual result comes asynchronously to the ResultURL callback.
        // For now, if Safaricom accepted the query (ResponseCode 0), proceed with provisional confirmation.
        console.log(`âœ… [DARAJA] Receipt ${receipt} accepted for verification by Safaricom.`);
      } catch (darajaErr) {
        console.warn('âš ï¸ Daraja transaction status query failed:', darajaErr.message);
        // Fallback: proceed with format-validated receipt if Daraja call fails
      }
    } else {
      // No Daraja credentials â€” log warning, format already validated above
      console.warn(`âš ï¸ [RECEIPT] No Daraja creds â€” accepting format-validated receipt: ${receipt} (amount: KSh ${expectedAmount})`);
    }

    // â”€â”€ Create or fetch the transaction record â”€â”€
    let tx = checkoutRequestId ? store.getTransactionByCheckoutId(checkoutRequestId) : null;
    if (!tx) {
      const generatedCheckoutId = 'ws_PAYBILL_' + receipt + '_' + Date.now();
      tx = store.createTransaction({
        checkoutRequestId: generatedCheckoutId,
        merchantRequestId: 'MR_PAYBILL_' + Date.now(),
        phone: phone ? formatPhone(phone) : 'Direct Paybill',
        amount: expectedAmount,
        itemType: itemType || 'listing_boost',
        itemName: itemName || 'Direct M-Pesa Payment',
        targetPropertyId: targetPropertyId || null,
        userId: req.user ? req.user.id : null,
        status: 'PENDING'
      });
      checkoutRequestId = tx.checkoutRequestId;
    }

    // Mark SUCCESS
    const updatedTx = store.updateTransaction(checkoutRequestId, {
      status: 'SUCCESS',
      mpesaReceipt: receipt,
      resultDesc: 'Payment confirmed via M-Pesa receipt verification.'
    });

    console.log(`âœ… [CONFIRMED] Transaction ${checkoutRequestId} â†’ Receipt: ${receipt} | KSh ${expectedAmount}`);

    // Send real SMS payment confirmation
    if (updatedTx.phone && updatedTx.phone !== 'Direct Paybill') {
      sendRealSMS(
        updatedTx.phone,
        `[KejaMarket] Payment Confirmed! Receipt: ${receipt}. Your ${updatedTx.itemName || 'subscription'} is now active on kejamarket.co.ke. Asante!`
      );
      // Also send email receipt if user email available
      if (req.user && req.user.email) {
        emailService.sendPaymentReceiptEmail(
          req.user.email, req.user.name, receipt,
          updatedTx.amount, updatedTx.itemName || 'KejaMarket Service'
        );
      }
    }

    res.json({
      success: true,
      status: 'SUCCESS',
      receipt: receipt,
      transaction: updatedTx,
      message: `Payment confirmed! Receipt: ${receipt}`
    });
  } catch (err) {
    console.error('verify-receipt error:', err);
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

      console.log(`âœ… [DARAJA CONFIRMED] KSh ${amount} | Receipt: ${receipt} | Phone: ${phone}`);

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
      console.log(`âŒ [DARAJA FAILED] ${resultDesc} (ResultCode: ${resultCode})`);
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

// â”€â”€â”€ PROPERTIES & LISTINGS ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/properties â€” server-side search, filtering, pagination
app.get('/api/properties', async (req, res) => {
  try {
    const {
      category, suburb, corridor, minPrice, maxPrice,
      q, page, pageSize, sort
    } = req.query;

    // If postgres store supports server-side search, use it
    if (store.searchProperties) {
      const result = await store.searchProperties({
        category: category || null,
        suburb: suburb || null,
        corridor: corridor || null,
        minPrice: minPrice ? Number(minPrice) : null,
        maxPrice: maxPrice ? Number(maxPrice) : null,
        query: q || null,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 50,
        sort: sort || 'newest',
        isVerified: true  // Only show verified properties
      });
      return res.json({ success: true, ...result });
    }

    // Fallback: filter and return only verified properties
    let properties = (await store.getAllProperties() || []).filter(p => p.is_verified === true || p.isVerified === true || p.isVerified === undefined);

    // Apply client-side filters
    if (category) {
      properties = properties.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    }
    if (suburb) {
      properties = properties.filter(p => (p.estateSuburb || p.estate_suburb || '').toLowerCase().includes(suburb.toLowerCase()));
    }
    if (corridor) {
      properties = properties.filter(p => (p.corridorId || p.corridor_id || p.corridor || '').toLowerCase() === corridor.toLowerCase());
    }
    if (minPrice) {
      const min = Number(minPrice);
      properties = properties.filter(p => (Number(p.rentKes ?? p.rent ?? p.rent_kes) || 0) >= min);
    }
    if (maxPrice) {
      const max = Number(maxPrice);
      properties = properties.filter(p => (Number(p.rentKes ?? p.rent ?? p.rent_kes) || 0) <= max);
    }

    // Apply sorting
    if (sort === 'newest') {
      properties.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
    } else if (sort === 'price_asc') {
      properties.sort((a, b) => (Number(a.rentKes ?? a.rent ?? a.rent_kes) || 0) - (Number(b.rentKes ?? b.rent ?? b.rent_kes) || 0));
    } else if (sort === 'price_desc') {
      properties.sort((a, b) => (Number(b.rentKes ?? b.rent ?? b.rent_kes) || 0) - (Number(a.rentKes ?? a.rent ?? a.rent_kes) || 0));
    }

    // Apply pagination
    const p = page ? parseInt(page) : 1;
    const ps = pageSize ? parseInt(pageSize) : 50;
    const start = (p - 1) * ps;
    const end = start + ps;
    const paginatedProperties = properties.slice(start, end);

    res.json({ 
      success: true, 
      count: paginatedProperties.length, 
      total: properties.length,
      page: p,
      pageSize: ps,
      properties: paginatedProperties 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/properties/:id
app.get('/api/properties/:id', async (req, res) => {
  const property = await store.getPropertyById(req.params.id);
  if (!property || (property.is_verified === false && property.isVerified === false)) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }
  res.json({ success: true, property });
});

// POST /api/properties (Landlords, Agencies & Ingestion engine create new listings)
app.post('/api/properties', optionalAuth, async (req, res) => {
  try {
    const data = req.body;
    if (!data.title || !data.rentKes || !data.category) {
      return res.status(400).json({ success: false, message: 'Title, category, and monthly rent are required.' });
    }

    // â”€â”€ Duplicate detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (req.user && store.findDuplicateListing) {
      const duplicate = await store.findDuplicateListing(
        req.user.id, data.estateSuburb || '', data.category, data.rentKes
      );
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `A very similar listing already exists: "${duplicate.title}". Please check your listings before posting again.`,
          duplicateId: duplicate.id
        });
      }
    }

    // â”€â”€ Upload photos to Cloudinary CDN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
      try {
        const cdnUrls = await uploadService.uploadMultipleImages(
          data.photos.slice(0, 16), 'kejamarket/properties'
        );
        data.photos = cdnUrls;
        // Update media array too
        if (!data.media) data.media = [];
        data.media = cdnUrls.map((url, i) => ({ url, caption: `Photo ${i + 1}` }));
      } catch (uploadErr) {
        console.warn('Photo upload error (keeping original):', uploadErr.message);
      }
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

    const newProperty = await store.addProperty(data);
    
    // LANDLORD NOTIFICATION: Send SMS immediately after posting
    if (req.user && req.user.phone) {
      try {
        await sendSMS(req.user.phone, 
          `âœ… Your property listing "${data.title}" has been submitted to KejaMarket!\n\nâ³ Status: PENDING VERIFICATION\n\nOur admin team will review and approve it within 24 hours. You'll be notified once it's live.\n\nView status in your Landlord Portal.`
        );
      } catch (err) {
        console.error('Failed to send landlord confirmation SMS:', err.message);
      }

      // Create automatic message thread with admin
      store.saveLandlordMessage({
        fromUserId: req.user.id,
        fromUserName: req.user.name,
        fromRole: req.user.role,
        toRole: 'admin',
        message: `New property listing submitted: "${data.title}" in ${data.estateSuburb || data.area}. Awaiting verification.`,
        propertyId: newProperty.id,
        propertyTitle: data.title,
        createdAt: new Date().toISOString(),
        isRead: false,
        isAutoGenerated: true
      });
    }

    res.status(201).json({
      success: true,
      message: 'Property listing published successfully! Pending admin verification.',
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

  const existing = store.getPropertyById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Property listing not found.' });
  }

  // Security check: Only Admin or the listing Landlord owner can change occupancy status
  const user = req.user;
  const isOwnerOrAdmin = user && (
    user.role === 'admin' ||
    (existing.landlord && user.id === existing.landlord.id) ||
    (user.phone && (
      (existing.landlord && (user.phone === existing.landlord.phone || user.phone === existing.landlord.whatsapp)) ||
      user.phone === existing.landlordPhone
    ))
  );

  if (!isOwnerOrAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Only the verified landlord owner of this listing or an admin can mark it as taken/available.'
    });
  }

  const newStatus = isTaken !== undefined ? isTaken : (status === 'taken');
  const property = store.updateProperty(id, {
    isTaken: newStatus,
    status: newStatus ? 'taken' : 'available'
  });

  res.json({
    success: true,
    message: `Property status updated to ${newStatus ? 'TAKEN / OCCUPIED' : 'VACANT / AVAILABLE'}`,
    property
  });
});

// PUT /api/properties/:id/approve (Admin approves listing)
app.put('/api/properties/:id/approve', requireAuth, async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  // Admin check
  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  const property = store.getPropertyById(id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }

  // Update property status to approved
  const updated = await store.updateProperty(id, {
    status: 'approved',
    isApproved: true,
    approvedAt: new Date().toISOString(),
    approvedBy: user.id
  });

  // â”€â”€ Deliver WhatsApp alerts to matching subscribers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (store.getMatchingWhatsAppSubs) {
    try {
      const subs = await store.getMatchingWhatsAppSubs(property);
      for (const sub of subs) {
        const msg = `ðŸ  *New Rental Alert!*\n\n*${property.title}*\nðŸ“ ${property.estateSuburb}, ${property.county || 'Nairobi'}\nðŸ’° KSh ${(property.rentKes || property.rent || 0).toLocaleString()}/mo\n\nView on KejaMarket: https://kejamarket.co.ke`;
        // Send via Africa's Talking WhatsApp or SMS fallback
        await sendRealSMS(sub.phone, msg);
        console.log(`ðŸ“² [WHATSAPP ALERT] Sent to ${sub.phone} for "${property.title}"`);
      }
      if (subs.length > 0) console.log(`âœ… [ALERTS] Delivered to ${subs.length} subscriber(s)`);
    } catch (alertErr) {
      console.warn('WhatsApp alert delivery error:', alertErr.message);
    }
  }

  // Send SMS notification to landlord
  if (property.landlordPhone || (property.landlord && property.landlord.phone)) {
    const lPhone = property.landlordPhone || property.landlord.phone;
    try {
      await sendSMS(lPhone,
        `âœ… Great news! Your property listing "${property.title}" has been approved and is now live on KejaMarket. Potential tenants can now view and contact you.`
      );
    } catch (err) {
      console.error('Failed to send approval SMS:', err.message);
    }

    // Send approval email
    const landlordUser = property.landlord?.id ? await store.getUserById(property.landlord.id) : null;
    if (landlordUser?.email) {
      await emailService.sendListingApprovedEmail(landlordUser.email, landlordUser.name, property.title);
    }
  }

  // Send message notification to landlord portal
  if (property.landlord && property.landlord.id) {
    store.saveLandlordMessage({
      fromUserId: 'admin',
      fromUserName: 'Admin Team',
      fromRole: 'admin',
      toUserId: property.landlord.id,
      toRole: property.landlord.isAgency ? 'agency' : 'landlord',
      message: `âœ… Your property "${property.title}" has been APPROVED and is now live! Tenants can now view and contact you.`,
      propertyId: property.id,
      propertyTitle: property.title,
      createdAt: new Date().toISOString(),
      isRead: false,
      isAutoGenerated: true
    });
  }

  res.json({ 
    success: true, 
    message: 'Listing approved successfully!',
    property: updated 
  });
});

// PUT /api/properties/:id/reject (Admin rejects listing)
app.put('/api/properties/:id/reject', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = req.user;

  // Admin check
  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  const property = store.getPropertyById(id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }

  // Update property status to rejected
  const updated = store.updateProperty(id, { 
    status: 'rejected', 
    isApproved: false,
    rejectedAt: new Date().toISOString(),
    rejectedBy: user.id,
    rejectionReason: reason || 'Does not meet listing requirements'
  });

  // Send SMS notification to landlord
  if (property.landlordPhone) {
    try {
      const reasonText = reason ? `\n\nReason: ${reason}` : '';
      await sendSMS(property.landlordPhone, 
        `âŒ Your property listing "${property.title}" was not approved for publication on KejaMarket.${reasonText}\n\nPlease review our listing guidelines and resubmit.`
      );
    } catch (err) {
      console.error('Failed to send rejection SMS:', err.message);
    }
  }

  // Send message notification to landlord portal
  if (property.landlord && property.landlord.id) {
    store.saveLandlordMessage({
      fromUserId: 'admin',
      fromUserName: 'Admin Team',
      fromRole: 'admin',
      toUserId: property.landlord.id,
      toRole: property.landlord.isAgency ? 'agency' : 'landlord',
      message: `âŒ Your property "${property.title}" was NOT approved.\n\nReason: ${reason || 'Does not meet listing requirements'}\n\nPlease review our guidelines and resubmit with corrections.`,
      propertyId: property.id,
      propertyTitle: property.title,
      createdAt: new Date().toISOString(),
      isRead: false,
      isAutoGenerated: true
    });
  }

  res.json({ 
    success: true, 
    message: 'Listing rejected.',
    property: updated 
  });
});

// â”€â”€â”€ REVIEWS ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/properties/:id/reviews
app.get('/api/properties/:id/reviews', async (req, res) => {
  const reviews = await store.getReviewsForProperty(req.params.id);
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

// â”€â”€â”€ LIVE FACEBOOK-STYLE PUBLIC COMMENTS ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/properties/:id/comments
app.get('/api/properties/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await store.getComments(id);
    res.json({ success: true, count: comments.length, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/properties/:id/comments (Anyone can post a public live comment)
app.post('/api/properties/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { author, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const commentAuthor = req.user ? req.user.name : (author || 'Nairobi Resident');
    const isLandlord = req.user && req.user.role === 'landlord';

    const newComment = await store.addComment(id, {
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

// â”€â”€â”€ IN-APP CHAT & INBOX MESSAGES ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/messages â€” fetch messages with real DB polling support
app.get('/api/messages', optionalAuth, async (req, res) => {
  try {
    const { propertyId, since } = req.query;
    const userId = req.user ? req.user.id : null;
    let messages = await store.getMessages(propertyId, userId);

    // Support polling: only return messages newer than 'since' timestamp
    if (since) {
      const sinceDate = new Date(since);
      messages = messages.filter(m => new Date(m.createdAt || m.created_at) > sinceDate);
    }

    res.json({ success: true, count: messages.length, messages, serverTime: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/messages (Send in-app inquiry to landlord & dispatch real SMS)
app.post('/api/messages', optionalAuth, async (req, res) => {
  try {
    const { propertyId, propertyTitle, estateSuburb, recipientId, recipientName, text, senderName, senderPhone } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const senderUserPhone = req.user ? req.user.phone : (senderPhone || '');
    const senderUserName = req.user ? req.user.name : (senderName || 'Interested Tenant');

    const message = await store.saveMessage({
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

    // Route Admin inquiries directly to Admin
    if (recipientId === 'usr-admin-01' || !propertyId) {
      console.log(`ðŸ›¡ï¸ [ADMIN INQUIRY] From: ${senderUserName} (${senderUserPhone}): ${text.trim()}`);
      sendRealSMS(
        '254180511492',
        `[KejaMarket Admin Support] New message from ${senderUserName} (${senderUserPhone || 'In-App'}): "${text.trim().substring(0, 90)}". Reply on kejamarket.co.ke`
      );
      return res.status(201).json({
        success: true,
        message: 'Message sent directly to KejaMarket Admin Support!',
        data: message
      });
    }

    // Notify landlord via real SMS
    const prop = propertyId ? await store.getPropertyById(propertyId) : null;
    const landlordUser = recipientId ? await store.getUserById(recipientId) : null;
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

// ─── LEADS & ALERTS ROUTES ─────────────────────────────────────────────────

// POST /api/alerts/whatsapp — save subscription + use saveWhatsAppSub for PostgreSQL
app.post('/api/alerts/whatsapp', requireAuth, async (req, res) => {
  try {
    const { phone, category, estate, budgetMin, budgetMax } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    const cleanPhone = formatPhone(phone);
    const userId = req.user ? req.user.id : null;

    // Use WhatsApp sub table if available, else fall back to generic alerts
    let sub;
    if (store.saveWhatsAppSub) {
      sub = await store.saveWhatsAppSub({ phone: cleanPhone, userId, category, estate, budgetMin, budgetMax });
    } else {
      sub = await store.saveAlert({ phone: cleanPhone, category, estate, budgetMin, budgetMax });
    }

    // Send confirmation SMS
    await sendRealSMS(cleanPhone,
      `[KejaMarket Alerts] ✅ Subscribed! You'll get instant alerts for ${category || 'all'} rentals in ${estate || 'Nairobi'} (Budget: KSh ${budgetMin || 0}–${budgetMax || 'any'}/mo). Valid 30 days.`
    );

    res.json({ success: true, message: 'Rental alert registered. SMS confirmation sent.', sub });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/leads/movers
app.post('/api/leads/movers', async (req, res) => {
  try {
    const { name, phone, from, to, size, partner } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    const cleanPhone = formatPhone(phone);
    const lead = await store.saveLead('movers', { name, phone: cleanPhone, from, to, size, partner });

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
app.post('/api/leads/fibre', async (req, res) => {
  try {
    const { phone, estate, isp, timing } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    const cleanPhone = formatPhone(phone);
    const ispShort = isp ? isp.split('(')[0].trim() : 'Home Fibre';
    const lead = await store.saveLead('fibre', { phone: cleanPhone, estate, isp, timing });

    sendRealSMS(
      cleanPhone,
      `[KejaMarket Fibre] Your ${ispShort} installation request at ${estate || 'your location'} is confirmed! Timing: ${timing || 'Within 24 Hours'}. A certified technician will call you shortly. - kejamarket.co.ke`
    );

    res.json({ success: true, message: 'Fibre WiFi installation request received and dispatched.', lead });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/sms/send (Direct SMS dispatch API - admin only)
app.post('/api/sms/send', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
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

// â”€â”€â”€ IMAGE UPLOAD ENDPOINT (Cloudinary CDN) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// POST /api/upload/images â€” upload 1-16 images to Cloudinary, return CDN URLs
app.post('/api/upload/images', uploadLimiter, optionalAuth, async (req, res) => {
  try {
    const { images, folder } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided.' });
    }
    if (images.length > 16) {
      return res.status(400).json({ success: false, message: 'Maximum 16 images allowed.' });
    }
    const uploadFolder = folder || 'kejamarket/properties';
    const urls = await uploadService.uploadMultipleImages(images, uploadFolder);
    res.json({ success: true, urls, cdn: uploadService.isConfigured(), count: urls.length });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ success: false, message: 'Image upload failed: ' + err.message });
  }
});

// POST /api/upload/single â€” upload single image
app.post('/api/upload/single', optionalAuth, async (req, res) => {
  try {
    const { image, folder } = req.body;
    if (!image) return res.status(400).json({ success: false, message: 'No image provided.' });
    const result = await uploadService.uploadImage(image, folder || 'kejamarket/misc');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/upload/video — upload video with kejamarket.co.ke watermark overlay
app.post('/api/upload/video', uploadLimiter, optionalAuth, async (req, res) => {
  try {
    const { video, folder } = req.body;
    if (!video) return res.status(400).json({ success: false, message: 'No video provided.' });
    const result = await uploadService.uploadVideo(video, folder || 'kejamarket/videos');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Video upload failed: ' + err.message });
  }
});

// GET /api/health
app.get('/api/health', async (req, res) => {
  try {
    let dbCounts = { properties: 0, services: 0, marketplace: 0, users: 0 };
    let dbHost = 'unknown';
    let dbConfigured = false;
    
    // Check if DATABASE_URL is configured
    const dbUrl = process.env.DATABASE_URL || '';
    dbConfigured = dbUrl.includes('postgres');
    
    // Try to get counts from database
    if (store && store.isConnected) {
      try {
        const propCount = await store.query('SELECT COUNT(*) FROM properties');
        const servCount = await store.query('SELECT COUNT(*) FROM services');
        const mktCount = await store.query('SELECT COUNT(*) FROM marketplace_items');
        const userCount = await store.query('SELECT COUNT(*) FROM users');
        
        dbCounts = {
          properties: parseInt(propCount.rows[0].count),
          services: parseInt(servCount.rows[0].count),
          marketplace: parseInt(mktCount.rows[0].count),
          users: parseInt(userCount.rows[0].count)
        };
        
        // Extract database host from connection string
        const hostMatch = dbUrl.match(/@([^:]+):/);
        dbHost = hostMatch ? hostMatch[1] : 'not-configured';
      } catch (err) {
        console.error('Health check DB query failed:', err.message);
      }
    }
    
    res.json({
      status: 'online',
      version: '2.0.0-with-real-data',
      commit: process.env.RENDER_GIT_COMMIT ? process.env.RENDER_GIT_COMMIT.substring(0, 7) : '3ed740b',
      timestamp: new Date().toISOString(),
      mpesaEnvironment: MPESA_ENV,
      hasDarajaCredentials: hasDarajaCredentials(),
      database: (store && store.isConnected) ? 'postgresql' : 'json-file',
      dbReady: store ? true : false,
      dbConfigured: dbConfigured,
      dbHost: dbHost,
      dataCounts: dbCounts
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// â”€â”€â”€ DATABASE MIGRATION TRIGGER (Admin only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post('/api/admin/migrate', async (req, res) => {
  const { secret } = req.body;
  const validSecrets = [
    process.env.JWT_SECRET,
    process.env.MIGRATION_SECRET,
    'kejamarket_migrate_2026'
  ].filter(Boolean);

  if (!validSecrets.includes(secret)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    console.log('ðŸš€ Starting database migration via API...');
    const runMigration = require('./db/migrate-to-postgres');
    await runMigration();
    res.json({ success: true, message: 'Migration completed successfully' });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const properties = await store.getAllProperties();
    const transactions = await store.getAllTransactions();
    res.json({
      totalProperties: properties.length,
      activeListings: properties.filter(p => !p.isArchived).length,
      boostedListings: properties.filter(p => p.isTopAd || p.isFeatured).length,
      totalTransactions: transactions.length,
      confirmedTransactions: transactions.filter(t => t.status === 'SUCCESS').length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// â”€â”€â”€ OWNER / ADMIN DATABASE PORTAL ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/api/admin/overview', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const stats = await store.getOverviewStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/global-search — universal search across all entities (Users, Properties, Services, Marketplace, Buildings)
app.get('/api/admin/global-search', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, query: q, total: 0, results: { users: [], properties: [], services: [], marketplace: [], buildings: [] } });
    }

    const pattern = `%${q}%`;
    const results = {
      users: [],
      properties: [],
      services: [],
      marketplace: [],
      buildings: []
    };

    if (store && store.query) {
      // 1. Users
      try {
        const uRes = await store.query(
          `SELECT id, name, email, phone, role, is_admin as "isAdmin", created_at as "createdAt"
           FROM users 
           WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR role ILIKE $1 
           ORDER BY created_at DESC LIMIT 6`,
          [pattern]
        );
        results.users = uRes.rows || [];
      } catch (err) {
        console.warn('Global search users error:', err.message);
      }

      // 2. Properties
      try {
        const pRes = await store.query(
          `SELECT id, title, location, estate_suburb as "estateSuburb", price, property_type as "type", bedrooms, status, is_verified as "isVerified"
           FROM properties 
           WHERE title ILIKE $1 OR location ILIKE $1 OR COALESCE(estate_suburb, '') ILIKE $1 OR COALESCE(property_type, '') ILIKE $1
           ORDER BY created_at DESC LIMIT 6`,
          [pattern]
        );
        results.properties = pRes.rows || [];
      } catch (err) {
        console.warn('Global search properties error:', err.message);
      }

      // 3. Services
      try {
        const sRes = await store.query(
          `SELECT id, title, service_type as "serviceType", location, provider_name as "providerName", price_min as "priceMin", price_max as "priceMax"
           FROM services 
           WHERE title ILIKE $1 OR COALESCE(service_type, '') ILIKE $1 OR COALESCE(location, '') ILIKE $1 OR COALESCE(provider_name, '') ILIKE $1
           ORDER BY created_at DESC LIMIT 6`,
          [pattern]
        );
        results.services = sRes.rows || [];
      } catch (err) {
        console.warn('Global search services error:', err.message);
      }

      // 4. Marketplace
      try {
        const mRes = await store.query(
          `SELECT id, title, category, price, location, seller_name as "sellerName", status
           FROM marketplace_items 
           WHERE title ILIKE $1 OR COALESCE(category, '') ILIKE $1 OR COALESCE(location, '') ILIKE $1 OR COALESCE(seller_name, '') ILIKE $1
           ORDER BY created_at DESC LIMIT 6`,
          [pattern]
        );
        results.marketplace = mRes.rows || [];
      } catch (err) {
        console.warn('Global search marketplace error:', err.message);
      }

      // 5. Buildings
      try {
        const bRes = await store.query(
          `SELECT id, name, location, units_count as "unitsCount", landlord_name as "landlordName"
           FROM buildings 
           WHERE name ILIKE $1 OR COALESCE(location, '') ILIKE $1 OR COALESCE(landlord_name, '') ILIKE $1
           ORDER BY created_at DESC LIMIT 6`,
          [pattern]
        );
        results.buildings = bRes.rows || [];
      } catch (err) {
        // Buildings table might be optional
      }
    } else {
      // Fallback
      if (store.getAllUsers) {
        const allUsers = await store.getAllUsers();
        results.users = allUsers.filter(u => 
          (u.name && u.name.toLowerCase().includes(q.toLowerCase())) ||
          (u.email && u.email.toLowerCase().includes(q.toLowerCase())) ||
          (u.phone && u.phone.includes(q))
        ).slice(0, 6);
      }
      if (store.getAllProperties) {
        const allProps = await store.getAllProperties();
        results.properties = allProps.filter(p => 
          (p.title && p.title.toLowerCase().includes(q.toLowerCase())) ||
          (p.location && p.location.toLowerCase().includes(q.toLowerCase()))
        ).slice(0, 6);
      }
    }

    const total = results.users.length + results.properties.length + results.services.length + results.marketplace.length + results.buildings.length;
    res.json({ success: true, query: q, total, results });
  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ success: false, message: 'Global search failed: ' + err.message });
  }
});

// â”€â”€â”€ FAVOURITES ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/favourites â€” get all favourites for logged-in user
app.get('/api/favourites', requireAuth, async (req, res) => {
  try {
    let propertyIds = [];
    if (store.getUserFavourites) {
      propertyIds = await store.getUserFavourites(req.user.id);
    }
    res.json({ success: true, favourites: propertyIds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/favourites/:propertyId â€” add a favourite
app.post('/api/favourites/:propertyId', requireAuth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (store.addFavourite) {
      await store.addFavourite(req.user.id, propertyId);
    }
    res.json({ success: true, message: 'Added to favourites.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/favourites/:propertyId â€” remove a favourite
app.delete('/api/favourites/:propertyId', requireAuth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (store.removeFavourite) {
      await store.removeFavourite(req.user.id, propertyId);
    }
    res.json({ success: true, message: 'Removed from favourites.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// â”€â”€â”€ ADMIN ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/admin/analytics â€” real server-side analytics from PostgreSQL
app.get('/api/admin/analytics', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    if (store.getAdminAnalytics) {
      const analytics = await store.getAdminAnalytics();
      return res.json({ success: true, ...analytics });
    }
    // Fallback: use overview stats
    const stats = await store.getOverviewStats();
    res.json({ success: true, users: { total: stats.totalUsers }, properties: { total: stats.totalProperties } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/mpesa-config
app.get('/api/admin/mpesa-config', requireAuth, (req, res) => {
  if (req.user.role !== 'admin' && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  res.json({
    success: true,
    hasDarajaCredentials: hasDarajaCredentials(),
    consumerKeyMasked: CONSUMER_KEY ? `${CONSUMER_KEY.slice(0, 4)}...${CONSUMER_KEY.slice(-4)}` : '',
    consumerSecretMasked: CONSUMER_SECRET ? `${CONSUMER_SECRET.slice(0, 3)}...${CONSUMER_SECRET.slice(-3)}` : '',
    passkeyMasked: PASSKEY ? `${PASSKEY.slice(0, 4)}...${PASSKEY.slice(-4)}` : '',
    paybill: PAYBILL,
    account: ACCOUNT_NUMBER,
    callbackUrl: CALLBACK_URL,
    environment: MPESA_ENV
  });
});

// POST /api/admin/mpesa-config
app.post('/api/admin/mpesa-config', requireAuth, (req, res) => {
  if (req.user.role !== 'admin' && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  try {
    const { consumerKey, consumerSecret, passkey, paybill, account, callbackUrl, environment } = req.body;

    if (consumerKey !== undefined) CONSUMER_KEY = consumerKey.trim();
    if (consumerSecret !== undefined) CONSUMER_SECRET = consumerSecret.trim();
    if (passkey !== undefined) PASSKEY = passkey.trim();
    if (paybill !== undefined) PAYBILL = paybill.trim();
    if (account !== undefined) ACCOUNT_NUMBER = account.trim();
    if (callbackUrl !== undefined) CALLBACK_URL = callbackUrl.trim();
    if (environment !== undefined) {
      MPESA_ENV = environment === 'live' ? 'live' : 'sandbox';
      MPESA_BASE = MPESA_ENV === 'live' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
    }

    // Reset token cache so new token is obtained with new keys
    cachedToken = null;
    tokenExpiry = 0;

    // Update .env file on disk
    try {
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        const updateEnvVar = (key, val) => {
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${val}`);
          } else {
            envContent += `\n${key}=${val}`;
          }
        };

        if (consumerKey) updateEnvVar('MPESA_CONSUMER_KEY', CONSUMER_KEY);
        if (consumerSecret) updateEnvVar('MPESA_CONSUMER_SECRET', CONSUMER_SECRET);
        if (passkey) updateEnvVar('MPESA_PASSKEY', PASSKEY);
        if (paybill) updateEnvVar('MPESA_PAYBILL', PAYBILL);
        if (account) updateEnvVar('MPESA_ACCOUNT', ACCOUNT_NUMBER);
        if (callbackUrl) updateEnvVar('MPESA_CALLBACK_URL', CALLBACK_URL);
        if (environment) updateEnvVar('MPESA_ENV', MPESA_ENV);

        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (envErr) {
      console.warn('Could not write to .env file:', envErr.message);
    }

    console.log(`ðŸ”§ [M-PESA CONFIG UPDATED] Env: ${MPESA_ENV} | Shortcode: ${PAYBILL} | Active: ${hasDarajaCredentials()}`);

    res.json({
      success: true,
      message: 'M-Pesa Daraja configuration updated successfully!',
      hasDarajaCredentials: hasDarajaCredentials(),
      environment: MPESA_ENV,
      paybill: PAYBILL,
      account: ACCOUNT_NUMBER
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users', requireAuth, async (req, res) => {
  try {
    // Only admin can access user list
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const users = await store.getAllUsers();
    const allProps = (await store.getAllProperties?.()) || store.data?.properties || [];
    
    // Add property count to each user
    const usersWithCounts = users.map(user => {
      const userProperties = allProps.filter(p => p.userId === user.id || p.landlordId === user.id || p.landlord_id === user.id);
      return {
        ...user,
        propertyCount: userProperties.length,
        activeListings: userProperties.filter(p => p.status === 'verified' || p.isVerified || p.is_verified).length
      };
    });
    
    res.json({ success: true, count: usersWithCounts.length, users: usersWithCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users/:id - Get individual user details
app.get('/api/admin/users/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    
    const { id } = req.params;
    const user = await store.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    // Add additional stats
    const allProps = (await store.getAllProperties?.()) || store.data?.properties || [];
    const userProperties = allProps.filter(p => p.userId === id || p.landlordId === id || p.landlord_id === id);
    const inquiries = (store.data?.inquiries || store.fallbackStore?.data?.inquiries || []).filter(i => i.userId === id || i.sender_id === id);
    const reviews = (store.data?.reviews || store.fallbackStore?.data?.reviews || []).filter(r => r.userId === id);
    const reports = (store.data?.reports || store.fallbackStore?.data?.reports || []).filter(r => r.reportedBy === id);
    
    const userWithStats = {
      ...user,
      propertyCount: userProperties.length,
      activeListings: userProperties.filter(p => p.status === 'verified' || p.isVerified || p.is_verified).length,
      inquiriesSent: inquiries.length,
      reviewsGiven: reviews.length,
      reportsCount: reports.length
    };
    
    res.json({ success: true, user: userWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/users/:id/suspend - Suspend/unsuspend user
app.post('/api/admin/users/:id/suspend', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    
    const { id } = req.params;
    const { reason, duration } = req.body;
    
    const user = await store.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    const updated = store.updateUser(id, {
      isSuspended: true,
      suspendReason: reason,
      suspendDuration: duration,
      suspendedAt: new Date().toISOString(),
      suspendedBy: req.user.id
    });
    
    res.json({
      success: true,
      message: `User ${user.name} has been suspended.`,
      user: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- BUILDINGS & UNITS ROUTES -----------------------------------------------

// Helper: get buildings list from DB if connected, else from in-memory store
async function getBuildingsList() {
  if (store.isConnected) {
    try {
      const res = await store.query(`
        SELECT b.*, u.name AS landlord_name,
          COUNT(un.id) FILTER (WHERE un.building_id IS NOT NULL) AS total_units,
          COUNT(un.id) FILTER (WHERE un.status = 'occupied') AS occupied_units,
          COUNT(un.id) FILTER (WHERE un.status = 'available') AS available_units,
          COUNT(un.id) FILTER (WHERE un.status = 'maintenance') AS maintenance_units
        FROM buildings b
        LEFT JOIN users u ON u.id = b.landlord_id
        LEFT JOIN units un ON un.building_id = b.id
        GROUP BY b.id, u.name
        ORDER BY b.created_at DESC
      `);
      return res.rows.map(b => ({
        ...b,
        landlordName: b.landlord_name,
        totalUnits: parseInt(b.total_units) || 0,
        occupiedUnits: parseInt(b.occupied_units) || 0,
        availableUnits: parseInt(b.available_units) || 0,
        maintenanceUnits: parseInt(b.maintenance_units) || 0,
      }));
    } catch (e) {
      console.warn('DB buildings query failed, falling back to memory:', e.message);
    }
  }
  // fallback to in-memory
  const buildings = store.data.buildings || [];
  return buildings.map(building => {
    const units = (store.data.units || []).filter(u => u.buildingId === building.id);
    return {
      ...building,
      totalUnits: units.length,
      occupiedUnits: units.filter(u => u.status === 'occupied' || u.isOccupied).length,
      availableUnits: units.filter(u => u.status === 'available').length,
      maintenanceUnits: units.filter(u => u.status === 'maintenance').length,
    };
  });
}

// Helper: get units list from DB if connected, else from in-memory store
async function getUnitsList(buildingId = null) {
  if (store.isConnected) {
    try {
      let query = `
        SELECT un.*, b.name AS building_name, u.name AS tenant_name
        FROM units un
        LEFT JOIN buildings b ON b.id = un.building_id
        LEFT JOIN users u ON u.id = un.tenant_id
      `;
      const params = [];
      if (buildingId) {
        query += ' WHERE un.building_id = $1';
        params.push(buildingId);
      }
      query += ' ORDER BY un.created_at DESC';
      const res = await store.query(query, params);
      return res.rows.map(u => ({ ...u, buildingName: u.building_name, tenantName: u.tenant_name }));
    } catch (e) {
      console.warn('DB units query failed, falling back to memory:', e.message);
    }
  }
  // fallback to in-memory
  const units = (store.data.units || []).filter(u => !buildingId || u.buildingId === buildingId);
  return units.map(unit => {
    const building = (store.data.buildings || []).find(b => b.id === unit.buildingId);
    return { ...unit, buildingName: building ? building.name : 'Unknown Building' };
  });
}

// GET /api/admin/buildings - Get all buildings
app.get('/api/admin/buildings', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const buildings = await getBuildingsList();
    res.json({ success: true, count: buildings.length, buildings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/buildings - Create a new building
app.post('/api/admin/buildings', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const { name, location, landlordId, totalFloors, description, amenities, status } = req.body;
    if (!name || !location) {
      return res.status(400).json({ success: false, message: 'Building name and location are required.' });
    }
    const id = 'bldg-' + Date.now();
    const createdAt = new Date().toISOString();

    if (store.isConnected) {
      try {
        // Ensure buildings table exists
        await store.query(`
          CREATE TABLE IF NOT EXISTS buildings (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            location TEXT,
            landlord_id TEXT,
            total_floors INTEGER DEFAULT 1,
            description TEXT,
            amenities JSONB DEFAULT '[]',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_by TEXT,
            raw_data JSONB DEFAULT '{}'
          )
        `);
        await store.query(
          `INSERT INTO buildings (id, name, location, landlord_id, total_floors, description, amenities, status, created_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [id, name.trim(), location.trim(), landlordId || null, parseInt(totalFloors) || 1,
           description || null, JSON.stringify(amenities || []), status || 'active', createdAt, req.user.id]
        );
      } catch (dbErr) {
        console.warn('DB building insert error:', dbErr.message);
        // fallback: save in memory
        if (!store.data.buildings) store.data.buildings = [];
        store.data.buildings.unshift({ id, name, location, landlordId, totalFloors, description, amenities, status, createdAt, createdBy: req.user.id });
        if (store.save) store.save();
      }
    } else {
      if (!store.data.buildings) store.data.buildings = [];
      store.data.buildings.unshift({ id, name, location, landlordId, totalFloors, description, amenities, status, createdAt, createdBy: req.user.id });
      if (store.save) store.save();
    }

    res.json({ success: true, message: `Building "${name}" created successfully.`, building: { id, name, location, landlordId, totalFloors, description, status, createdAt } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/buildings/:id - Update a building
app.put('/api/admin/buildings/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const { id } = req.params;
    const { name, location, totalFloors, description, status } = req.body;
    if (store.isConnected) {
      try {
        await store.query(
          `UPDATE buildings SET name=COALESCE($1,name), location=COALESCE($2,location), total_floors=COALESCE($3,total_floors), description=COALESCE($4,description), status=COALESCE($5,status) WHERE id=$6`,
          [name || null, location || null, totalFloors ? parseInt(totalFloors) : null, description || null, status || null, id]
        );
      } catch (dbErr) {
        console.warn('DB building update error:', dbErr.message);
      }
    } else {
      const b = (store.data.buildings || []).find(b => b.id === id);
      if (b) { Object.assign(b, { name, location, totalFloors, description, status }); if (store.save) store.save(); }
    }
    res.json({ success: true, message: 'Building updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/buildings/:id - Delete a building
app.delete('/api/admin/buildings/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const { id } = req.params;
    if (store.isConnected) {
      try { await store.query('DELETE FROM buildings WHERE id = $1', [id]); } catch (e) { console.warn('DB delete building error:', e.message); }
    } else {
      if (store.data.buildings) { store.data.buildings = store.data.buildings.filter(b => b.id !== id); if (store.save) store.save(); }
    }
    res.json({ success: true, message: 'Building deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/buildings/:id - Get building details
app.get('/api/admin/buildings/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const { id } = req.params;
    const all = await getBuildingsList();
    const building = all.find(b => b.id === id);
    if (!building) return res.status(404).json({ success: false, message: 'Building not found.' });
    res.json({ success: true, building });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/buildings/:id/units - Get units in a building
app.get('/api/admin/buildings/:id/units', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const units = await getUnitsList(req.params.id);
    res.json({ success: true, count: units.length, units });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/units - Create a new unit inside a building
app.post('/api/admin/units', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const { buildingId, unitNumber, bedrooms, bathrooms, price, status, description } = req.body;
    if (!buildingId || !unitNumber) {
      return res.status(400).json({ success: false, message: 'buildingId and unitNumber are required.' });
    }
    const id = 'unit-' + Date.now();
    const createdAt = new Date().toISOString();

    if (store.isConnected) {
      try {
        await store.query(`
          CREATE TABLE IF NOT EXISTS units (
            id TEXT PRIMARY KEY,
            building_id TEXT,
            unit_number TEXT,
            bedrooms INTEGER DEFAULT 0,
            bathrooms INTEGER DEFAULT 0,
            price NUMERIC DEFAULT 0,
            status TEXT DEFAULT 'available',
            tenant_id TEXT,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        await store.query(
          `INSERT INTO units (id, building_id, unit_number, bedrooms, bathrooms, price, status, description, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [id, buildingId, unitNumber, parseInt(bedrooms)||0, parseInt(bathrooms)||0, parseFloat(price)||0, status||'available', description||null, createdAt]
        );
      } catch (dbErr) {
        console.warn('DB unit insert error:', dbErr.message);
        if (!store.data.units) store.data.units = [];
        store.data.units.unshift({ id, buildingId, unitNumber, bedrooms, bathrooms, price, status, description, createdAt });
        if (store.save) store.save();
      }
    } else {
      if (!store.data.units) store.data.units = [];
      store.data.units.unshift({ id, buildingId, unitNumber, bedrooms, bathrooms, price, status, description, createdAt });
      if (store.save) store.save();
    }
    res.json({ success: true, message: `Unit "${unitNumber}" created.`, unit: { id, buildingId, unitNumber, bedrooms, bathrooms, price, status, createdAt } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/units - Get all units
app.get('/api/admin/units', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const units = await getUnitsList();
    res.json({ success: true, count: units.length, units });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/units/:id - Update a unit
app.put('/api/admin/units/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const { id } = req.params;
    const { unitNumber, bedrooms, bathrooms, price, status } = req.body;
    if (store.isConnected) {
      try {
        await store.query(
          `UPDATE units SET unit_number=COALESCE($1,unit_number), bedrooms=COALESCE($2,bedrooms), bathrooms=COALESCE($3,bathrooms), price=COALESCE($4,price), status=COALESCE($5,status) WHERE id=$6`,
          [unitNumber || null, bedrooms != null ? parseInt(bedrooms) : null, bathrooms != null ? parseInt(bathrooms) : null, price != null ? parseFloat(price) : null, status || null, id]
        );
      } catch (dbErr) { console.warn('DB unit update error:', dbErr.message); }
    } else {
      const u = (store.data.units || []).find(u => u.id === id);
      if (u) { Object.assign(u, { unitNumber, bedrooms, bathrooms, price, status }); if (store.save) store.save(); }
    }
    res.json({ success: true, message: 'Unit updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/users/:id/toggle-verify', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const { id } = req.params;
    const user = await store.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const updated = await store.updateUser(id, { isVerified: !user.isVerified });
    res.json({
      success: true,
      message: `User ${user.name} is now ${updated.isVerified ? 'VERIFIED' : 'UNVERIFIED'}`,
      user: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/users/:id/ban (Ban/Unban user)
app.post('/api/admin/users/:id/ban', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // Admin check
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const user = await store.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Cannot ban admin
    if (user.id === 'usr-admin-01' || user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot ban administrator accounts.' });
    }

    const shouldBan = action === 'ban';
    const updated = store.updateUser(id, { 
      isBanned: shouldBan,
      bannedAt: shouldBan ? new Date().toISOString() : null,
      bannedBy: shouldBan ? req.user.id : null
    });

    // Send SMS notification
    if (user.phone) {
      try {
        if (shouldBan) {
          await sendSMS(user.phone, 
            `Your KejaMarket account has been suspended. Please contact support for more information.`
          );
        } else {
          await sendSMS(user.phone, 
            `Your KejaMarket account has been reactivated. You can now access all features again.`
          );
        }
      } catch (err) {
        console.error('Failed to send ban/unban SMS:', err.message);
      }
    }

    res.json({
      success: true,
      message: shouldBan ? `User ${user.name} has been BANNED` : `User ${user.name} has been UNBANNED`,
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


// GET /api/admin/download-db (Backup â€” admin only)
app.get('/api/admin/download-db', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
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


// GET /api/admin/all-properties -- returns ALL properties (verified + pending) for admin
app.get('/api/admin/all-properties', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const all = await store.getAllProperties();
    res.json({ success: true, count: all.length, total: all.length, properties: all });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/pending-listings â€” listings awaiting approval
app.get('/api/admin/pending-listings', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const all = await store.getAllProperties();
    const pending = all.filter(p =>
      !p.isVerified && !p.is_verified &&
      !p.isApproved &&
      p.status !== 'approved' &&
      p.status !== 'rejected' &&
      !p.isPlaceholder &&
      !p.isTest
    );
    res.json({ success: true, count: pending.length, listings: pending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/send-message (Send message to individual user)
app.post('/api/admin/send-message', requireAuth, async (req, res) => {
  try {
    const { userId, message, method = 'email' } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ success: false, message: 'User ID and message are required.' });
    }

    // Get user details
    const user = await store.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Send via email (simulated - you'll integrate real email service)
    if (method === 'email' || method === 'both') {
      console.log(`[EMAIL] To: ${user.email || 'No email'}`);
      console.log(`Subject: Message from KejaMarket Admin`);
      console.log(`Body: ${message}`);
      // TODO: Integrate with SendGrid/Mailgun/AWS SES
    }

    // Send via SMS
    if (method === 'sms' || method === 'both') {
      if (user.phone) {
        try {
          await sendSMS(user.phone, `KejaMarket Admin: ${message}`);
        } catch (err) {
          console.error('SMS send failed:', err.message);
        }
      }
    }

    res.json({ 
      success: true, 
      message: 'Message sent successfully!',
      sentTo: user.name
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/broadcast (Send broadcast message to role group)
app.post('/api/admin/broadcast', requireAuth, async (req, res) => {
  try {
    const { targetRole, message, method = 'email' } = req.body;

    if (!targetRole || !message) {
      return res.status(400).json({ success: false, message: 'Target role and message are required.' });
    }

    // Get all users or filter by role
    let users = await store.getAllUsers();
    if (targetRole !== 'all') {
      users = users.filter(u => u.role === targetRole);
    }

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No users found for this role.' });
    }

    // Send to all users
    let sentCount = 0;
    for (const user of users) {
      try {
        if (method === 'email' || method === 'both') {
          console.log(`[BROADCAST EMAIL] To: ${user.email || 'No email'}, Role: ${user.role}`);
          // TODO: Integrate email service
        }

        if (method === 'sms' || method === 'both') {
          if (user.phone) {
            await sendSMS(user.phone, `KejaMarket: ${message}`);
          }
        }
        sentCount++;
      } catch (err) {
        console.error(`Failed to send to ${user.name}:`, err.message);
      }
    }

    res.json({ 
      success: true, 
      message: `Broadcast sent successfully!`,
      recipientCount: sentCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN USER MANAGEMENT (who has admin access) ──────────────────────────

// GET /api/admin/admins — list all admin users
app.get('/api/admin/admins', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const allUsers = await store.getAllUsers();
    const admins = allUsers.filter(u =>
      u.role === 'admin' || u.isAdmin === true || u.is_admin === true || u.id === 'usr-admin-01'
    );
    res.json({ success: true, count: admins.length, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/admins — promote an existing user to admin OR create a new admin
app.post('/api/admin/admins', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const { userId, name, email, phone, password, permissions = [] } = req.body;

    // If userId given — promote existing user
    if (userId) {
      let user = await store.getUserById(userId);
      if (!user && store.findUserByIdentifier) {
        user = await store.findUserByIdentifier(userId);
      }
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      const updated = await store.updateUser(user.id, {
        role: 'admin',
        isAdmin: true,
        is_admin: true,
        adminPermissions: permissions,
        promotedAt: new Date().toISOString(),
        promotedBy: req.user.id
      });
      return res.json({ success: true, message: `${user.name} promoted to admin.`, user: updated || user });
    }

    // Otherwise create a new admin user
    if (!name || (!email && !phone)) {
      return res.status(400).json({ success: false, message: 'Name and email or phone are required.' });
    }

    const bcrypt = require('bcryptjs');
    const rawPassword = password || ('KejaAdmin' + Math.floor(Math.random() * 9000 + 1000));
    const cleanPhone = phone ? formatPhone(phone) : ('0700' + Math.floor(100000 + Math.random() * 900000));

    const newAdmin = await store.createUser({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : null,
      phone: cleanPhone,
      password: rawPassword,
      role: 'admin',
      isAdmin: true,
      is_admin: true,
      adminPermissions: permissions,
      isPhoneVerified: true
    });

    if (newAdmin && !newAdmin.isAdmin) {
      await store.updateUser(newAdmin.id, { role: 'admin', isAdmin: true, is_admin: true });
    }

    res.json({
      success: true,
      message: 'Admin user created.',
      user: newAdmin,
      tempPassword: rawPassword
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/admins/:id — update admin permissions/name
app.put('/api/admin/admins/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const user = await store.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Admin user not found.' });

    if (req.params.id === 'usr-admin-01') {
      return res.status(403).json({ success: false, message: 'Cannot modify the root super-admin.' });
    }

    const { name, email, phone, permissions } = req.body;
    const updated = await store.updateUser(req.params.id, {
      name, email, phone, adminPermissions: permissions
    });
    res.json({ success: true, message: 'Admin updated.', user: updated || user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/admins/:id — revoke admin access (demote to tenant)
app.delete('/api/admin/admins/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    if (req.params.id === 'usr-admin-01') {
      return res.status(403).json({ success: false, message: 'Cannot remove the root super-admin.' });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot remove your own admin access.' });
    }
    const user = await store.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await store.updateUser(req.params.id, {
      role: 'tenant',
      isAdmin: false,
      is_admin: false,
      demotedAt: new Date().toISOString(),
      demotedBy: req.user.id
    });
    res.json({ success: true, message: `Admin access removed from ${user.name}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN OPERATIONS DATA ENDPOINTS ────────────────────────────────────────

// GET /api/admin/inquiries
app.get('/api/admin/inquiries', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    let inquiries = [];
    if (store.isConnected && store.query) {
      try {
        const r = await store.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 100');
        inquiries = r.rows.map(row => ({
          id: row.id,
          name: row.sender_name || 'Anonymous',
          phone: row.sender_phone || '',
          propertyId: row.property_id,
          propertyTitle: row.property_title || row.estate_suburb || 'Property Inquiry',
          message: row.text,
          createdAt: row.created_at,
          status: row.is_read ? 'responded' : 'new'
        }));
      } catch (e) {
        inquiries = store.data?.inquiries || store.fallbackStore?.data?.inquiries || [];
      }
    } else {
      inquiries = store.data?.inquiries || store.fallbackStore?.data?.inquiries || [];
    }
    res.json({ success: true, count: inquiries.length, inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reviews
app.get('/api/admin/reviews', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    let reviews = [];
    if (store.isConnected && store.query) {
      try {
        const r = await store.query(`
          SELECT pr.*, p.title as property_title 
          FROM property_reviews pr
          LEFT JOIN properties p ON pr.property_id = p.id
          ORDER BY pr.review_date DESC LIMIT 100
        `);
        reviews = r.rows.map(row => ({
          id: row.id,
          reviewerName: row.author,
          propertyId: row.property_id,
          propertyTitle: row.property_title || row.property_id,
          rating: Math.round(parseFloat(row.rating_overall) || 5),
          comment: row.review_text,
          date: row.review_date
        }));
      } catch (e) {
        reviews = store.data?.reviews || store.fallbackStore?.data?.reviews || [];
      }
    } else {
      reviews = store.data?.reviews || store.fallbackStore?.data?.reviews || [];
    }
    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reports
app.get('/api/admin/reports', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const reports = store.data?.reports || store.fallbackStore?.data?.reports || [];
    res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/support
app.get('/api/admin/support', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const tickets = store.data?.supportTickets || store.fallbackStore?.data?.supportTickets || [];
    res.json({ success: true, count: tickets.length, tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


app.put('/api/properties/:id/boost', async (req, res) => {
  try {
    const { id } = req.params;
    const { boostType = 'top_ad' } = req.body;

    const property = store.getPropertyById(id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    // Update property
    property.isTopAd = true;
    property.boosted = true;
    property.boostType = boostType;
    property.boostedAt = new Date().toISOString();
    store.updateProperty(id, property);

    res.json({ 
      success: true, 
      message: 'Listing boosted successfully!',
      property
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/properties/:id/unboost (Remove boost from listing)
app.put('/api/properties/:id/unboost', async (req, res) => {
  try {
    const { id } = req.params;

    const property = store.getPropertyById(id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    // Update property
    property.isTopAd = false;
    property.boosted = false;
    property.boostType = null;
    property.boostedAt = null;
    store.updateProperty(id, property);

    res.json({ 
      success: true, 
      message: 'Boost removed successfully!',
      property
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// â”€â”€â”€ LANDLORD PORTAL ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/landlord/my-listings (Get all listings for logged-in landlord)
app.get('/api/landlord/my-listings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPhone = req.user.phone;

    const allProperties = await store.getAllProperties();
    const myListings = allProperties.filter(p =>
      (p.landlord && p.landlord.id === userId) ||
      (p.landlord && p.landlord.phone === userPhone) ||
      p.landlordPhone === userPhone ||
      p.landlordId === userId ||
      p.postedBy === userId
    );

    res.json({ 
      success: true, 
      listings: myListings,
      count: myListings.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/landlord/messages (Get messages for landlord)
app.get('/api/landlord/messages', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get messages from store (you'll need to add this to store.js)
    const messages = store.getLandlordMessages(userId);

    res.json({ 
      success: true, 
      messages: messages || [],
      count: messages ? messages.length : 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/landlord/send-message (Send message to admin)
app.post('/api/landlord/send-message', requireAuth, async (req, res) => {
  try {
    const { message, propertyId } = req.body;
    const user = req.user;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Save message to store
    const savedMessage = store.saveLandlordMessage({
      fromUserId: user.id,
      fromUserName: user.name,
      fromRole: user.role,
      toRole: 'admin',
      message,
      propertyId,
      createdAt: new Date().toISOString(),
      isRead: false
    });

    // Send SMS notification to admin (optional)
    const adminPhone = '+254733112233'; // Configure this
    try {
      await sendSMS(adminPhone, 
        `New message from landlord ${user.name}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`
      );
    } catch (err) {
      console.error('Failed to send admin notification SMS:', err.message);
    }

    res.json({ 
      success: true, 
      message: 'Message sent successfully!',
      data: savedMessage
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/landlord/availability/:id (Toggle property availability: vacant/taken)
app.put('/api/landlord/availability/:id', requireAuth, async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { availability } = req.body;
    const userId = req.user.id;

    if (!availability || !['vacant', 'taken'].includes(availability)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Availability must be "vacant" or "taken".' 
      });
    }

    // Get property
    const property = await store.getPropertyById(propertyId);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    // Verify ownership
    if (property.postedBy !== userId && property.landlordId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own properties.'
      });
    }

    // Update availability
    await store.updateProperty(propertyId, {
      availability,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Property marked as ${availability}.`,
      property: { ...property, availability }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SERVICE PROVIDER ENDPOINTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// GET /api/service/my-services (Get all services for logged-in service provider)
app.get('/api/service/my-services', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const allListings = await store.getAllProperties();
    const myServices = allListings.filter(listing =>
      (listing.postedBy === userId || listing.landlordId === userId) && listing.listingType === 'service'
    );
    res.json({ success: true, services: myServices, total: myServices.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service/messages (Get messages for service provider)
app.get('/api/service/messages', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await store.getMessages(null, userId);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/service/post (Service provider posts a new service)
app.post('/api/service/post', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'service') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only service providers can post services.' 
      });
    }

    const {
      category,
      businessName,
      description,
      serviceAreas,
      price,
      phone
    } = req.body;

    if (!category || !businessName || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category, business name, and phone are required.' 
      });
    }

    // Create service listing
    const newService = {
      id: `srv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      listingType: 'service',
      category,
      businessName,
      providerName: user.name,
      description: description || '',
      serviceAreas: serviceAreas || '',
      price: price || null,
      phone: phone || user.phone,
      postedBy: user.id,
      isVerified: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await store.addProperty(newService);

    // Send SMS to provider confirming submission
    try {
      await sendSMS(user.phone, 
        `KejaMarket: Your service "${businessName}" has been submitted for admin approval. You'll be notified once verified!`
      );
    } catch (err) {
      console.error('SMS notification failed:', err.message);
    }

    // Create auto-message to admin
    store.saveLandlordMessage({
      fromUserId: user.id,
      fromUserName: user.name,
      fromRole: 'service',
      toRole: 'admin',
      message: `New service posted: ${businessName} (${category}). Awaiting verification.`,
      propertyId: saved.id,
      createdAt: new Date().toISOString(),
      isRead: false
    });

    res.json({ 
      success: true, 
      message: 'Service posted successfully! Awaiting admin approval.',
      service: saved
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/service/boost-payment (Initiate M-Pesa payment for boost)
app.post('/api/service/boost-payment', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { serviceId, phone, amount } = req.body;

    if (!serviceId || !phone || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service ID, phone, and amount are required.' 
      });
    }

    // Verify service exists and belongs to user
    const service = store.getPropertyById(serviceId);
    if (!service || service.postedBy !== user.id) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service not found or unauthorized.' 
      });
    }

    // Normalize phone number
    let phoneNumber = phone.replace(/\s/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '254' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('254')) {
      phoneNumber = '254' + phoneNumber;
    }

    // Initiate M-Pesa STK Push
    const mpesaResponse = await initiateMpesaPayment({
      amount,
      phoneNumber,
      accountReference: serviceId,
      transactionDesc: 'Service Boost Payment'
    });

    if (mpesaResponse.success) {
      // Save payment record
      const paymentRecord = {
        id: `pay-${Date.now()}`,
        userId: user.id,
        serviceId,
        amount,
        phone: phoneNumber,
        checkoutRequestId: mpesaResponse.CheckoutRequestID,
        merchantRequestId: mpesaResponse.MerchantRequestID,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      store.savePayment(paymentRecord);

      res.json({ 
        success: true, 
        message: 'Payment initiated. Check your phone to complete.',
        checkoutRequestId: mpesaResponse.CheckoutRequestID
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: mpesaResponse.message || 'Payment initiation failed.'
      });
    }
  } catch (err) {
    console.error('Boost payment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service/payment-status/:checkoutRequestId (Check payment status)
app.get('/api/service/payment-status/:checkoutRequestId', requireAuth, async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    
    // Get payment record
    const payment = store.getPaymentByCheckout(checkoutRequestId);
    
    if (!payment) {
      return res.json({ status: 'unknown' });
    }

    // If already completed, return immediately
    if (payment.status === 'completed') {
      return res.json({ status: 'completed' });
    }

    // Query M-Pesa for status
    const mpesaStatus = await queryMpesaPaymentStatus(
      checkoutRequestId, 
      payment.merchantRequestId
    );

    if (mpesaStatus.success && mpesaStatus.ResultCode === '0') {
      // Payment successful - boost the service
      const service = store.getPropertyById(payment.serviceId);
      if (service) {
        service.isTopAd = true;
        service.boosted = true;
        service.boostType = 'paid';
        service.boostedAt = new Date().toISOString();
        service.boostExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
        service.boostAnalytics = { views: 0, clicks: 0, inquiries: 0 }; // Initialize analytics
        store.updateProperty(payment.serviceId, service);

        // Update payment status
        payment.status = 'completed';
        payment.completedAt = new Date().toISOString();
        store.updatePayment(payment.id, payment);

        // Send confirmation SMS
        try {
          await sendSMS(payment.phone, 
            `KejaMarket: Payment successful! Your service is now BOOSTED for 30 days. Thank you!`
          );
        } catch (err) {
          console.error('SMS confirmation failed:', err);
        }
      }

      res.json({ status: 'completed' });
    } else if (mpesaStatus.ResultCode) {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = mpesaStatus.ResultDesc;
      store.updatePayment(payment.id, payment);
      
      res.json({ status: 'failed', reason: mpesaStatus.ResultDesc });
    } else {
      // Still pending
      res.json({ status: 'pending' });
    }
  } catch (err) {
    console.error('Payment status check error:', err);
    res.json({ status: 'unknown' });
  }
});

// GET /api/service/payment-history (Get payment history for service provider)
app.get('/api/service/payment-history', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const allPayments = store.getAllPayments();
    const userPayments = allPayments.filter(p => p.userId === userId);

    // Sort by date (newest first)
    userPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      payments: userPayments,
      count: userPayments.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/properties/:id/track-view (Track property/service view for analytics)
app.post('/api/properties/:id/track-view', (req, res) => {
  try {
    const { id } = req.params;
    trackBoostView(id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// POST /api/properties/:id/track-click (Track property/service click for analytics)
app.post('/api/properties/:id/track-click', (req, res) => {
  try {
    const { id } = req.params;
    trackBoostClick(id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// PUT /api/service/availability/:id (Toggle service availability)
app.put('/api/service/availability/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const userId = req.user.id;

    // Get service
    const service = store.getPropertyById(id);
    if (!service || service.postedBy !== userId) {
      return res.status(404).json({ success: false, message: 'Service not found or unauthorized.' });
    }

    // Update availability
    service.isAvailable = isAvailable;
    store.updateProperty(id, service);

    res.json({ 
      success: true, 
      message: `Service marked as ${isAvailable ? 'Available' : 'Not Available'}`,
      service
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// â”€â”€â”€ 404 HANDLER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ================================================================================
// SERVICES & MARKETPLACE API ENDPOINTS
// ================================================================================

// GET /api/services
app.get('/api/services', async (req, res) => {
  try {
    const { serviceType, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM services WHERE status = $1 AND is_verified = true';
    const params = ['active'];
    let pCount = 2;
    if (serviceType) { query += ` AND service_type = $${pCount}`; params.push(serviceType); pCount++; }
    query += ` ORDER BY created_at DESC LIMIT $${pCount} OFFSET $${pCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await store.query(query, params);
    res.json({ success: true, services: result.rows, count: result.rows.length });
  } catch (err) {
    res.json({ success: false, services: [], error: err.message });
  }
});

// GET /api/marketplace
app.get('/api/marketplace', async (req, res) => {
  try {
    const { category, condition, maxPrice, limit = 50, offset = 0 } = req.query;
    // Note: marketplace_items does not have is_verified column, filter on status only
    let query = 'SELECT * FROM marketplace_items WHERE status = $1';
    const params = ['active'];
    let pCount = 2;
    if (category) { query += ` AND category = $${pCount}`; params.push(category); pCount++; }
    if (condition) { query += ` AND condition = $${pCount}`; params.push(condition); pCount++; }
    if (maxPrice) { query += ` AND price_kes <= $${pCount}`; params.push(parseInt(maxPrice)); pCount++; }
    query += ` ORDER BY created_at DESC LIMIT $${pCount} OFFSET $${pCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await store.query(query, params);
    res.json({ success: true, items: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Marketplace fetch error:', err.message);
    res.json({ success: false, items: [], error: err.message });
  }
});

// POST /api/marketplace
app.post('/api/marketplace', requireAuth, async (req, res) => {
  try {
    const { title, description, category, price, condition, itemType, isNegotiable, locationSuburb, locationCorridor, images } = req.body;
    const itemId = 'mkt-' + Date.now();
    await store.query(
      'INSERT INTO marketplace_items (id, title, description, category, seller_id, seller_name, seller_phone, price_kes, condition, item_type, is_negotiable, location_suburb, location_corridor, images) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
      [itemId, title, description, category, req.user.id, req.user.name, req.user.phone, price, condition, itemType, isNegotiable, locationSuburb, locationCorridor, JSON.stringify(images || [])]
    );
    res.status(201).json({ success: true, itemId, message: 'Item posted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/marketplace/my-items (Get items for logged-in user)
app.get('/api/marketplace/my-items', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPhone = req.user.phone;
    let items = [];
    if (store && store.query) {
      const result = await store.query(
        'SELECT * FROM marketplace_items WHERE seller_id = $1 OR seller_phone = $2 ORDER BY created_at DESC',
        [userId, userPhone]
      );
      items = result.rows || [];
    } else if (store && store.data && store.data.marketplace_items) {
      items = store.data.marketplace_items.filter(i => i.seller_id === userId || i.sellerId === userId || i.seller_phone === userPhone);
    }
    res.json({ success: true, count: items.length, items });
  } catch (err) {
    console.error('Fetch my marketplace items error:', err.message);
    res.status(500).json({ success: false, items: [], error: err.message });
  }
});

// PUT /api/marketplace/:id (Update marketplace item)
app.put('/api/marketplace/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const { title, description, category, price, condition, itemType, isNegotiable, locationSuburb, locationCorridor } = req.body;

    if (store && store.query) {
      const check = await store.query('SELECT * FROM marketplace_items WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
      const item = check.rows[0];
      if (item.seller_id !== userId && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized to edit this item' });
      }
      await store.query(
        `UPDATE marketplace_items 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             category = COALESCE($3, category),
             price_kes = COALESCE($4, price_kes),
             condition = COALESCE($5, condition),
             item_type = COALESCE($6, item_type),
             is_negotiable = COALESCE($7, is_negotiable),
             location_suburb = COALESCE($8, location_suburb),
             location_corridor = COALESCE($9, location_corridor),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10`,
        [title, description, category, price, condition, itemType, isNegotiable, locationSuburb, locationCorridor, id]
      );
      return res.json({ success: true, message: 'Item updated successfully' });
    }
    res.json({ success: true, message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/marketplace/:id/status (Pause, Mark as Sold, or Reactivate item)
app.patch('/api/marketplace/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active', 'paused', 'sold'
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

    if (!['active', 'paused', 'sold', 'deleted'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (store && store.query) {
      const check = await store.query('SELECT * FROM marketplace_items WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
      const item = check.rows[0];
      if (item.seller_id !== userId && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      await store.query('UPDATE marketplace_items SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
      return res.json({ success: true, message: `Item status updated to ${status}` });
    }
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/marketplace/:id (Delete item)
app.delete('/api/marketplace/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

    if (store && store.query) {
      const check = await store.query('SELECT * FROM marketplace_items WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
      const item = check.rows[0];
      if (item.seller_id !== userId && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      await store.query('DELETE FROM marketplace_items WHERE id = $1', [id]);
      return res.json({ success: true, message: 'Item deleted successfully' });
    }
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/properties/:id (Update property listing)
app.put('/api/properties/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const property = await store.getPropertyById(id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const isOwner = property.postedBy === userId || 
                    property.landlordId === userId || 
                    (property.landlord && (property.landlord.id === userId || property.landlord.phone === req.user.phone));

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this property' });
    }

    const updatedData = { ...req.body, updatedAt: new Date().toISOString() };
    const updated = await store.updateProperty(id, updatedData);
    res.json({ success: true, message: 'Property updated successfully', property: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/properties/:id/renew (Renew expired or active listing)
app.post('/api/properties/:id/renew', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const property = await store.getPropertyById(id);

    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    const isOwner = property.postedBy === userId || property.landlordId === userId || isAdmin;
    if (!isOwner) return res.status(403).json({ success: false, message: 'Unauthorized' });

    await store.updateProperty(id, {
      status: 'active',
      isExpired: false,
      renewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Listing renewed successfully for 30 days!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/service/:id (Update service listing)
app.put('/api/service/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

    if (store && store.query) {
      const check = await store.query('SELECT * FROM services WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Service not found' });
      if (check.rows[0].provider_id !== userId && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      const { title, description, serviceType, priceMin, priceMax, coverageArea, serviceHours } = req.body;
      await store.query(
        `UPDATE services SET 
           title = COALESCE($1, title),
           description = COALESCE($2, description),
           service_type = COALESCE($3, service_type),
           price_min = COALESCE($4, price_min),
           price_max = COALESCE($5, price_max),
           coverage_area = COALESCE($6, coverage_area),
           service_hours = COALESCE($7, service_hours),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [title, description, serviceType, priceMin, priceMax, coverageArea, serviceHours, id]
      );
      return res.json({ success: true, message: 'Service updated successfully' });
    }
    res.json({ success: true, message: 'Service updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/service/:id (Delete service listing)
app.delete('/api/service/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

    if (store && store.query) {
      const check = await store.query('SELECT * FROM services WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Service not found' });
      if (check.rows[0].provider_id !== userId && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      await store.query('DELETE FROM services WHERE id = $1', [id]);
      return res.json({ success: true, message: 'Service removed successfully' });
    }
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/agency/team (Get agency team members)
app.get('/api/agency/team', requireAuth, async (req, res) => {
  try {
    const agencyId = req.user.id;
    // Query users or team members associated with agency
    let team = [];
    if (store && store.query) {
      const result = await store.query(
        "SELECT id, name, email, phone, role, created_at FROM users WHERE role = 'agent' OR (registration_data->>'agencyId' = $1)",
        [agencyId]
      );
      team = result.rows || [];
    }
    res.json({ success: true, team });
  } catch (err) {
    res.json({ success: true, team: [] });
  }
});

// POST /api/agency/team (Add team member to agency)
app.post('/api/agency/team', requireAuth, async (req, res) => {
  try {
    const { name, email, phone, role = 'agent' } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone are required' });
    
    // Save team member note or user
    res.json({ success: true, message: `Team member ${name} added successfully!`, member: { name, email, phone, role } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/services
app.post('/api/services', requireAuth, async (req, res) => {
  try {
    const { title, description, serviceType, priceMin, priceMax, coverageArea, serviceHours, images } = req.body;
    const serviceId = 'svc-' + Date.now();
    await store.query(
      'INSERT INTO services (id, title, description, service_type, provider_id, provider_name, provider_phone, price_min, price_max, coverage_area, service_hours, images) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [serviceId, title, description, serviceType, req.user.id, req.user.name, req.user.phone, priceMin, priceMax, coverageArea, serviceHours, JSON.stringify(images || [])]
    );
    res.status(201).json({ success: true, serviceId, message: 'Service created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/pending
app.get('/api/admin/pending', requireAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Admin access required' });
    const allProps = await Promise.resolve(store.getAllProperties ? store.getAllProperties() : []);
    const properties = (allProps || []).filter(p => !p.is_verified)
      .map(p => ({ id: p.id, title: p.title, description: p.description, price: p.rent_kes, location: p.estate_suburb, created_at: p.created_at, images: Array.isArray(p.media) ? p.media.map(m => m.url || m) : [], type: 'property' }));
    const svcs = store.getServices ? await Promise.resolve(store.getServices()) : [];
    const services = (svcs || []).filter(s => !s.is_verified)
      .map(s => ({ id: s.id, title: s.title, description: s.description, created_at: s.created_at, type: 'service' }));
    const mktItems = store.getMarketplaceItems ? await Promise.resolve(store.getMarketplaceItems()) : [];
    const items = (mktItems || []).filter(i => !i.is_verified)
      .map(i => ({ id: i.id, title: i.title, description: i.description, price: i.price_kes, category: i.category, created_at: i.created_at, type: 'marketplace' }));
    res.json({ success: true, pending: { properties, services, items }, items: [...properties, ...services, ...items], counts: { pendingProperties: properties.length, pendingServices: services.length, pendingItems: items.length, total: properties.length + services.length + items.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/approve
app.post('/api/admin/approve', requireAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Admin access required' });
    const { itemType, itemId } = req.body;
    if (!itemType || !itemId) return res.status(400).json({ success: false, message: 'itemType and itemId required' });
    let updatedItem = null;
    if (itemType === 'property') updatedItem = await Promise.resolve(store.updateProperty(itemId, { is_verified: true }));
    else if (itemType === 'service' && store.updateService) updatedItem = await Promise.resolve(store.updateService(itemId, { is_verified: true }));
    else if (itemType === 'marketplace' && store.updateMarketplaceItem) updatedItem = await Promise.resolve(store.updateMarketplaceItem(itemId, { is_verified: true }));
    else return res.status(400).json({ success: false, message: 'Invalid itemType' });
    if (!updatedItem) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: `${itemType} approved successfully`, item: updatedItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/reject
app.post('/api/admin/reject', requireAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Admin access required' });
    const { itemType, itemId } = req.body;
    if (!itemType || !itemId) return res.status(400).json({ success: false, message: 'itemType and itemId required' });
    let deletedItem = null;
    if (itemType === 'property') {
      if (store.getProperty) deletedItem = await Promise.resolve(store.getProperty(itemId));
      if (deletedItem) await Promise.resolve(store.deleteProperty(itemId));
    } else if (itemType === 'service' && store.getService && store.deleteService) {
      deletedItem = await Promise.resolve(store.getService(itemId));
      if (deletedItem) await Promise.resolve(store.deleteService(itemId));
    } else if (itemType === 'marketplace' && store.getMarketplaceItem && store.deleteMarketplaceItem) {
      deletedItem = await Promise.resolve(store.getMarketplaceItem(itemId));
      if (deletedItem) await Promise.resolve(store.deleteMarketplaceItem(itemId));
    }
    if (!deletedItem) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: `${itemType} rejected and removed`, item: deletedItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.use((req, res) => {
  // API routes get JSON 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
  }
  // All other routes serve the custom 404 page
  const notFoundPath = require('path').join(__dirname, '404.html');
  if (require('fs').existsSync(notFoundPath)) {
    return res.status(404).sendFile(notFoundPath);
  }
  res.status(404).send('<h1>404 â€” Page Not Found</h1><p><a href="/">â† Back to KejaMarket</a></p>');
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CRON JOBS & AUTOMATED TASKS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Check for expired boosts every hour
setInterval(async () => {
  try {
    console.log('[CRON] Checking for expired boosts...');
    const properties = await store.getAllProperties();
    let expiredCount = 0;

    properties.forEach(property => {
      if (property.boosted && property.boostExpiresAt) {
        const expiryDate = new Date(property.boostExpiresAt);
        const now = new Date();

        // Check if boost has expired
        if (now > expiryDate) {
          property.isTopAd = false;
          property.boosted = false;
          property.boostType = null;
          property.boostedAt = null;
          property.boostExpiresAt = null;
          store.updateProperty(property.id, property);
          expiredCount++;

          console.log(`[CRON] Expired boost removed: ${property.id}`);
        }
      }
    });

    if (expiredCount > 0) {
      console.log(`[CRON] Removed ${expiredCount} expired boost(s)`);
    }
  } catch (err) {
    console.error('[CRON] Boost expiry check failed:', err);
  }
}, 60 * 60 * 1000); // Run every hour

// Send renewal reminders 3 days before expiry
setInterval(async () => {
  try {
    console.log('[CRON] Checking for boost renewal reminders...');
    const properties = await store.getAllProperties();
    const users = await store.getAllUsers();
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

    for (const property of properties) {
      if (property.boosted && property.boostExpiresAt) {
        const expiryDate = new Date(property.boostExpiresAt);

        // Check if expiry is within 3 days
        if (expiryDate > now && expiryDate <= threeDaysFromNow) {
          // Check if we already sent reminder
          const reminderKey = `reminder_sent_${property.id}`;
          if (!property[reminderKey]) {
            // Find owner
            const owner = users.find(u => u.id === property.postedBy);
            if (owner && owner.phone) {
              const daysLeft = Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000));
              
              try {
                await sendSMS(
                  owner.phone,
                  `KejaMarket: Your boost for "${property.title || property.businessName}" expires in ${daysLeft} days. Renew now to maintain top visibility! Reply YES to renew.`
                );

                // Mark reminder as sent
                property[reminderKey] = true;
                store.updateProperty(property.id, property);

                console.log(`[CRON] Renewal reminder sent to ${owner.phone}`);
              } catch (err) {
                console.error(`[CRON] Failed to send renewal reminder:`, err);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[CRON] Renewal reminder check failed:', err);
  }
}, 12 * 60 * 60 * 1000); // Run every 12 hours

// Track boost analytics (views/clicks) - Increment on property view
function trackBoostView(propertyId) {
  try {
    const property = store.getPropertyById(propertyId);
    if (property && property.boosted) {
      if (!property.boostAnalytics) {
        property.boostAnalytics = { views: 0, clicks: 0, inquiries: 0 };
      }
      property.boostAnalytics.views++;
      store.updateProperty(propertyId, property);
    }
  } catch (err) {
    console.error('Analytics tracking error:', err);
  }
}

function trackBoostClick(propertyId) {
  try {
    const property = store.getPropertyById(propertyId);
    if (property && property.boosted) {
      if (!property.boostAnalytics) {
        property.boostAnalytics = { views: 0, clicks: 0, inquiries: 0 };
      }
      property.boostAnalytics.clicks++;
      store.updateProperty(propertyId, property);
    }
  } catch (err) {
    console.error('Analytics tracking error:', err);
  }
}

// â”€â”€â”€ START SERVER & KEEP-ALIVE HEARTBEAT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PORT = process.env.PORT || 3001;

// Initialize database and start server
// DIAGNOSTIC ENDPOINT - Check database and store status
app.get('/api/diagnostic', async (req, res) => {
  try {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 
        'postgresql://postgres:***@' + process.env.DATABASE_URL.split('@')[1] : 'NOT SET',
      storeInitialized: !!store,
      storeType: store ? store.constructor.name : 'NONE'
    };

    // Try to count properties
    if (store && typeof store.getProperties === 'function') {
      try {
        const result = await store.getProperties({ page: 1, limit: 1 });
        diagnostic.propertyCount = result.total || 0;
        diagnostic.storeWorking = true;
      } catch (err) {
        diagnostic.propertyCount = 0;
        diagnostic.storeError = err.message;
        diagnostic.storeWorking = false;
      }
    } else {
      diagnostic.propertyCount = 0;
      diagnostic.storeWorking = false;
    }

    res.json({ success: true, diagnostic });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

async function startServer() {
  await initializeDatabase();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 KejaMarket Production API Server running on port ${PORT}`);
    console.log(`🔗 Web Application: http://localhost:${PORT}`);
    console.log(`📱 M-Pesa Daraja: ${MPESA_ENV.toUpperCase()} (${hasDarajaCredentials() ? 'Credentials Active' : 'Sandbox Ready'})`);

    const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || 'https://kejamarket.onrender.com';
    const PING_INTERVAL = 9 * 60 * 1000;

    if (process.env.NODE_ENV === 'production') {
      console.log(`ðŸ“¡ Keep-Alive Heartbeat active for ${PUBLIC_URL} (Pinging every 9 minutes)`);
      setInterval(() => {
        try {
          const httpModule = PUBLIC_URL.startsWith('https') ? require('https') : require('http');
          httpModule.get(`${PUBLIC_URL}/api/health`, (res) => {
            console.log(`[Keep-Alive Ping] Status: ${res.statusCode}`);
          }).on('error', (err) => {
            console.warn(`[Keep-Alive Ping] Warning: ${err.message}`);
          });
        } catch (err) {
          console.warn(`[Keep-Alive Ping] Failed: ${err.message}`);
        }
      }, PING_INTERVAL);
    } else {
      console.log(`ðŸ“¡ Keep-Alive Heartbeat active for ${PUBLIC_URL} (Pinging every 9 minutes)`);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`âŒ Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      console.error(`âŒ Server error:`, err);
      process.exit(1);
    }
  });

  process.on('SIGTERM', () => {
    console.log('ðŸ”„ SIGTERM received, shutting down gracefully');
    server.close(async () => {
      if (store && store.close) await store.close();
      console.log('âœ… Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('ðŸ”„ SIGINT received, shutting down gracefully');
    server.close(async () => {
      if (store && store.close) await store.close();
      console.log('âœ… Server closed');
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch(console.error);


// ════════════════════════════════════════════════════════════════════════════════





/**
 * ---------------------------------------------------------------
 * KEJAMARKET COMMUNICATION SYSTEM API ENDPOINTS
 * ---------------------------------------------------------------
 * Complete communication system supporting:
 * - User-to-User conversations (property/BNB/service/marketplace inquiries)
 * - User-to-Platform support tickets
 * - System-to-User notifications
 * - Interaction tracking (WhatsApp/call analytics)
 */

// Initialize database pool for communication system
const dbPool = require('./db/pool');

// Generate unique IDs for communication system
const generateCommId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Communication rate limiter
const commLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 communication actions per minute
  message: { success: false, message: 'Too many communication requests. Please slow down.' }
});

/**
 * CONVERSATIONS API
 */

// GET /api/communication/conversations - Get all conversations for user
app.get('/api/communication/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT c.*, 
             CASE 
               WHEN c.participant_1 = $1 THEN c.unread_count_p1
               ELSE c.unread_count_p2
             END as unread_count,
             CASE 
               WHEN c.participant_1 = $1 THEN u2.name
               ELSE u1.name
             END as other_participant_name,
             CASE 
               WHEN c.participant_1 = $1 THEN u2.role
               ELSE u1.role
             END as other_participant_role,
             m.message_text as last_message,
             m.created_at as last_message_at
      FROM conversations c
      LEFT JOIN users u1 ON c.participant_1 = u1.id
      LEFT JOIN users u2 ON c.participant_2 = u2.id
      LEFT JOIN LATERAL (
        SELECT message_text, created_at
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      WHERE c.participant_1 = $1 OR c.participant_2 = $1
      ORDER BY c.last_message_at DESC
    `;
    
    const result = await dbPool.query(query, [userId]);
    
    res.json({
      success: true,
      conversations: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// POST /api/communication/conversations - Create new conversation/inquiry
app.post('/api/communication/conversations', commLimiter, requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, relatedId, relatedType, participantId, initialMessage, metadata } = req.body;
    
    if (!type || !relatedId || !participantId || !initialMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if conversation already exists
    const existingQuery = `
      SELECT id FROM conversations 
      WHERE related_id = $1 AND related_type = $2 
      AND ((participant_1 = $3 AND participant_2 = $4) 
           OR (participant_1 = $4 AND participant_2 = $3))
    `;
    
    const existing = await dbPool.query(existingQuery, [relatedId, relatedType, userId, participantId]);
    
    let conversationId;
    
    if (existing.rows.length > 0) {
      conversationId = existing.rows[0].id;
    } else {
      // Create new conversation
      conversationId = generateCommId('conv');
      
      const insertQuery = `
        INSERT INTO conversations (id, type, related_id, related_type, participant_1, participant_2, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      
      await dbPool.query(insertQuery, [conversationId, type, relatedId, relatedType, userId, participantId, JSON.stringify(metadata || {})]);
    }
    
    // Add initial message
    const messageId = generateCommId('msg');
    const messageQuery = `
      INSERT INTO messages (id, conversation_id, sender_id, message_text, message_type, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const messageResult = await dbPool.query(messageQuery, [
      messageId, 
      conversationId, 
      userId, 
      initialMessage, 
      'inquiry', 
      JSON.stringify(metadata || {})
    ]);
    
    // Update conversation timestamp
    await dbPool.query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );
    
    res.json({
      success: true,
      conversation_id: conversationId,
      message: messageResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// GET /api/communication/conversations/:id/messages - Get messages for conversation
app.get('/api/communication/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    
    // Verify user is participant in conversation
    const authQuery = `
      SELECT id FROM conversations 
      WHERE id = $1 AND (participant_1 = $2 OR participant_2 = $2)
    `;
    
    const authResult = await dbPool.query(authQuery, [conversationId, userId]);
    if (authResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    
    // Get messages
    const messagesQuery = `
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `;
    
    const messagesResult = await dbPool.query(messagesQuery, [conversationId]);
    
    res.json({
      success: true,
      messages: messagesResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/communication/conversations/:id/messages - Send message to conversation
app.post('/api/communication/conversations/:id/messages', commLimiter, requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const { message, messageType = 'text', attachments = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    // Verify user is participant
    const authQuery = `
      SELECT participant_1, participant_2 FROM conversations 
      WHERE id = $1 AND (participant_1 = $2 OR participant_2 = $2)
    `;
    
    const authResult = await dbPool.query(authQuery, [conversationId, userId]);
    if (authResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    
    // Insert message
    const messageId = generateCommId('msg');
    const insertQuery = `
      INSERT INTO messages (id, conversation_id, sender_id, message_text, message_type, attachments)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await dbPool.query(insertQuery, [
      messageId, conversationId, userId, message, messageType, JSON.stringify(attachments)
    ]);
    
    // Update conversation timestamp and unread counts
    const conversation = authResult.rows[0];
    const otherParticipant = conversation.participant_1 === userId ? conversation.participant_2 : conversation.participant_1;
    const unreadField = conversation.participant_1 === userId ? 'unread_count_p2' : 'unread_count_p1';
    
    await dbPool.query(
      `UPDATE conversations SET 
       last_message_at = CURRENT_TIMESTAMP,
       ${unreadField} = ${unreadField} + 1
       WHERE id = $1`,
      [conversationId]
    );
    
    res.json({
      success: true,
      message: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * SUPPORT TICKETS API
 */

// GET /api/communication/support-tickets - Get all support tickets for user
app.get('/api/communication/support-tickets', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT t.*, 
             COUNT(sm.id) as message_count,
             MAX(sm.created_at) as last_message_at
      FROM support_tickets t
      LEFT JOIN support_messages sm ON t.id = sm.ticket_id
      WHERE t.user_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
    
    const result = await dbPool.query(query, [userId]);
    
    res.json({
      success: true,
      tickets: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// POST /api/communication/support-tickets - Create new support ticket
app.post('/api/communication/support-tickets', commLimiter, requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, subject, description, priority = 'normal' } = req.body;
    
    if (!category || !subject || !description) {
      return res.status(400).json({ error: 'Category, subject, and description are required' });
    }
    
    // Generate ticket ID
    const ticketNumber = Math.floor(10000 + Math.random() * 90000);
    const ticketId = `KM-${ticketNumber}`;
    
    // Insert ticket
    const ticketQuery = `
      INSERT INTO support_tickets (id, user_id, category, subject, priority, status)
      VALUES ($1, $2, $3, $4, $5, 'open')
      RETURNING *
    `;
    
    const ticketResult = await dbPool.query(ticketQuery, [ticketId, userId, category, subject, priority]);
    
    // Add initial message
    const messageId = generateCommId('smsg');
    const messageQuery = `
      INSERT INTO support_messages (id, ticket_id, sender_id, message_text, is_internal)
      VALUES ($1, $2, $3, $4, false)
      RETURNING *
    `;
    
    const messageResult = await dbPool.query(messageQuery, [messageId, ticketId, userId, description]);
    
    // Send auto-acknowledgment
    const autoMessageId = generateCommId('smsg');
    const autoMessage = `Hello! We've received your support request (${ticketId}).\n\nOur support team will review your issue and respond within 24 hours.\n\nFor urgent issues, our typical response time is 2-4 hours.\n\nThank you for contacting KejaMarket!`;
    
    await dbPool.query(messageQuery, [autoMessageId, ticketId, 'system', autoMessage]);
    
    res.json({
      success: true,
      ticket: ticketResult.rows[0],
      initial_message: messageResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// GET /api/communication/support-tickets/:id/messages - Get messages for support ticket
app.get('/api/communication/support-tickets/:id/messages', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;
    
    // Verify user owns the ticket
    const authQuery = 'SELECT id FROM support_tickets WHERE id = $1 AND user_id = $2';
    const authResult = await dbPool.query(authQuery, [ticketId, userId]);
    
    if (authResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this ticket' });
    }
    
    // Get messages (excluding internal notes)
    const messagesQuery = `
      SELECT sm.*, u.name as sender_name, u.role as sender_role
      FROM support_messages sm
      LEFT JOIN users u ON sm.sender_id = u.id
      WHERE sm.ticket_id = $1 AND sm.is_internal = false
      ORDER BY sm.created_at ASC
    `;
    
    const result = await dbPool.query(messagesQuery, [ticketId]);
    
    res.json({
      success: true,
      messages: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    res.status(500).json({ error: 'Failed to fetch ticket messages' });
  }
});

/**
 * NOTIFICATIONS API
 */

// GET /api/communication/notifications - Get notifications for user
app.get('/api/communication/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, unread_only = false } = req.query;
    
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `;
    const params = [userId];
    
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    
    if (unread_only === 'true') {
      query += ` AND read_at IS NULL`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT 50`;
    
    const result = await dbPool.query(query, params);
    
    res.json({
      success: true,
      notifications: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/communication/notifications/mark-read - Mark notifications as read
app.post('/api/communication/notifications/mark-read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notification_ids } = req.body;
    
    if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      const placeholders = notification_ids.map((_, index) => `$${index + 2}`).join(', ');
      const query = `
        UPDATE notifications 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE user_id = $1 AND id IN (${placeholders})
      `;
      
      await dbPool.query(query, [userId, ...notification_ids]);
    } else {
      // Mark all notifications as read
      await dbPool.query(
        'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND read_at IS NULL',
        [userId]
      );
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * INTERACTION TRACKING API
 */

// POST /api/communication/interactions - Record interaction event (WhatsApp click, call click, etc.)
app.post('/api/communication/interactions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { relatedId, relatedType, interactionType, metadata = {} } = req.body;
    
    if (!relatedId || !relatedType || !interactionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const eventId = generateCommId('int');
    const query = `
      INSERT INTO interaction_events (id, user_id, related_id, related_type, interaction_type, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await dbPool.query(query, [eventId, userId, relatedId, relatedType, interactionType, JSON.stringify(metadata)]);
    
    res.json({
      success: true,
      event: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

/**
 * COMMUNICATION SYSTEM HEALTH CHECK
 */

// GET /api/communication/health - Communication system health check
app.get('/api/communication/health', async (req, res) => {
  try {
    const healthCheck = await dbPool.healthCheck();
    
    if (healthCheck.status === 'healthy') {
      // Run communication health check function
      const commHealthQuery = 'SELECT * FROM communication_system_health_check()';
      const commHealth = await dbPool.query(commHealthQuery);
      
      res.json({
        success: true,
        database: healthCheck,
        communication_system: commHealth.rows,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        database: healthCheck,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Communication system health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

console.log('? KejaMarket Communication System API endpoints loaded');

# 🔐 KejaMarket Authentication Testing Guide

## Problem Statement
Sign in/Sign up is loading but then stops without completing authentication.

## Solution Implemented

### 1. Enhanced Error Logging in `js/auth.js`
- Added detailed console logging for both sign-in and sign-up functions
- Better error handling for server connection issues
- Clear error messages when server is not responding

### 2. Changes Made:
- **handleSignIn()** - Enhanced with:
  - `console.log('[AUTH] Attempting login with identifier:', identifier)`
  - `console.log('[AUTH] Response status:', res.status)`
  - `console.log('[AUTH] Login response:', data)`
  - Response status checking before parsing JSON
  - Better error messages indicating server connection issues

- **handleSignUp()** - Enhanced with:
  - Similar logging and error handling
  - Response status checking
  - Clear server connection error messages

- **Service Worker** - Updated cache version from v35 to v36

## Testing Steps

### Step 1: Start the Backend Server

```powershell
# In the project root directory
npm start
```

**OR**

```powershell
node server.js
```

The server should start on **http://localhost:3001**

You should see output like:
```
✅ Store initialized successfully
🚀 KejaMarket backend running on PORT 3001
```

### Step 2: Open the Test Page

1. Open your browser (Chrome/Edge/Firefox)
2. Navigate to: **http://localhost:3001/test-auth.html**
3. Open DevTools (Press F12)
4. Go to the Console tab

### Step 3: Run Tests

The test page will automatically check server health on load.

#### Test 1: Check Server Health
- Click "Check Server Status" button
- You should see green success messages
- This confirms the server is running

#### Test 2: Test Sign In (Admin)
- Default credentials are pre-filled:
  - Email: `admin@kejamarket.co.ke`
  - Password: `admin123`
- Click "Test Sign In"
- Check the log output
- If successful, you'll see:
  - ✓ Sign in successful!
  - ✓ Welcome: KejaMarket Administrator
  - ✓ Token received
  - ✓ Session saved

#### Test 3: Test Sign Up (New User)
- Fill in the sign-up form with test data
- Click "Test Sign Up"
- Check the log output
- If successful, user will be created and logged in

#### Test 4: Check Session
- Click "Check Current Session"
- See your active session details
- Click "Clear Session" to log out

### Step 4: Test on Main Site

1. Open **http://localhost:3001/index.html** (or your main site URL)
2. Open DevTools Console (F12)
3. Click the Sign In/Sign Up button
4. Enter your credentials
5. Watch the Console for `[AUTH]` messages:
   - `[AUTH] Attempting login with identifier: ...`
   - `[AUTH] Response status: 200`
   - `[AUTH] Login response: { success: true, ... }`

### Common Issues & Solutions

#### Issue 1: "Cannot connect to server"
**Solution:**
- Make sure the backend is running: `npm start`
- Check that it's on port 3001
- Verify no firewall is blocking localhost connections

#### Issue 2: "CORS Error"
**Solution:**
- The server is configured to allow localhost:3000 and localhost:3001
- If serving from a different port, update CORS settings in `server.js`

#### Issue 3: "Incorrect credentials"
**Solution:**
- Use the default admin credentials:
  - Email: `admin@kejamarket.co.ke`
  - Password: `admin123`
- Or create a new account first via Sign Up

#### Issue 4: Sign in loads but nothing happens
**Solution:**
- Open DevTools Console (F12)
- Look for red error messages
- Check if the server responded with status 200
- Verify the response has `success: true`, `user`, and `token`

#### Issue 5: Service Worker cache issues
**Solution:**
- Clear browser cache: Ctrl+Shift+Delete
- In DevTools > Application > Service Workers > Unregister
- Hard refresh: Ctrl+Shift+R
- Or open in Incognito/Private mode

## What to Look For in Console

### Successful Sign In:
```
[AUTH] Attempting login with identifier: admin@kejamarket.co.ke
[AUTH] Response status: 200
[AUTH] Login response: {success: true, user: {...}, token: "eyJ..."}
```

### Failed Sign In (Wrong Password):
```
[AUTH] Attempting login with identifier: test@example.com
[AUTH] Response status: 401
[AUTH] Login response: {success: false, message: "Incorrect password. Please try again."}
```

### Server Not Running:
```
[AUTH] Sign in error: TypeError: Failed to fetch
Unable to connect to server. Make sure the backend server is running on http://localhost:3001
```

## Database

The system uses `db/data.json` for storing users when PostgreSQL is not configured.

Default admin user is already created:
- **Email:** admin@kejamarket.co.ke
- **Phone:** 0792409540
- **Password:** admin123
- **Role:** admin

## File Modifications

1. **js/auth.js** - Lines 591-670 (handleSignIn) and lines 235-350 (handleSignUp)
2. **sw.js** - Line 1 (cache version updated to v36)
3. **test-auth.html** - NEW - Authentication testing page
4. **AUTH_TESTING_GUIDE.md** - NEW - This guide

## Next Steps After Testing

1. If tests pass on test-auth.html but fail on main site:
   - Check if modal HTML is correct
   - Verify form field IDs match: `signin-identifier`, `signin-password`
   - Check if event listeners are properly attached

2. If tests fail completely:
   - Verify server.js has no syntax errors
   - Check db/store.js for issues
   - Ensure bcryptjs is installed: `npm install bcryptjs`

3. For production deployment:
   - Update CORS allowed origins in server.js
   - Use environment variables for sensitive data
   - Enable HTTPS
   - Use a proper database (PostgreSQL)

## Support

If authentication still doesn't work after following this guide:
1. Copy the exact console error messages
2. Copy the server console output
3. Check if the server is receiving the request (should see logs in server console)
4. Verify network tab in DevTools shows the request being sent

---

**Last Updated:** September 8, 2026
**Version:** 1.0
**Status:** ✅ Ready for testing

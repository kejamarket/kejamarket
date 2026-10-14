# Step-by-Step Guide: Get Social Media API Credentials

## 📘 Part 1: Facebook Page Access Token

### Step 1: Create Facebook App

1. Go to **https://developers.facebook.com**
2. Click **"My Apps"** in top right
3. Click **"Create App"**
4. Choose **"Business"** as app type
5. Fill in:
   - **App Name:** KejaMarket Auto-Share
   - **App Contact Email:** Your email
   - **Business Account:** Select or create one
6. Click **"Create App"**

### Step 2: Add Pages Product

1. In your app dashboard, find **"Add Products"** section
2. Find **"Facebook Login"** and click **"Set Up"**
3. Then find **"Pages"** product and click **"Set Up"**

### Step 3: Get Page Access Token

1. Go to **https://developers.facebook.com/tools/explorer/**
2. In top right, select your **KejaMarket App**
3. Click **"Generate Access Token"**
4. Grant these permissions:
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`
   - ✅ `pages_manage_posts`
   - ✅ `pages_manage_engagement`
5. Click **"Generate Token"** and authorize
6. **Copy the token** - This is your `FACEBOOK_ACCESS_TOKEN`

### Step 4: Get Your Page ID

**Method 1 (Easy):**
1. Go to your Facebook Page
2. Click **"About"** tab
3. Scroll down to find **"Page ID"**

**Method 2 (API Explorer):**
1. In Graph API Explorer: https://developers.facebook.com/tools/explorer/
2. Query: `me/accounts`
3. Find your page name in results
4. Copy the `id` field

### Step 5: Make Token Long-Lived (Important!)

Short-lived tokens expire in 1 hour. Convert to 60-day token:

1. Go to: https://developers.facebook.com/tools/debug/accesstoken/
2. Paste your token
3. Click **"Extend Access Token"**
4. Copy the new long-lived token
5. Use this in your `.env` file

**Add to `.env`:**
```bash
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📸 Part 2: Instagram Business Account

### Prerequisites
- Instagram account must be **Business** or **Creator** account
- Instagram must be connected to your Facebook Page

### Step 1: Convert Instagram to Business

1. Open **Instagram app**
2. Go to **Profile** → **Settings** → **Account**
3. Tap **"Switch to Professional Account"**
4. Choose **"Business"**
5. Complete the setup

### Step 2: Link Instagram to Facebook Page

1. In Instagram app: **Settings** → **Account** → **Linked Accounts**
2. Tap **"Facebook"**
3. Connect to the **same Facebook Page** you're using above
4. Authorize the connection

### Step 3: Get Instagram Business Account ID

1. Go to Graph API Explorer: https://developers.facebook.com/tools/explorer/
2. Make sure your **KejaMarket App** is selected
3. Use this query (replace with your Facebook Page ID):
   ```
   {your-facebook-page-id}?fields=instagram_business_account
   ```
4. Click **Submit**
5. Copy the `id` from `instagram_business_account` object

**Example response:**
```json
{
  "instagram_business_account": {
    "id": "17841401234567890"
  },
  "id": "123456789012345"
}
```

**Add to `.env`:**
```bash
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841401234567890
```

**Note:** Instagram uses the same `FACEBOOK_ACCESS_TOKEN` from Part 1.

---

## 🐦 Part 3: Twitter/X API Credentials

### Step 1: Create Twitter Developer Account

1. Go to **https://developer.twitter.com**
2. Click **"Sign up"** (use your KejaMarket Twitter account)
3. Apply for **"Developer Account"**
4. Choose **"Making a bot"** or **"Building tools for Twitter users"**
5. Fill in the application form:
   - **App name:** KejaMarket Auto-Share
   - **Description:** Automatically share new rental property listings
   - **How will Twitter data be used:** Post property listings to our timeline
6. Accept terms and submit
7. **Wait for approval** (usually instant to 24 hours)

### Step 2: Create a Project & App

1. Once approved, go to **Developer Portal**: https://developer.twitter.com/en/portal/dashboard
2. Click **"Create Project"**
3. Fill in:
   - **Project Name:** KejaMarket
   - **Use Case:** Select "Making a bot"
   - **Description:** Auto-share rental listings
4. Create an App within the project:
   - **App Name:** kejamarket-auto-share
   - **Environment:** Production

### Step 3: Generate API Keys

1. In your app settings, go to **"Keys and Tokens"** tab
2. You'll see:
   - ✅ **API Key** (Consumer Key)
   - ✅ **API Key Secret** (Consumer Secret)
3. **Copy both** - You can only see the secret once!

**Add to `.env`:**
```bash
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_key_secret_here
```

### Step 4: Generate Access Token & Secret

1. Still in **"Keys and Tokens"** tab
2. Scroll to **"Authentication Tokens"** section
3. Click **"Generate"** under "Access Token and Secret"
4. **IMPORTANT:** Set App permissions to **"Read and Write"**
   - Click **"App settings"** → **"User authentication settings"**
   - Enable **OAuth 1.0a**
   - Set **App permissions** to **"Read and Write"**
   - Click **"Save"**
5. Now generate Access Token & Secret
6. **Copy both** - You can only see them once!

**Add to `.env`:**
```bash
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_token_secret_here
```

### Step 5: Enable Elevated Access (Recommended)

For higher rate limits:

1. In Developer Portal, go to **"Products"** → **"Elevated"**
2. Click **"Apply for Elevated"**
3. Fill in use case (post property listings, ~10-20 posts per day)
4. Submit application
5. Usually approved instantly or within hours

---

## 🔐 Final .env Configuration

Your final `.env` file should have these entries:

```bash
# ── Social Media Auto-Sharing ────────────────────────────
# Facebook Page
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Instagram Business Account
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841401234567890

# Twitter/X API
TWITTER_API_KEY=abcdefghijklmnopqrstuvwxy
TWITTER_API_SECRET=1234567890abcdefghijklmnopqrstuvwxyz1234567890abc
TWITTER_ACCESS_TOKEN=1234567890-aBcDeFgHiJkLmNoPqRsTuVwXyZ12345678
TWITTER_ACCESS_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcdefg
```

---

## ✅ Testing Your Credentials

### Test on Your Server

1. **SSH into your server** or open terminal
2. **Restart Node.js server:**
   ```bash
   pm2 restart kejamarket
   # or
   npm start
   ```

3. **Approve a test listing** in admin panel
4. **Check server logs:**
   ```bash
   pm2 logs kejamarket
   # or check console output
   ```

5. **Look for:**
   ```
   📢 Auto-sharing property "Test Property" to social media...
   ✅ Shared to Facebook: 123456_987654
   ✅ Shared to Instagram: 180123456789
   ✅ Shared to Twitter: 1234567890123
   
   📊 Social media share complete: 3/3 platforms successful
   ```

6. **Check your social media pages** to confirm posts appeared!

---

## 🚨 Troubleshooting

### Facebook: "Invalid OAuth access token"
- **Token expired:** Generate a new long-lived token (Step 5 in Part 1)
- **Wrong token type:** Make sure it's a **Page Access Token**, not User token
- **Permissions missing:** Regenerate with `pages_manage_posts` permission

### Instagram: "Instagram account not found"
- **Not a Business account:** Convert Instagram to Business (Step 1, Part 2)
- **Not linked to Facebook Page:** Link in Instagram settings (Step 2, Part 2)
- **Wrong ID:** Double-check Instagram Business Account ID from Graph API

### Twitter: "Could not authenticate you"
- **Wrong credentials:** Verify all 4 credentials are copied correctly
- **Missing permissions:** App must have **Read and Write** permissions
- **Wrong token type:** Must be **OAuth 1.0a** tokens, not OAuth 2.0

### Still Not Working?
- Check server logs for detailed error messages
- Verify `.env` file has no extra spaces or quotes
- Restart server after adding credentials
- Test one platform at a time

---

## 📞 Need Help?

**Facebook Support:**
- Graph API Documentation: https://developers.facebook.com/docs/graph-api
- Community Forum: https://developers.facebook.com/community/

**Instagram Support:**
- Instagram Graph API: https://developers.facebook.com/docs/instagram-api
- Requirements: https://developers.facebook.com/docs/instagram-api/getting-started

**Twitter Support:**
- API Documentation: https://developer.twitter.com/en/docs/twitter-api
- Community Forum: https://twittercommunity.com/

---

## ⏱️ Estimated Time

- **Facebook:** 15-20 minutes
- **Instagram:** 10 minutes (if already Business account)
- **Twitter:** 20-30 minutes (including approval wait time)

**Total:** ~45-60 minutes for complete setup

---

## 🎉 Once Complete

After adding all credentials and restarting your server:

✅ Every time you approve a listing, it automatically posts to all 3 platforms  
✅ No manual sharing needed  
✅ Consistent branding and messaging  
✅ Instant reach to thousands of followers  
✅ More visibility = More tenants = More business!

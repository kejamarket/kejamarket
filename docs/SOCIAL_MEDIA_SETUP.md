# Social Media Auto-Sharing Integration

## Overview
KejaMarket automatically shares approved property listings to Facebook, Instagram, and Twitter when an admin approves them. This happens in the **backend** (server-side), not the frontend.

## How It Works

1. **Landlord creates listing** → Status: `pending`
2. **Admin approves listing** → Triggers social media auto-share
3. **Backend automatically posts** to Facebook, Instagram & Twitter
4. **Landlord receives SMS** confirmation that listing is live

## Setup Instructions

### 1. Facebook Page Setup

**Get Facebook Page Access Token:**

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new Facebook App (Business type)
3. Add **"Pages"** product to your app
4. Generate a **Page Access Token** with these permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
5. Get your **Page ID** from your Facebook Page settings

**Add to .env file:**
```bash
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=your_long_facebook_page_access_token_here
```

---

### 2. Instagram Business Account Setup

**Requirements:**
- Instagram account must be converted to **Business Account**
- Instagram must be linked to a **Facebook Page**

**Get Instagram Business Account ID:**

1. Your Instagram account must be linked to the Facebook Page above
2. Use Facebook Graph API Explorer: `https://developers.facebook.com/tools/explorer/`
3. Query: `{your-facebook-page-id}?fields=instagram_business_account`
4. Copy the Instagram Business Account ID

**Add to .env file:**
```bash
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841401234567890
```

**Note:** Instagram uses the same `FACEBOOK_ACCESS_TOKEN` from above.

---

### 3. Twitter/X API Setup

**Get Twitter API Credentials:**

1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create a new **Twitter App**
3. Generate **API Keys and Tokens** with **Read & Write** permissions
4. You need 4 credentials:
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
   - Access Token
   - Access Token Secret

**Add to .env file:**
```bash
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
TWITTER_ACCESS_TOKEN=your_twitter_access_token_here
TWITTER_ACCESS_SECRET=your_twitter_access_token_secret_here
```

---

## Post Format

When a listing is approved, the system automatically creates posts like this:

```
🏠 NEW LISTING: Cozy Studio BNB - Kilimani

📍 Location: Kilimani
💰 Rent: KSh 2,500/month
🏘️ Type: Bnb (Short Stay)
🛏️ 1 bed, 1 bath

View full details & book viewing:
👉 https://kejamarket.co.ke/property/prop_123456

#KejaMarket #NairobiRentals #KenyanHomes #PropertyForRent #Kilimani
```

**For Instagram:** Includes the first property photo
**For Twitter:** Truncated to 280 characters if needed

---

## Testing

### Test Individual Platforms

```javascript
// In Node.js console or test script
const { shareToFacebook, shareToInstagram, shareToTwitter } = require('./utils/social-media-share');

const testProperty = {
  id: 'prop_123',
  title: 'Test Property',
  rentKes: 25000,
  category: 'Bedsitter',
  estateSuburb: 'Kilimani',
  county: 'Nairobi',
  beds: 1,
  baths: 1,
  photos: ['https://example.com/photo.jpg']
};

// Test Facebook
shareToFacebook(testProperty).then(console.log);

// Test Instagram
shareToInstagram(testProperty).then(console.log);

// Test Twitter
shareToTwitter(testProperty).then(console.log);
```

### Check Logs

When a listing is approved, you'll see console logs like:

```
📢 Auto-sharing property "Cozy Studio BNB - Kilimani" to social media...
✅ Shared to Facebook: 123456789_987654321
✅ Shared to Instagram: 18012345678901234
✅ Shared to Twitter: 1234567890123456789

📊 Social media share complete: 3/3 platforms successful
```

---

## Troubleshooting

### Facebook Not Posting
- **Check token expiry:** Page Access Tokens expire. Generate a long-lived token (60 days) or set up automatic token refresh
- **Check permissions:** Ensure `pages_manage_posts` permission is granted
- **Check Page ownership:** Your app must have access to manage the Page

### Instagram Not Posting
- **"No image available":** Instagram requires at least one photo. Ensure `photos` array is not empty
- **Business account not found:** Verify Instagram account is converted to Business and linked to Facebook Page
- **API rate limits:** Instagram has strict rate limits (25 posts per day)

### Twitter Not Posting
- **Authentication error:** Verify all 4 credentials are correct (API Key, Secret, Access Token, Access Secret)
- **Write permissions:** App must have Read & Write permissions enabled
- **Character limit:** Twitter has 280 character limit (automatically truncated)

### Credentials Missing
If credentials are not configured, the system will skip that platform gracefully:
```
⚠️  Facebook credentials not configured. Skipping Facebook share.
⚠️  Instagram credentials not configured. Skipping Instagram share.
⚠️  Twitter credentials not configured. Skipping Twitter share.
```

---

## Production Recommendations

1. **Use Long-Lived Tokens:** Facebook Page Access Tokens should be long-lived (60 days+)
2. **Monitor Rate Limits:** Each platform has posting limits:
   - Facebook: ~200 posts/hour
   - Instagram: 25 posts/day (Business accounts)
   - Twitter: 300 tweets/3 hours
3. **Error Logging:** Monitor server logs for failed posts
4. **Retry Logic:** Consider implementing retry logic for temporary failures
5. **Photo Optimization:** Ensure property photos are high quality (min 1200x630px for Facebook)

---

## Files Modified

- `utils/social-media-share.js` - Social media sharing module (NEW)
- `server.js` - Added auto-share call to approval endpoint
- `.env.example` - Added social media credential templates

---

## Support

For API documentation:
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)

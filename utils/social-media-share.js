/**
 * Social Media Auto-Sharing Module
 * Automatically shares new property listings to Facebook, Instagram, and Twitter
 * when they are approved by admin
 */

const fetch = require('node-fetch');

// Social media credentials from environment variables
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID || '';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '';
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || '';
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || '';
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET || '';

/**
 * Format property data into social media post content
 */
function formatPropertyPost(property) {
  const { title, rentKes, category, estateSuburb, area, county, beds, baths, photos, id } = property;
  
  const location = estateSuburb || area || county || 'Nairobi';
  const bedroomInfo = beds ? `${beds} bed${beds > 1 ? 's' : ''}` : '';
  const bathroomInfo = baths ? `${baths} bath${baths > 1 ? 's' : ''}` : '';
  const roomInfo = [bedroomInfo, bathroomInfo].filter(Boolean).join(', ');
  
  const postText = `🏠 NEW LISTING: ${title}

📍 Location: ${location}
💰 Rent: KSh ${rentKes?.toLocaleString() || 'N/A'}/month
🏘️ Type: ${category || 'Rental'}
${roomInfo ? `🛏️ ${roomInfo}` : ''}

View full details & book viewing:
👉 https://kejamarket.co.ke/property/${id}

#KejaMarket #NairobiRentals #KenyanHomes #PropertyForRent #${location.replace(/\s+/g, '')}`;

  return {
    text: postText,
    imageUrl: photos && photos.length > 0 ? photos[0] : null,
    link: `https://kejamarket.co.ke/property/${id}`
  };
}

/**
 * Share to Facebook Page
 */
async function shareToFacebook(property) {
  if (!FACEBOOK_PAGE_ID || !FACEBOOK_ACCESS_TOKEN) {
    console.log('⚠️  Facebook credentials not configured. Skipping Facebook share.');
    return { success: false, platform: 'facebook', reason: 'credentials_missing' };
  }

  try {
    const postContent = formatPropertyPost(property);
    const url = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`;
    
    const body = {
      message: postContent.text,
      link: postContent.link,
      access_token: FACEBOOK_ACCESS_TOKEN
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (data.id) {
      console.log('✅ Shared to Facebook:', data.id);
      return { success: true, platform: 'facebook', postId: data.id };
    } else {
      console.error('❌ Facebook share failed:', data.error);
      return { success: false, platform: 'facebook', error: data.error };
    }
  } catch (error) {
    console.error('❌ Facebook share error:', error.message);
    return { success: false, platform: 'facebook', error: error.message };
  }
}

/**
 * Share to Instagram Business Account
 * Note: Instagram Graph API requires 2-step process: create container, then publish
 */
async function shareToInstagram(property) {
  if (!INSTAGRAM_BUSINESS_ACCOUNT_ID || !FACEBOOK_ACCESS_TOKEN) {
    console.log('⚠️  Instagram credentials not configured. Skipping Instagram share.');
    return { success: false, platform: 'instagram', reason: 'credentials_missing' };
  }

  try {
    const postContent = formatPropertyPost(property);
    
    if (!postContent.imageUrl) {
      console.log('⚠️  No image available for Instagram post. Skipping.');
      return { success: false, platform: 'instagram', reason: 'no_image' };
    }

    // Step 1: Create media container
    const createUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`;
    const createBody = {
      image_url: postContent.imageUrl,
      caption: postContent.text,
      access_token: FACEBOOK_ACCESS_TOKEN
    };

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createBody)
    });

    const createData = await createResponse.json();
    
    if (!createData.id) {
      console.error('❌ Instagram container creation failed:', createData.error);
      return { success: false, platform: 'instagram', error: createData.error };
    }

    // Step 2: Publish the container
    const publishUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`;
    const publishBody = {
      creation_id: createData.id,
      access_token: FACEBOOK_ACCESS_TOKEN
    };

    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishBody)
    });

    const publishData = await publishResponse.json();
    
    if (publishData.id) {
      console.log('✅ Shared to Instagram:', publishData.id);
      return { success: true, platform: 'instagram', postId: publishData.id };
    } else {
      console.error('❌ Instagram publish failed:', publishData.error);
      return { success: false, platform: 'instagram', error: publishData.error };
    }
  } catch (error) {
    console.error('❌ Instagram share error:', error.message);
    return { success: false, platform: 'instagram', error: error.message };
  }
}

/**
 * Share to Twitter/X
 * Uses Twitter API v2
 */
async function shareToTwitter(property) {
  if (!TWITTER_API_KEY || !TWITTER_ACCESS_TOKEN) {
    console.log('⚠️  Twitter credentials not configured. Skipping Twitter share.');
    return { success: false, platform: 'twitter', reason: 'credentials_missing' };
  }

  try {
    const postContent = formatPropertyPost(property);
    
    // Twitter has 280 character limit, so truncate if needed
    let tweetText = postContent.text;
    if (tweetText.length > 270) {
      tweetText = tweetText.substring(0, 267) + '...';
    }

    // OAuth 1.0a authentication for Twitter
    const crypto = require('crypto');
    const url = 'https://api.twitter.com/2/tweets';
    
    const oauth = {
      oauth_consumer_key: TWITTER_API_KEY,
      oauth_token: TWITTER_ACCESS_TOKEN,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_version: '1.0'
    };

    // Generate OAuth signature
    const signingKey = `${encodeURIComponent(TWITTER_API_SECRET)}&${encodeURIComponent(TWITTER_ACCESS_SECRET)}`;
    const parameterString = Object.keys(oauth)
      .sort()
      .map(key => `${key}=${encodeURIComponent(oauth[key])}`)
      .join('&');
    const signatureBaseString = `POST&${encodeURIComponent(url)}&${encodeURIComponent(parameterString)}`;
    const signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
    oauth.oauth_signature = signature;

    // Build Authorization header
    const authHeader = 'OAuth ' + Object.keys(oauth)
      .map(key => `${key}="${encodeURIComponent(oauth[key])}"`)
      .join(', ');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: tweetText })
    });

    const data = await response.json();
    
    if (data.data && data.data.id) {
      console.log('✅ Shared to Twitter:', data.data.id);
      return { success: true, platform: 'twitter', postId: data.data.id };
    } else {
      console.error('❌ Twitter share failed:', data.errors || data);
      return { success: false, platform: 'twitter', error: data.errors || data };
    }
  } catch (error) {
    console.error('❌ Twitter share error:', error.message);
    return { success: false, platform: 'twitter', error: error.message };
  }
}

/**
 * Share property to all configured social media platforms
 * @param {Object} property - The property object to share
 * @returns {Promise<Object>} Results from all platforms
 */
async function sharePropertyToSocialMedia(property) {
  console.log(`\n📢 Auto-sharing property "${property.title}" to social media...`);
  
  const results = await Promise.allSettled([
    shareToFacebook(property),
    shareToInstagram(property),
    shareToTwitter(property)
  ]);

  const summary = {
    propertyId: property.id,
    propertyTitle: property.title,
    timestamp: new Date().toISOString(),
    platforms: {
      facebook: results[0].status === 'fulfilled' ? results[0].value : { success: false, error: results[0].reason },
      instagram: results[1].status === 'fulfilled' ? results[1].value : { success: false, error: results[1].reason },
      twitter: results[2].status === 'fulfilled' ? results[2].value : { success: false, error: results[2].reason }
    }
  };

  const successCount = Object.values(summary.platforms).filter(p => p.success).length;
  console.log(`\n📊 Social media share complete: ${successCount}/3 platforms successful\n`);

  return summary;
}

module.exports = {
  sharePropertyToSocialMedia,
  shareToFacebook,
  shareToInstagram,
  shareToTwitter,
  formatPropertyPost
};

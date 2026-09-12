/**
 * KejaMarket Image Upload Service
 * Uses Cloudinary for CDN image storage
 * Falls back to base64 if Cloudinary not configured
 */

const cloudinary = require('cloudinary').v2;

let cloudinaryConfigured = false;

function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.log('☁️  Cloudinary: Not configured (images will use base64 fallback)');
    return false;
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  cloudinaryConfigured = true;
  console.log(`☁️  Cloudinary initialized (cloud: ${cloudName})`);
  return true;
}

/**
 * Upload a base64 image string or buffer to Cloudinary
 * Returns the secure CDN URL
 */
async function uploadImage(imageData, folder = 'kejamarket/properties') {
  // If not configured, return the base64 data as-is (fallback)
  if (!cloudinaryConfigured) {
    return { success: true, url: imageData, cdn: false };
  }

  try {
    // imageData can be a base64 string like "data:image/jpeg;base64,..."
    const result = await cloudinary.uploader.upload(imageData, {
      folder,
      transformation: [
        { width: 1200, height: 900, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      resource_type: 'image'
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      cdn: true
    };
  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    // Fall back to base64 if upload fails
    return { success: true, url: imageData, cdn: false, error: err.message };
  }
}

/**
 * Upload multiple images, return array of CDN URLs
 */
async function uploadMultipleImages(images, folder = 'kejamarket/properties') {
  if (!images || images.length === 0) return [];

  const results = await Promise.all(
    images.map(img => uploadImage(img, folder))
  );

  return results.map(r => r.url);
}

/**
 * Delete an image from Cloudinary by public ID
 */
async function deleteImage(publicId) {
  if (!cloudinaryConfigured || !publicId) return false;
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
    return false;
  }
}

module.exports = {
  initCloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  isConfigured: () => cloudinaryConfigured
};

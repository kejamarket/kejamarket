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

const fs = require('fs');
const path = require('path');

/**
 * Upload a video to Cloudinary with kejamarket.co.ke watermark overlay
 * Falls back to local disk storage if Cloudinary is not configured or fails
 */
async function uploadVideo(videoData, folder = 'kejamarket/videos') {
  if (cloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(videoData, {
        folder,
        resource_type: 'video',
        transformation: [
          { width: 1280, height: 720, crop: 'limit' },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 26,
              font_weight: 'bold',
              text: 'kejamarket.co.ke'
            },
            gravity: 'south_east',
            x: 20,
            y: 20,
            opacity: 80
          }
        ]
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        cdn: true
      };
    } catch (err) {
      console.warn('Cloudinary video upload with watermark failed, attempting simple upload:', err.message);
      try {
        const resultSimple = await cloudinary.uploader.upload(videoData, {
          folder,
          resource_type: 'video'
        });
        return {
          success: true,
          url: resultSimple.secure_url,
          publicId: resultSimple.public_id,
          duration: resultSimple.duration,
          cdn: true
        };
      } catch (err2) {
        console.error('Cloudinary video upload completely failed:', err2.message);
      }
    }
  }

  // Local disk storage fallback for base64 video data URIs
  try {
    if (typeof videoData === 'string' && videoData.startsWith('data:video/')) {
      const matches = videoData.match(/^data:video\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (matches) {
        let ext = matches[1].toLowerCase();
        if (ext === 'quicktime') ext = 'mov';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'videos');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);
        console.log(`🎥 Video saved locally to /uploads/videos/${filename} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
        return {
          success: true,
          url: `/uploads/videos/${filename}`,
          cdn: false
        };
      }
    }
  } catch (fsErr) {
    console.error('Local video save error:', fsErr.message);
  }

  return { success: true, url: videoData, cdn: false };
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
  uploadVideo,
  deleteImage,
  isConfigured: () => cloudinaryConfigured
};

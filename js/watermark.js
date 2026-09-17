/**
 * KejaMarket Watermark Engine (v1.0)
 * Applies "kejamarket.co.ke" watermark to all uploaded photos and videos
 * Ensures that if photos or videos are copied, shared, or taken, the watermark persists.
 */

(function () {
  'use strict';

  const WATERMARK_TEXT = 'kejamarket.co.ke';

  const KejaWatermark = {
    text: WATERMARK_TEXT,

    /**
     * Applies watermark to an image (DataURL, File, Blob, or HTMLImageElement)
     * Returns a Promise resolving to a high-quality watermarked JPEG DataURL
     *
     * @param {string|File|Blob|HTMLImageElement} source
     * @param {Object} [options]
     * @returns {Promise<string>}
     */
    applyWatermarkToImage: function (source, options = {}) {
      return new Promise((resolve, reject) => {
        const text = options.text || WATERMARK_TEXT;

        const processImage = (img) => {
          try {
            const canvas = document.createElement('canvas');
            const w = img.naturalWidth || img.width || 800;
            const h = img.naturalHeight || img.height || 600;

            // Cap dimensions if abnormally huge to prevent mobile browser crash
            const maxDimension = 2400;
            let targetW = w;
            let targetH = h;
            if (targetW > maxDimension || targetH > maxDimension) {
              if (targetW > targetH) {
                targetH = Math.round((targetH * maxDimension) / targetW);
                targetW = maxDimension;
              } else {
                targetW = Math.round((targetW * maxDimension) / targetH);
                targetH = maxDimension;
              }
            }

            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              resolve(typeof source === 'string' ? source : img.src);
              return;
            }

            // Draw base image
            ctx.drawImage(img, 0, 0, targetW, targetH);

            // =========================================================
            // 1. Center Diagonal Watermark (Protects against cropping)
            // =========================================================
            ctx.save();
            const centerFontSize = Math.max(22, Math.round(targetW * 0.046));
            ctx.font = `bold ${centerFontSize}px 'Montserrat', 'Inter', -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.translate(targetW / 2, targetH / 2);
            ctx.rotate(-22 * Math.PI / 180);

            // Shadow outline
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.lineWidth = Math.max(2, Math.round(centerFontSize * 0.08));
            ctx.strokeText(text, 0, 0);

            // Main semi-transparent fill
            ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.fillText(text, 0, 0);
            ctx.restore();

            // =========================================================
            // 2. Solid Bottom-Right Branding Pill
            // =========================================================
            ctx.save();
            const badgeFontSize = Math.max(14, Math.round(targetW * 0.026));
            ctx.font = `bold ${badgeFontSize}px 'Montserrat', 'Inter', -apple-system, sans-serif`;

            const badgeText = text;
            const textMetrics = ctx.measureText(badgeText);
            const paddingX = badgeFontSize * 0.9;
            const paddingY = badgeFontSize * 0.45;
            const dotRadius = badgeFontSize * 0.28;
            const dotSpace = badgeFontSize * 1.1;

            const pillWidth = textMetrics.width + paddingX * 2 + dotSpace;
            const pillHeight = badgeFontSize + paddingY * 2;
            const marginX = Math.round(targetW * 0.025);
            const marginY = Math.round(targetH * 0.03);
            const pillX = targetW - pillWidth - marginX;
            const pillY = targetH - pillHeight - marginY;
            const radius = pillHeight / 2;

            // Draw pill shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;

            // Draw pill background
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(pillX, pillY, pillWidth, pillHeight, radius);
            } else {
              ctx.rect(pillX, pillY, pillWidth, pillHeight);
            }
            ctx.fill();

            // Pill border (reset shadow)
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = 'rgba(0, 181, 63, 0.85)';
            ctx.lineWidth = Math.max(1.5, Math.round(badgeFontSize * 0.08));
            ctx.stroke();

            // Green brand dot
            const dotX = pillX + paddingX + dotRadius;
            const dotY = pillY + pillHeight / 2;
            ctx.fillStyle = '#00b53f';
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            // Brand Text in Pill
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, dotX + dotRadius + (badgeFontSize * 0.35), pillY + pillHeight / 2);
            ctx.restore();

            // =========================================================
            // 3. Top-Left Micro Stamp
            // =========================================================
            ctx.save();
            const stampFontSize = Math.max(11, Math.round(targetW * 0.016));
            ctx.font = `600 ${stampFontSize}px 'Montserrat', 'Inter', sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillText(text, marginX, marginY + stampFontSize);
            ctx.restore();

            // Output JPEG 90%
            const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
            resolve(watermarkedDataUrl);
          } catch (err) {
            console.error('Watermark processing error:', err);
            // On canvas taint or error, resolve with original
            resolve(typeof source === 'string' ? source : img.src);
          }
        };

        // Source resolution
        if (source instanceof HTMLImageElement) {
          if (source.complete) {
            processImage(source);
          } else {
            source.onload = () => processImage(source);
            source.onerror = (e) => reject(e);
          }
        } else if (source instanceof File || source instanceof Blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => processImage(img);
            img.onerror = (e) => reject(e);
            img.src = e.target.result;
          };
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(source);
        } else if (typeof source === 'string') {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => processImage(img);
          img.onerror = () => {
            // If crossOrigin fails, try without crossOrigin
            const fallbackImg = new Image();
            fallbackImg.onload = () => processImage(fallbackImg);
            fallbackImg.onerror = (e) => reject(e);
            fallbackImg.src = source;
          };
          img.src = source;
        } else {
          reject(new Error('Unsupported image source type'));
        }
      });
    },

    /**
     * Extracts a frame from a video file/blob, watermarks it, and returns the poster image URL
     *
     * @param {File|Blob|string} videoSource
     * @returns {Promise<string>}
     */
    generateVideoPoster: function (videoSource) {
      return new Promise((resolve) => {
        try {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.muted = true;
          video.playsInline = true;

          let url;
          if (typeof videoSource === 'string') {
            url = videoSource;
          } else {
            url = URL.createObjectURL(videoSource);
          }
          video.src = url;

          const cleanup = () => {
            if (typeof videoSource !== 'string') {
              try { URL.revokeObjectURL(url); } catch (e) {}
            }
          };

          video.onloadeddata = () => {
            video.currentTime = Math.min(1.0, (video.duration || 2) / 2);
          };

          video.onseeked = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth || 640;
              canvas.height = video.videoHeight || 360;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                cleanup();
                resolve('');
                return;
              }
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const frameDataUrl = canvas.toDataURL('image/jpeg', 0.85);
              cleanup();

              // Watermark the captured frame
              KejaWatermark.applyWatermarkToImage(frameDataUrl).then(resolve).catch(() => resolve(frameDataUrl));
            } catch (err) {
              console.warn('Video poster extraction error:', err);
              cleanup();
              resolve('');
            }
          };

          video.onerror = () => {
            cleanup();
            resolve('');
          };

          // Timeout after 4 seconds
          setTimeout(() => {
            cleanup();
            resolve('');
          }, 4000);
        } catch (err) {
          console.warn('Video poster setup error:', err);
          resolve('');
        }
      });
    },

    /**
     * Creates an HTML watermark badge element to overlay on video players
     *
     * @returns {string} HTML string of overlay badge
     */
    getVideoWatermarkBadgeHTML: function () {
      return `
        <div class="keja-video-watermark-overlay" style="position: absolute; top: 10px; right: 10px; pointer-events: none; background: rgba(15, 23, 42, 0.85); color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; display: flex; align-items: center; gap: 6px; border: 1.5px solid rgba(0, 181, 63, 0.85); box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 15; font-family: 'Montserrat', 'Inter', -apple-system, sans-serif; letter-spacing: 0.3px; backdrop-filter: blur(4px);">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #00b53f; display: inline-block; box-shadow: 0 0 6px #00b53f;"></span>
          ${WATERMARK_TEXT}
        </div>
      `;
    },

    /**
     * Attaches watermark overlay and security attributes to a video element
     * Prevents easy downloading and displays permanent kejamarket.co.ke badge
     *
     * @param {HTMLVideoElement} videoEl
     */
    protectVideoElement: function (videoEl) {
      if (!videoEl) return;
      videoEl.setAttribute('controlsList', 'nodownload');
      videoEl.setAttribute('oncontextmenu', 'return false;');
      videoEl.addEventListener('contextmenu', (e) => e.preventDefault());

      const parent = videoEl.parentElement;
      if (parent && !parent.querySelector('.keja-video-watermark-overlay')) {
        const currentPos = window.getComputedStyle(parent).position;
        if (currentPos === 'static') {
          parent.style.position = 'relative';
        }
        parent.insertAdjacentHTML('beforeend', KejaWatermark.getVideoWatermarkBadgeHTML());
      }
    }
  };

  // Attach to window
  window.kejaWatermark = KejaWatermark;
})();

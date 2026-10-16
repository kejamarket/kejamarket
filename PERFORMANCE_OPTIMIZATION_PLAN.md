# Frontend Performance Optimization Plan
## Target: Support 10,000+ Concurrent Users

## Current Issues (CRITICAL):

### 1. **Blocking Scripts** 🔴
- **Problem**: 25+ scripts loaded synchronously without `defer` or `async`
- **Impact**: Page render blocked for 2-5 seconds
- **Solution**: Add `defer` to all non-critical scripts

### 2. **No Image Lazy Loading** 🔴
- **Problem**: All images load immediately
- **Impact**: Bandwidth waste, slow initial load
- **Solution**: Implement `loading="lazy"` and IntersectionObserver

### 3. **No Code Splitting** 🔴
- **Problem**: All JS loaded on initial page load (500KB+ total)
- **Impact**: High bandwidth usage, slow parse time
- **Solution**: Dynamic imports for features

### 4. **No Minification** ⚠️
- **Problem**: JS/CSS not minified in production
- **Impact**: 40-50% larger file sizes
- **Solution**: Build process with minification

### 5. **No CSS Critical Path** ⚠️
- **Problem**: All CSS loaded in `<head>`, blocks render
- **Impact**: Slow First Contentful Paint (FCP)
- **Solution**: Inline critical CSS, defer non-critical

### 6. **No Resource Hints** ⚠️
- **Problem**: No preload/prefetch/preconnect
- **Impact**: Slower resource loading
- **Solution**: Add resource hints for key assets

## Implementation Plan:

### Phase 1: Quick Wins (30 min) ✅

#### A. Defer Non-Critical Scripts
```html
<!-- Critical: Load immediately -->
<script src="js/app.js" defer></script>
<script src="js/auth.js" defer></script>

<!-- Non-critical: Load after page interactive -->
<script src="js/landlord-portal.js" defer></script>
<script src="js/service-portal.js" defer></script>
<script src="js/monetization.js" defer></script>
```

#### B. Lazy Load Images
```javascript
// Add to all property images
<img src="placeholder.jpg" data-src="actual.jpg" loading="lazy" class="lazy">

// Fallback for older browsers
if ('loading' in HTMLImageElement.prototype) {
  // Native lazy loading supported
} else {
  // Use IntersectionObserver
}
```

#### C. Preload Critical Resources
```html
<link rel="preload" href="css/style.css" as="style">
<link rel="preload" href="js/app.js" as="script">
<link rel="preconnect" href="https://fonts.googleapis.com">
```

### Phase 2: Medium Optimizations (2 hours) ⚠️

#### A. Code Splitting
```javascript
// Dynamic imports for features
const loadLandlordPortal = () => import('./js/landlord-portal.js');
const loadMonetization = () => import('./js/monetization.js');

// Load on demand
document.getElementById('landlord-btn').addEventListener('click', async () => {
  const module = await loadLandlordPortal();
  module.init();
});
```

#### B. Critical CSS Inline
```html
<style>
  /* Inline above-the-fold CSS here (~10-15KB) */
  .header, .hero, .property-grid { ... }
</style>

<!-- Load rest asynchronously -->
<link rel="preload" href="css/style.css" as="style" onload="this.rel='stylesheet'">
```

#### C. Service Worker Caching Strategy
```javascript
// Aggressive caching for static assets
const CACHE_STRATEGY = {
  html: 'network-first',      // Always fresh
  css: 'stale-while-revalidate',  // Fast with updates
  js: 'stale-while-revalidate',
  images: 'cache-first',       // Cache forever
  api: 'network-first'         // Fresh data
};
```

### Phase 3: Advanced Optimizations (4 hours) 🔧

#### A. Build Process with Webpack/Rollup
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        }
      }
    }
  }
};
```

#### B. Image Optimization
- WebP format with JPG fallback
- Responsive images with srcset
- Blur-up placeholder technique

#### C. HTTP/2 Server Push
```
Link: </css/style.css>; rel=preload; as=style
Link: </js/app.js>; rel=preload; as=script
```

### Phase 4: Database & Backend (Separate Task)
- Connection pooling (Task #5)
- Redis caching (Task #6)
- Server clustering (Task #7)
- Rate limiting (Task #8)

## Performance Metrics Target:

### Before Optimization:
- First Contentful Paint (FCP): 3-4s
- Time to Interactive (TTI): 6-8s
- Total Page Weight: 2-3MB
- Lighthouse Score: 40-50

### After Optimization:
- First Contentful Paint (FCP): <1.5s ✅
- Time to Interactive (TTI): <3s ✅
- Total Page Weight: <500KB (initial load) ✅
- Lighthouse Score: 90+ ✅

## Immediate Actions (NOW):

1. ✅ Add `defer` to all non-critical scripts
2. ✅ Implement native lazy loading for images
3. ✅ Add resource hints (preload/preconnect)
4. ✅ Update service worker caching strategy
5. ✅ Minify critical CSS inline

## Testing Tools:
- Lighthouse (Chrome DevTools)
- WebPageTest.org
- GTmetrix
- Chrome Coverage Tool (find unused code)

## Expected Impact:
- **Page Load**: 60-70% faster
- **Bandwidth**: 50-60% reduction
- **Server Load**: 40% reduction (from caching)
- **User Experience**: Significantly improved, especially on mobile/slow connections

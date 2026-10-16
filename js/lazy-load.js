/**
 * Image Lazy Loading System
 * Optimized for 10,000+ concurrent users
 */

class LazyLoader {
  constructor() {
    this.images = [];
    this.observer = null;
    this.init();
  }

  init() {
    console.log('[LAZY-LOAD] Initializing image lazy loading');
    
    // Check for native lazy loading support
    if ('loading' in HTMLImageElement.prototype) {
      console.log('[LAZY-LOAD] Using native lazy loading');
      this.useNativeLazyLoading();
    } else {
      console.log('[LAZY-LOAD] Using IntersectionObserver fallback');
      this.useIntersectionObserver();
    }
  }

  useNativeLazyLoading() {
    // Use browser's native lazy loading
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      img.setAttribute('loading', 'lazy');
    });
  }

  useIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '50px', // Load images 50px before they enter viewport
      threshold: 0.01
    };

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          observer.unobserve(img);
        }
      });
    }, options);

    // Observe all images with data-src attribute
    this.observeImages();
  }

  observeImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      this.images.push(img);
      if (this.observer) {
        this.observer.observe(img);
      }
    });
    console.log(`[LAZY-LOAD] Observing ${images.length} images`);
  }

  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    // Create a temporary image to preload
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      img.removeAttribute('data-src');
    };
    tempImg.onerror = () => {
      console.error('[LAZY-LOAD] Failed to load image:', src);
      img.classList.add('error');
    };
    tempImg.src = src;
  }

  // Add new images dynamically (for infinite scroll, etc.)
  observe(element) {
    if (this.observer) {
      const images = element.querySelectorAll('img[data-src]');
      images.forEach(img => {
        this.images.push(img);
        this.observer.observe(img);
      });
    } else {
      // Native lazy loading
      this.useNativeLazyLoading();
    }
  }

  // Force load all images (useful for print, etc.)
  loadAll() {
    this.images.forEach(img => this.loadImage(img));
  }
}

// Create global instance
window.lazyLoader = new LazyLoader();

// Re-observe when new content is added
document.addEventListener('DOMContentLoaded', () => {
  // Observe mutations for dynamically added images
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          if (node.tagName === 'IMG' && node.dataset.src) {
            window.lazyLoader.observe(node.parentElement);
          } else if (node.querySelectorAll) {
            window.lazyLoader.observe(node);
          }
        }
      });
    });
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Provide global API
window.LazyLoader = LazyLoader;

console.log('[LAZY-LOAD] System ready');

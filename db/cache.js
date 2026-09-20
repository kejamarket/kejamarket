/**
 * KejaMarket - High-Speed In-Memory Micro-Cache Layer
 * Designed for 10,000+ concurrent users to achieve sub-millisecond API response times
 * and eliminate database connection pool saturation.
 */

'use strict';

class FastCache {
  constructor(maxEntries = 5000) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  set(key, value, ttlSeconds = 15) {
    // Keep memory bounded with LRU-style eviction if maxEntries is reached
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  invalidate(prefix = '') {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      hitRate: (this.hits + this.misses) > 0 
        ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + '%' 
        : '0%'
    };
  }

  /**
   * Express middleware for route micro-caching
   * @param {number} [ttlSeconds=15] Cache time-to-live
   * @param {string} [prefix='api'] Key prefix
   */
  middleware(ttlSeconds = 15, prefix = 'api') {
    return (req, res, next) => {
      // Only cache GET or HEAD requests
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }

      // Do not cache user-authenticated personal views if token present
      const authHeader = req.headers['authorization'];
      if (authHeader && !prefix.startsWith('public')) {
        return next();
      }

      const cacheKey = `${prefix}:${req.originalUrl || req.url}`;
      const cachedData = this.get(cacheKey);

      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
        return res.json(cachedData);
      }

      // Intercept res.json to populate cache
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          this.set(cacheKey, body, ttlSeconds);
        }
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
        return originalJson(body);
      };

      next();
    };
  }
}

// Singleton cache instance
const globalCache = new FastCache();

module.exports = {
  FastCache,
  cache: globalCache
};

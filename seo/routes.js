const { cache } = require('../db/cache');
/**
 * KejaMarket SEO — Express Router
 * Wires up all public, crawlable SSR routes and XML sitemaps.
 *
 * All routes are strictly GET routes:
 *   GET /property/:slug
 *   GET /rentals
 *   GET /rentals/:location
 *   GET /rentals/:location/:suburb
 *   GET /rentals/:location/:suburb/:type
 *   GET /rentals/type/:type
 *   GET /guides
 *   GET /guides/:slug
 *   GET /sitemap.xml
 *   GET /sitemap-properties.xml
 *   GET /sitemap-locations.xml
 *   GET /sitemap-guides.xml
 *
 * NOTE: The existing POST /api/properties endpoints and single-page app
 * routing are 100% UNTOUCHED and preserved.
 */

'use strict';

const express = require('express');
const { renderPropertyPage } = require('./property-page');
const { renderLocationPage } = require('./location-page');
const { renderGuidePage } = require('./guides');
const {
  renderSitemapIndex,
  renderPropertiesSitemap,
  renderLocationsSitemap,
  renderGuidesSitemap
} = require('./sitemaps');

const KNOWN_CATEGORIES = new Set([
  'bedsitter', 'bedsitters',
  '1-bedroom', '1bed', '1-bed',
  '2-bedroom', '2bed', '2-bed',
  '3-bedroom', '3bed', '3-bed',
  '4-bedroom', '4bed', '4-bed',
  'studio', 'studios',
  'single-room', 'single',
  'commercial', 'office'
]);

/**
 * Creates the SEO router
 * @param {Function} [storeGetter] Optional callback returning the active database store
 */
function createSeoRouter(storeGetter) {
  const router = express.Router();

  const resolveStore = () => {
    if (typeof storeGetter === 'function') {
      const s = storeGetter();
      if (s) return s;
    }
    try {
      return require('../db/postgres-store');
    } catch (_) {
      return require('../db/store');
    }
  };

  // ── SITEMAP ROUTES ──────────────────────────────────────────────────────────

  router.get('/sitemap.xml', (req, res) => {
    const cached = cache.get('seo:sitemap.xml');
    if (cached) {
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600');
      return res.send(cached);
    }
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    const xml = renderSitemapIndex();
    cache.set('seo:sitemap.xml', xml, 3600);
    res.send(xml);
  });

  router.get('/sitemap-properties.xml', async (req, res, next) => {
    try {
      const store = resolveStore();
      const xml = await renderPropertiesSitemap(store);
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=900');
      res.send(xml);
    } catch (err) {
      next(err);
    }
  });

  router.get('/sitemap-locations.xml', async (req, res, next) => {
    try {
      const store = resolveStore();
      const xml = await renderLocationsSitemap(store);
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (err) {
      next(err);
    }
  });

  router.get('/sitemap-guides.xml', (req, res) => {
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(renderGuidesSitemap());
  });

  // ── INDIVIDUAL PROPERTY PAGES ───────────────────────────────────────────────

  router.get('/property/:slug', async (req, res, next) => {
    const cacheKey = 'seo:property:' + req.params.slug;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
      return res.status(cached.status).send(cached.html);
    }
    try {
      const store = resolveStore();
      const result = await renderPropertyPage(store, req.params.slug);
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
      cache.set(cacheKey, result, 60);
      res.status(result.status).send(result.html);
    } catch (err) {
      console.error('Error rendering property page:', err);
      next(err);
    }
  });

  // ── GUIDES & KNOWLEDGE ARTICLES ─────────────────────────────────────────────

  router.get('/guides', (req, res) => {
    res.redirect(301, '/guides/how-to-verify-a-rental');
  });

  router.get('/guides/:slug', async (req, res, next) => {
    try {
      const store = resolveStore();
      const result = await renderGuidePage(store, req.params.slug);
      res.set('Cache-Control', 'public, max-age=86400');
      res.status(result.status).send(result.html);
    } catch (err) {
      console.error('Error rendering guide page:', err);
      next(err);
    }
  });

  // ── RENTALS / LOCATION PAGES ────────────────────────────────────────────────

  router.get('/rentals', (req, res) => {
    res.redirect(301, '/rentals/nairobi');
  });

  // /rentals/type/:type
  router.get('/rentals/type/:type', async (req, res, next) => {
    try {
      const store = resolveStore();
      const result = await renderLocationPage(store, {
        location: null,
        suburb: null,
        type: req.params.type,
        originalUrl: req.originalUrl
      });
      res.set('Cache-Control', 'public, max-age=300');
      res.status(result.status).send(result.html);
    } catch (err) {
      next(err);
    }
  });

  // /rentals/:location/:suburb/:type
  router.get('/rentals/:location/:suburb/:type', async (req, res, next) => {
    try {
      const store = resolveStore();
      const result = await renderLocationPage(store, {
        location: req.params.location,
        suburb: req.params.suburb,
        type: req.params.type,
        originalUrl: req.originalUrl
      });
      res.set('Cache-Control', 'public, max-age=300');
      res.status(result.status).send(result.html);
    } catch (err) {
      next(err);
    }
  });

  // /rentals/:location/:suburb_or_type
  router.get('/rentals/:location/:suburb', async (req, res, next) => {
    try {
      const store = resolveStore();
      const param = (req.params.suburb || '').toLowerCase();

      // Check if second param is actually a category/type (e.g. /rentals/nairobi/bedsitter)
      if (KNOWN_CATEGORIES.has(param)) {
        const result = await renderLocationPage(store, {
          location: req.params.location,
          suburb: null,
          type: param,
          originalUrl: req.originalUrl
        });
        res.set('Cache-Control', 'public, max-age=300');
        return res.status(result.status).send(result.html);
      }

      const result = await renderLocationPage(store, {
        location: req.params.location,
        suburb: req.params.suburb,
        type: null,
        originalUrl: req.originalUrl
      });
      res.set('Cache-Control', 'public, max-age=300');
      res.status(result.status).send(result.html);
    } catch (err) {
      next(err);
    }
  });

  // /rentals/:location
  router.get('/rentals/:location', async (req, res, next) => {
    try {
      const store = resolveStore();
      const result = await renderLocationPage(store, {
        location: req.params.location,
        suburb: null,
        type: null,
        originalUrl: req.originalUrl
      });
      res.set('Cache-Control', 'public, max-age=300');
      res.status(result.status).send(result.html);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

// Support both express.use(createSeoRouter()) and express.use(createSeoRouter)
const defaultRouter = createSeoRouter();
module.exports = defaultRouter;
module.exports.createSeoRouter = createSeoRouter;

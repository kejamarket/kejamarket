/**
 * Nairobi Rentals Live - Interactive Map Controller (Leaflet / OpenStreetMap)
 * Renders custom price badges on map pins, clusters, popups, and synchs with filters.
 */

class MapController {
  constructor() {
    this.fullMap = null;
    this.splitMap = null;
    this.fullMarkersGroup = null;
    this.splitMarkersGroup = null;
    this.nairobiCenter = [-1.286389, 36.817223];
    this.defaultZoom = 12;
  }

  init() {
    this.initFullMap();
    this.initSplitMap();
  }

  initFullMap() {
    const el = document.getElementById('leaflet-full-map');
    if (!el || this.fullMap) return;

    this.fullMap = L.map('leaflet-full-map', {
      attributionControl: true,  // Enable attribution (required by OpenStreetMap)
      preferCanvas: false,       // Use SVG for better quality
      worldCopyJump: false       // Disable world wrap for better performance
    }).setView(this.nairobiCenter, this.defaultZoom);

    // Use high-performance CartoDB Voyager tiles (crisp real estate maps, no 403 blocks)
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps'
      }).addTo(this.fullMap);

    this.fullMarkersGroup = L.layerGroup().addTo(this.fullMap);
  }

  initSplitMap() {
    const el = document.getElementById('leaflet-split-map');
    if (!el || this.splitMap) return;

    this.splitMap = L.map('leaflet-split-map', {
      attributionControl: true,  // Enable attribution (required by OpenStreetMap)
      preferCanvas: false,       // Use SVG for better quality
      worldCopyJump: false       // Disable world wrap for better performance
    }).setView(this.nairobiCenter, this.defaultZoom);

    // Use high-performance CartoDB Voyager tiles (crisp real estate maps, no 403 blocks)
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps'
      }).addTo(this.splitMap);

    this.splitMarkersGroup = L.layerGroup().addTo(this.splitMap);
  }

  formatPriceBadge(priceKes) {
    if (priceKes >= 1000) {
      const k = (priceKes / 1000).toFixed(priceKes % 1000 === 0 ? 0 : 1);
      return `KSh ${k}k`;
    }
    return `KSh ${priceKes}`;
  }

  renderPins(properties) {
    if (this.fullMap && this.fullMarkersGroup) {
      this.fullMarkersGroup.clearLayers();
    }
    if (this.splitMap && this.splitMarkersGroup) {
      this.splitMarkersGroup.clearLayers();
    }

    if (!properties || properties.length === 0) return;

    const bounds = [];

    properties.forEach((prop, idx) => {
      // 1. Resolve coordinates for every house
      let lat = prop.latitude || prop.lat;
      let lng = prop.longitude || prop.lng;
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        if (window.app && typeof window.app.getCoordinatesForProperty === 'function') {
          const c = window.app.getCoordinatesForProperty(prop);
          if (c && c.lat && c.lng) {
            lat = c.lat;
            lng = c.lng;
          }
        }
      }
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        lat = -1.286389;
        lng = 36.817223;
      }

      // Add deterministic micro-jitter so multiple properties in the same suburb
      // (e.g. 5 listings in Kilimani or Ruaka) spread out cleanly across the neighborhood!
      const jitterLat = ((idx % 7) - 3) * 0.0024;
      const jitterLng = (((idx * 3) % 7) - 3) * 0.0024;
      const finalLat = Number(lat) + jitterLat;
      const finalLng = Number(lng) + jitterLng;

      const priceText = this.formatPriceBadge(prop.rentKes || prop.price || 0);
      const isFeaturedClass = prop.isFeatured ? 'featured' : '';
      
      const customHtml = `<div class="custom-price-pin ${isFeaturedClass}">${priceText}</div>`;
      
      const icon = L.divIcon({
        className: 'custom-pin-wrapper',
        html: customHtml,
        iconSize: [80, 30],
        iconAnchor: [40, 30]
      });

      const isBnb = prop.isBnb || (prop.category || '').includes('BnB') || (prop.category || '').includes('Airbnb') || prop.rentPeriod === 'night';
      const periodLabel = isBnb ? '/ night' : '/ mo';
      const thumbUrl = (prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80';

      const popupHtml = `
        <div class="map-popup-card" style="font-family:'Poppins',sans-serif; min-width:220px; max-width:280px;">
          <div class="map-popup-thumb" style="position:relative; width:100%; height:110px; border-radius:8px; overflow:hidden; background:#f1f5f9; margin-bottom:8px;">
            <img src="${thumbUrl}" alt="${prop.title || 'Property'}" style="width:100%; height:110px; object-fit:cover; display:block;">
            ${isBnb ? '<span style="position:absolute;top:4px;left:4px;background:#ff5a5f;color:white;font-size:0.65rem;font-weight:700;padding:2px 6px;border-radius:4px;">BNB STAY</span>' : ''}
          </div>
          <div class="map-popup-body">
            <div class="map-popup-price" style="font-size:1rem; font-weight:800; color:#006818; margin-bottom:2px;">KSh ${Number(prop.rentKes || prop.price || 0).toLocaleString()} <span style="font-size:0.7rem;color:#6b7280;font-weight:normal;">${periodLabel}</span></div>
            <div class="map-popup-title" style="font-size:0.86rem; font-weight:700; color:#0f172a; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${prop.title || 'Rental Property'}</div>
            <div class="map-popup-location" style="font-size:0.75rem; color:#64748b; margin-bottom:8px;"><i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${prop.estateSuburb || prop.county || 'Nairobi'}</div>
            <div class="map-popup-actions" style="display:flex; gap:6px;">
              <button class="map-popup-btn btn-view" onclick="window.app.openPropertyDetail('${prop.id}')" style="flex:1; background:#0f172a; color:#fff; border:none; border-radius:6px; padding:6px 10px; font-weight:700; font-size:0.76rem; cursor:pointer;">View Details</button>
              <button class="map-popup-btn btn-chat" onclick="window.app.openChatForProperty('${prop.id}')" style="background:#00b53f; color:white; border:none; border-radius:6px; padding:6px 10px; font-weight:700; font-size:0.76rem; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                <i class="fas fa-comment-dots"></i> Chat
              </button>
            </div>
          </div>
        </div>
      `;

      // Full Map Marker
      if (this.fullMap && this.fullMarkersGroup) {
        const marker = L.marker([finalLat, finalLng], { icon })
          .bindPopup(popupHtml, { maxWidth: 280, closeButton: true });
        this.fullMarkersGroup.addLayer(marker);
      }

      // Split Map Marker
      if (this.splitMap && this.splitMarkersGroup) {
        const markerSplit = L.marker([finalLat, finalLng], { icon })
          .bindPopup(popupHtml, { maxWidth: 280, closeButton: true });
        this.splitMarkersGroup.addLayer(markerSplit);
      }

      bounds.push([finalLat, finalLng]);
    });

    if (bounds.length > 0) {
      if (this.fullMap) {
        this.fullMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
      if (this.splitMap) {
        this.splitMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    }
  }

  invalidateMaps() {
    setTimeout(() => {
      if (this.fullMap) this.fullMap.invalidateSize();
      if (this.splitMap) this.splitMap.invalidateSize();
    }, 150);
  }
}

window.mapController = new MapController();

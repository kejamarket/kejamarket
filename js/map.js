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

    this.fullMap = L.map('leaflet-full-map').setView(this.nairobiCenter, this.defaultZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.fullMap);

    this.fullMarkersGroup = L.layerGroup().addTo(this.fullMap);
  }

  initSplitMap() {
    const el = document.getElementById('leaflet-split-map');
    if (!el || this.splitMap) return;

    this.splitMap = L.map('leaflet-split-map').setView(this.nairobiCenter, this.defaultZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
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

    properties.forEach(prop => {
      const priceText = this.formatPriceBadge(prop.rentKes);
      const isFeaturedClass = prop.isFeatured ? 'featured' : '';
      
      const customHtml = `<div class="custom-price-pin ${isFeaturedClass}">${priceText}</div>`;
      
      const icon = L.divIcon({
        className: 'custom-pin-wrapper',
        html: customHtml,
        iconSize: [80, 30],
        iconAnchor: [40, 30]
      });

      const isBnb = prop.isBnb || prop.category.includes('BnB') || prop.category.includes('Airbnb') || prop.category.includes('Villa') || prop.rentPeriod === 'night';
      const periodLabel = isBnb ? '/ night' : '/ mo';

      const popupHtml = `
        <div class="map-popup-card">
          <div class="map-popup-thumb">
            <img src="${prop.media[0]?.url || ''}" alt="${prop.title}">
            ${isBnb ? '<span style="position:absolute;top:4px;left:4px;background:#ff5a5f;color:white;font-size:0.65rem;font-weight:700;padding:2px 6px;border-radius:4px;">BNB STAY</span>' : ''}
          </div>
          <div class="map-popup-body">
            <div class="map-popup-price">KSh ${prop.rentKes.toLocaleString()} <span style="font-size:0.7rem;color:#6b7280;font-weight:normal;">${periodLabel}</span></div>
            <div class="map-popup-title">${prop.title}</div>
            <div class="map-popup-location"><i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${prop.estateSuburb}, ${prop.county}</div>
            <div class="map-popup-actions">
              <button class="map-popup-btn btn-view" onclick="window.app.openPropertyDetail('${prop.id}')">View Details</button>
              <button class="map-popup-btn btn-chat" onclick="window.app.openChatForProperty('${prop.id}')" style="background:#00b53f; color:white; border:none; border-radius:4px; padding:4px 8px; font-weight:700; font-size:0.75rem; cursor:pointer;">
                <i class="fas fa-comment-dots"></i> Chat
              </button>
            </div>
          </div>
        </div>
      `;

      // Full Map Marker
      if (this.fullMap && this.fullMarkersGroup) {
        const marker = L.marker([prop.latitude, prop.longitude], { icon })
          .bindPopup(popupHtml, { maxWidth: 280, closeButton: true });
        this.fullMarkersGroup.addLayer(marker);
      }

      // Split Map Marker
      if (this.splitMap && this.splitMarkersGroup) {
        const markerSplit = L.marker([prop.latitude, prop.longitude], { icon })
          .bindPopup(popupHtml, { maxWidth: 280, closeButton: true });
        this.splitMarkersGroup.addLayer(markerSplit);
      }

      bounds.push([prop.latitude, prop.longitude]);
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

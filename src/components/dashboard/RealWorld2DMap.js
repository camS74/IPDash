import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import '../../styles/real-map.css';
import countryCoordinates from './countryCoordinates';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useExcelData } from '../../contexts/ExcelDataContext';

const earthImg = process.env.PUBLIC_URL + '/assets/8k_earth.jpg';

const IMAGE_WIDTH = 4096;
const IMAGE_HEIGHT = 2048;
const IMAGE_BOUNDS = [[-90, -180], [90, 180]];

const MAJOR_COUNTRIES = [
  'United States of America', 'China', 'Russia', 'United Kingdom', 'Germany',
  'France', 'India', 'Brazil', 'Japan', 'Australia', 'South Africa', 'Canada',
  'Italy', 'Turkey', 'Saudi Arabia', 'Mexico', 'Indonesia', 'South Korea', 'Spain', 'Egypt'
];

const COUNTRY_ABBREVIATIONS = {
  'United States of America': 'US',
  'United Kingdom': 'UK',
  'United Arab Emirates': 'UAE',
  'Saudi Arabia': 'KSA',
  'South Korea': 'KOREA',
  'Russia': 'RUS',
  'Germany': 'GER',
  'France': 'FRA',
  'Japan': 'JPN',
  'China': 'CHN',
  'Canada': 'CAN',
  'Australia': 'AUS',
  'Brazil': 'BRA',
  'India': 'IND',
  'Turkey': 'TUR',
  'South Africa': 'RSA',
  'Mexico': 'MEX',
  'Spain': 'ESP',
  'Italy': 'ITA',
  'Egypt': 'EGY',
};

const LABEL_OFFSETS = {
  'UAE': 'right',
  'United Arab Emirates': 'right',
  'Qatar': 'below',
  'Bahrain': 'left',
  'Kuwait': 'above',
  'Oman': 'right',
  'Saudi Arabia': 'left',
  'KSA': 'left',
  'Egypt': 'below',
  'Iraq': 'above',
  'Jordan': 'right',
  'Syria': 'above',
  'Lebanon': 'left',
  'Israel': 'below',
  'Palestine': 'below',
  'Yemen': 'right',
  'Iran': 'left',
  'Turkey': 'above',
};

const COUNTRY_NAME_ALIASES = {
  'KSA': 'Saudi Arabia',
  'Kingdom of Saudi Arabia': 'Saudi Arabia',
  'Kingdom Of Saudi Arabia': 'Saudi Arabia',
  'UAE': 'United Arab Emirates',
  'Emirates': 'United Arab Emirates',
  'USA': 'United States of America',
  'US': 'United States of America',
  'UK': 'United Kingdom',
  'Britain': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  'England': 'United Kingdom',
  'Korea': 'South Korea',
  'Republic of Korea': 'South Korea',
  'South Korea': 'South Korea',
  'North Korea': 'North Korea',
  'DRC': 'Democratic Republic of Congo',
  'Ivory Coast': 'Ivory Coast',
  'Cote D\'Ivoire': 'Ivory Coast',
  'Côte d\'Ivoire': 'Ivory Coast',
  'Czechia': 'Czech Republic',
  'Czech Republic': 'Czech Republic',
  'FYROM': 'North Macedonia',
  'Macedonia': 'North Macedonia',
  'North Macedonia': 'North Macedonia',
  'Burma': 'Myanmar',
  'Myanmar': 'Myanmar',
  'Cape Verde': 'Cabo Verde',
  'Cabo Verde': 'Cabo Verde',
  'Swaziland': 'Eswatini',
  'Eswatini': 'Eswatini',
  'Hong Kong': 'Hong Kong',
  'Macau': 'Macau',
  'Macao': 'Macau',
  'Taiwan': 'Taiwan',
  'Republic of China': 'Taiwan',
  'Palestine': 'Palestine',
  'Palestinian Territory': 'Palestine',
  'West Bank': 'Palestine',
  'Gaza': 'Palestine',
};

// Performance-optimized debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Collision detection utility
const detectCollisions = (labels) => {
  const collisions = [];
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const label1 = labels[i];
      const label2 = labels[j];
      const distance = Math.sqrt(
        Math.pow(label1.x - label2.x, 2) + Math.pow(label1.y - label2.y, 2)
      );
      if (distance < 80) { // Minimum distance between labels
        collisions.push([i, j]);
      }
    }
  }
  return collisions;
};

function normalizeCountryName(name) {
  if (!name) return '';
  if (COUNTRY_NAME_ALIASES[name]) return COUNTRY_NAME_ALIASES[name];
  const lower = name.toLowerCase();
  for (const key in COUNTRY_NAME_ALIASES) {
    if (key.toLowerCase() === lower) return COUNTRY_NAME_ALIASES[key];
  }
  for (const key in COUNTRY_NAME_ALIASES) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return COUNTRY_NAME_ALIASES[key];
    }
  }
  return name;
}

function getLabelTransform(country, type) {
  const norm = normalizeCountryName(country);
  const dir = LABEL_OFFSETS[norm] || LABEL_OFFSETS[COUNTRY_ABBREVIATIONS[norm]];
  if (dir === 'right') return ' translateX(200px)';
  if (dir === 'left') return ' translateX(-220px)';
  if (dir === 'above') return ' translateY(-180px)';
  if (dir === 'below') return ' translateY(180px)';
  return type === 'sales' ? ' translateX(200px)' : ' translateX(-220px)';
}

function getFlagEmoji(country) {
  const flags = {
    'United Arab Emirates': '🇦🇪', 'UAE': '🇦🇪',
    'Saudi Arabia': '🇸🇦', 'KSA': '🇸🇦',
    'Qatar': '🇶🇦', 'Kuwait': '🇰🇼', 'Bahrain': '🇧🇭', 'Oman': '🇴🇲',
    'Egypt': '🇪🇬', 'Jordan': '🇯🇴', 'Yemen': '🇾🇪', 'Sudan': '🇸🇩',
    'Ethiopia': '🇪🇹', 'Nigeria': '🇳🇬', 'Niger': '🇳🇪', 'Libya': '🇱🇾',
    'United States': '🇺🇸', 'USA': '🇺🇸', 'United States of America': '🇺🇸',
    'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
    'France': '🇫🇷', 'Germany': '🇩🇪', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
    'India': '🇮🇳', 'China': '🇨🇳', 'Russia': '🇷🇺', 'Turkey': '🇹🇷',
    'South Africa': '🇿🇦', 'Brazil': '🇧🇷', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
    'Japan': '🇯🇵', 'Singapore': '🇸🇬', 'Sri Lanka': '🇱🇰',
  };
  return flags[country] || '';
}

const RealWorld2DMap = () => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const legendRef = useRef(null);
  const [error, setError] = useState(null);
  const [legendVisible, setLegendVisible] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const { salesData } = useSalesData();
  const { selectedDivision } = useExcelData();

  // Memoized sales countries calculation
  const salesCountries = useMemo(() => {
    if (!salesData || !selectedDivision) return [];
    const sheet = salesData[`${selectedDivision.split('-')[0]}-Countries`] ?? [];
    const rows = sheet.slice(3);
    const totals = rows.flatMap(r => r.slice(1)).reduce((sum, v) => sum + (+v || 0), 0);
    let sum = 0;
    const result = [];
    rows.forEach(r => {
      const name = (r?.[0] ?? '').trim();
      if (!name) return;
      const countrySum = r.slice(1).reduce((s, v) => s + (+v || 0), 0);
      const pct = +(countrySum / totals * 100);
      if (pct >= 0.05) {
        result.push({ name, percentage: pct });
        sum += pct;
      }
    });
    if (sum < 99.95) {
      result.push({ name: 'Other', percentage: 100 - sum, coords: [0, 0] });
    }
    // --- Export for HTML export ---
    console.log('Raw salesData:', salesData);
    console.log('Selected division:', selectedDivision);
    console.log('Sheet being used:', `${selectedDivision.split('-')[0]}-Countries`);
    console.log('Rows extracted for country processing:', rows);
    console.log('Result array before export:', result);
    try {
      console.log('Exporting country data for HTML export:', result);
      window.__IPDASH_2D_COUNTRY_DATA__ = result
        .map(c => {
          if (!c.name || typeof c.name !== 'string') {
            console.warn('Skipping entry with invalid name:', c);
            return null;
          }
          const normName = normalizeCountryName(c.name);
          const coords = countryCoordinates[normName] || countryCoordinates[c.name] || null;
          if (!coords) {
            console.warn('No coordinates found for country:', c.name, '(normalized:', normName, ')');
            return null;
          }
          return { name: c.name, percentage: +c.percentage.toFixed(2), coords };
        })
        .filter(Boolean);
      console.log('Final exported country data:', window.__IPDASH_2D_COUNTRY_DATA__);
    } catch (e) { /* ignore */ }
    return result.sort((a, b) => b.percentage - a.percentage);
  }, [salesData, selectedDivision]);

  // Memoized sales country names set
  const salesCountryNames = useMemo(() => 
    new Set(salesCountries.map(c => normalizeCountryName(c.name))), 
    [salesCountries]
  );

  // Memoized pin color calculation
  const getPinColor = useCallback((percentage) => {
    if (percentage >= 20) return '#d32f2f'; // Red for high sales
    if (percentage >= 10) return '#f57c00'; // Orange for medium-high
    if (percentage >= 5) return '#fbc02d';  // Yellow for medium
    if (percentage >= 2) return '#388e3c';  // Green for medium-low
    return '#1976d2'; // Blue for low sales
  }, []);

  // Memoized pin size calculation
  const getPinSize = useCallback((percentage, zoom) => {
    const baseSize = 56 + (percentage * 2);
    const zoomFactor = 0.7 + zoom * 0.13;
    // Enforce a minimum pin size of 48px
    return Math.max(48, Math.min(80, baseSize * zoomFactor));
  }, []);

  // Debounced zoom handler
  const debouncedZoomHandler = useCallback(
    debounce((map) => {
      if (!map) return;
      const zoom = map.getZoom();
      const scale = 0.7 + zoom * 0.13;
      document.documentElement.style.setProperty('--pin-scale', scale);
      
      // Trigger label collision detection
      requestAnimationFrame(() => {
        const labels = document.querySelectorAll('.real-map-country-label');
        const labelPositions = Array.from(labels).map((label, index) => ({
          index,
          x: label.offsetLeft,
          y: label.offsetTop,
          element: label
        }));
        
        const collisions = detectCollisions(labelPositions);
        collisions.forEach(([i, j]) => {
          if (labelPositions[i] && labelPositions[j]) {
            labelPositions[i].element.style.opacity = '0.3';
            labelPositions[j].element.style.opacity = '0.3';
          }
        });
      });
    }, 100),
    []
  );

  // Hover handlers
  const handlePinHover = useCallback((country, event) => {
    setHoveredCountry(country);
    const marker = event?.target;
    if (marker) {
      const pinElement = marker.getElement();
      if (pinElement && pinElement.style) {
        const currentTransform = pinElement.style.transform || '';
        pinElement.style.transform = `${currentTransform} scale(1.1)`;
        pinElement.style.zIndex = '1000';
      }
    }
  }, []);

  const handlePinLeave = useCallback((event) => {
    setHoveredCountry(null);
    const marker = event?.target;
    if (marker) {
      const pinElement = marker.getElement();
      if (pinElement && pinElement.style) {
        const currentTransform = pinElement.style.transform || '';
        pinElement.style.transform = currentTransform.replace(' scale(1.1)', '');
        pinElement.style.zIndex = '10';
      }
    }
  }, []);

  // Click handler for country focus
  const handlePinClick = useCallback((country, coords, map) => {
    if (!map || !coords) return;
    
    // Smooth zoom to country
    map.flyTo([coords[1], coords[0]], Math.min(4, map.getZoom() + 1), {
      duration: 1.5,
      easeLinearity: 0.25
    });
    
    // Show enhanced popup
    const popup = L.popup({
      className: 'real-map-popup',
      maxWidth: 300,
      closeButton: true,
      autoClose: false
    })
    .setLatLng([coords[1], coords[0]])
    .setContent(`
      <div class="real-map-popup-content">
        <div class="popup-header">
          <span class="popup-flag">${getFlagEmoji(country)}</span>
          <h3>${country}</h3>
        </div>
        <div class="popup-details">
          <p><strong>Sales Share:</strong> ${salesCountries.find(c => normalizeCountryName(c.name) === normalizeCountryName(country))?.percentage.toFixed(2)}%</p>
          <p><strong>Division:</strong> ${selectedDivision}</p>
        </div>
      </div>
    `)
    .openOn(map);
  }, [salesCountries, selectedDivision]);

  useEffect(() => {
    let map;
    try {
      const mapContainer = mapContainerRef.current;
      if (!mapContainer) return;
      
      // Clean up existing map
      if (mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null;
        mapContainer.innerHTML = '';
      }

      // Initialize map with enhanced options
      map = L.map(mapContainer, {
        crs: L.CRS.EPSG4326,
        minZoom: 0,
        maxZoom: 6,
        zoomSnap: 0.1,
        scrollWheelZoom: {
          debounceTime: 300,
          wheelPxPerZoomLevel: 1200,
          wheelDebounceTime: 150
        },
        maxBounds: IMAGE_BOUNDS,
        maxBoundsViscosity: 1.0,
        worldCopyJump: false,
        attributionControl: false,
        zoomControl: true,
        dragging: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        inertia: true,
        inertiaDeceleration: 3000,
        inertiaMaxSpeed: 3000,
        easeLinearity: 0.25,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        transform3DLimit: 8388608,
        tap: true,
        tapTolerance: 15,
        trackResize: true,
        preferCanvas: false
      });

      mapRef.current = map;
      map.fitBounds(IMAGE_BOUNDS, { maxZoom: 2 });
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 500);

      // Enhanced tile layer with fallback
      let deepZoomLayer;
      if (L.tileLayer.deepZoom) {
        try {
          deepZoomLayer = L.tileLayer.deepZoom('/earth_tiles/{z}/{x}_{y}.jpg', {
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
            maxZoom: 6,
            noWrap: true,
            bounds: IMAGE_BOUNDS,
          }).addTo(map);
        } catch (e) {
          console.warn('Deep zoom not available, using image overlay');
        }
      }
      if (!deepZoomLayer) {
        L.imageOverlay(earthImg, IMAGE_BOUNDS, { 
          interactive: false,
          opacity: 0.95
        }).addTo(map);
      }

      // Enhanced marker cluster group
      const markerCluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 4,
        removeOutsideVisibleBounds: true,
        animate: true,
        animateAddingMarkers: true,
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          const size = Math.min(60, 30 + count * 3);
          return L.divIcon({
            html: `<span>${count}</span>`,
            className: 'marker-cluster',
            iconSize: [size, size]
          });
        }
      });

      // Create sales country pins with enhanced features
      salesCountries.forEach(({ name, percentage, coords }) => {
        if (percentage < 0.1) return; // Skip countries with <0.1% sales
        const normName = normalizeCountryName(name);
        const c = coords || countryCoordinates[normName] || countryCoordinates[name] || null;
        if (!c) return;
        const value = percentage < 0.1 ? percentage.toFixed(2) : percentage.toFixed(1);
        // const color = getPinColor(percentage);
        // const size = getPinSize(percentage, map.getZoom());

        // --- REMOVED: Do not render pin SVG or pinMarker ---
        // --- ONLY render the label above the location ---
        const labelText = `${normName}\n${value}%`;
        const labelMarker = L.marker([c[1], c[0]], {
          icon: L.divIcon({
            className: 'real-map-country-label real-map-sales-label globe-style-label',
            html: `<span class=\"globe-label-text\">${labelText.replace(/\n/g, '<br/>')}</span>`
          }),
          interactive: false,
          zIndexOffset: 1000
        }).setLatLng([c[1], c[0]]);
        labelMarker.on('add', function() {
          const el = labelMarker.getElement();
          if (el) {
            el.style.transform += ' translateY(-60px)';
            el.style.opacity = '0';
            requestAnimationFrame(() => {
              el.style.transition = 'opacity 0.5s ease-in-out';
              el.style.opacity = '1';
            });
          }
        });
        labelMarker.addTo(map);
      });

      // map.addLayer(markerCluster);

    } catch (err) {
      setError('An error occurred while loading the map. Please try refreshing the page.');
      console.error('Error initializing Leaflet map:', err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [salesData, selectedDivision, salesCountries, getPinColor, getPinSize, debouncedZoomHandler, handlePinHover, handlePinLeave, handlePinClick]);

  if (error) {
    return (
      <div className="real-map-error">
        <h3>Map Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="real-map-container">
      <div ref={mapContainerRef} className="real-map-viewport" />
      
      {/* Floating Legend */}
      {legendVisible && (
        <div ref={legendRef} className="real-map-legend">
          <div className="legend-header">
            <h4>Sales Distribution</h4>
            <button 
              className="legend-toggle"
              onClick={() => setLegendVisible(false)}
              aria-label="Hide legend"
            >
              ×
            </button>
          </div>
          <div className="legend-content">
            <div className="legend-item">
              <div className="legend-pin" style={{ backgroundColor: '#d32f2f' }}></div>
              <span>≥20%</span>
            </div>
            <div className="legend-item">
              <div className="legend-pin" style={{ backgroundColor: '#f57c00' }}></div>
              <span>10-19%</span>
            </div>
            <div className="legend-item">
              <div className="legend-pin" style={{ backgroundColor: '#fbc02d' }}></div>
              <span>5-9%</span>
            </div>
            <div className="legend-item">
              <div className="legend-pin" style={{ backgroundColor: '#388e3c' }}></div>
              <span>2-4%</span>
            </div>
            <div className="legend-item">
              <div className="legend-pin" style={{ backgroundColor: '#1976d2' }}></div>
              <span>&lt;2%</span>
            </div>
          </div>
          <div className="legend-note">
            Pin size indicates sales volume
          </div>
        </div>
      )}
      
      {/* Legend Toggle Button */}
      {!legendVisible && (
        <button 
          className="legend-show-button"
          onClick={() => setLegendVisible(true)}
          aria-label="Show legend"
        >
          📊
        </button>
      )}
      
      {/* Hover Info Panel */}
      {hoveredCountry && (
        <div className="real-map-hover-info">
          <div className="hover-flag">{getFlagEmoji(hoveredCountry)}</div>
          <div className="hover-country">{hoveredCountry}</div>
          <div className="hover-percentage">
            {salesCountries.find(c => normalizeCountryName(c.name) === normalizeCountryName(hoveredCountry))?.percentage.toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default RealWorld2DMap; 
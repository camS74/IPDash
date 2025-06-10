import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useFilter } from '../../contexts/FilterContext';
import countryCoordinates from './countryCoordinates';
import './SalesCountryMap.css';

const SalesCountry2DMap = () => {
  const { salesData, selectedDivision } = useSalesData();
  const { columnOrder, basePeriodIndex, dataGenerated } = useFilter();
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Helper function to get country sales amount for a specific period
  const getCountrySalesAmount = (countryName, countriesData, column) => {
    const countryRow = countriesData.find(row => 
      row && row[0] && row[0].toString().toLowerCase() === countryName.toLowerCase()
    );
    
    if (!countryRow) return 0;
    
    // Find the column index for this period
    for (let colIndex = 1; colIndex < countryRow.length; colIndex++) {
      const headers = countriesData.slice(0, 3);
      if (headers.length >= 3) {
        const year = headers[0][colIndex];
        const month = headers[1][colIndex];
        const type = headers[2][colIndex];
        
        if (year == column.year && 
            month === column.month && 
            type === column.type) {
          return parseFloat(countryRow[colIndex]) || 0;
        }
      }
    }
    return 0;
  };

  // Helper function to get total sales for a specific period
  const getTotalSalesForPeriod = (countriesData, column) => {
    let total = 0;
    for (let i = 3; i < countriesData.length; i++) {
      const row = countriesData[i];
      if (row && row[0]) {
        const countryName = row[0].toString().trim();
        total += getCountrySalesAmount(countryName, countriesData, column);
      }
    }
    return total;
  };

  // Get country percentage for specific period  
  const getCountryPercentage = (countryName, countriesData, column) => {
    const countrySales = getCountrySalesAmount(countryName, countriesData, column);
    const totalSales = getTotalSalesForPeriod(countriesData, column);
    
    if (totalSales === 0) return 0;
    return (countrySales / totalSales) * 100;
  };

  // Convert lat/lng coordinates to image pixel coordinates
  const latLongToImageCoords = useCallback((lat, lng) => {
    // Standard equirectangular projection
    const imageWidth = 1200; // Base width for calculation
    const imageHeight = 600; // Base height for calculation
    
    const x = ((lng + 180) / 360) * imageWidth;
    const y = ((90 - lat) / 180) * imageHeight;
    
    return { x, y };
  }, []);

  // Get country coordinates from the master data
  const getCountryCoordinates = useCallback((countryName) => {
    const normalizedName = countryName.toLowerCase();
    const mappings = {
      'uae': 'United Arab Emirates',
      'usa': 'United States',
      'uk': 'United Kingdom', 
      'ksa': 'Saudi Arabia',
      'saudi arabia': 'Saudi Arabia'
    };
    
    const searchName = mappings[normalizedName] || countryName;
    
    for (const [name, coords] of Object.entries(countryCoordinates)) {
      if (name.toLowerCase().includes(searchName.toLowerCase()) || 
          searchName.toLowerCase().includes(name.toLowerCase())) {
        return coords;
      }
    }
    return null;
  }, []);

  // Extract countries and their data when period changes
  useEffect(() => {
    if (!salesData || !selectedDivision || !selectedPeriod || !dataGenerated) {
      setCountries([]);
      return;
    }

    const divisionCode = selectedDivision.split('-')[0];
    const countriesSheetName = `${divisionCode}-Countries`;
    const countriesData = salesData[countriesSheetName];

    if (!countriesData || countriesData.length <= 3) {
      setCountries([]);
      return;
    }

    const countryList = [];

    // Extract countries from Excel (starting from row 4, index 3)
    for (let i = 3; i < countriesData.length; i++) {
      const row = countriesData[i];
      if (row && row[0]) {
        const countryName = row[0].toString().trim();
        const percentage = getCountryPercentage(countryName, countriesData, selectedPeriod);
        
        if (percentage > 0) {
          const coordinates = getCountryCoordinates(countryName);
          if (coordinates) {
            const [lng, lat] = coordinates;
            const imageCoords = latLongToImageCoords(lat, lng);
            
            countryList.push({
              name: countryName,
              percentage: percentage,
              lat: lat,
              lng: lng,
              x: imageCoords.x,
              y: imageCoords.y,
              originalName: countryName
            });
          }
        }
      }
    }

    setCountries(countryList);
  }, [salesData, selectedDivision, selectedPeriod, dataGenerated, getCountryCoordinates, latLongToImageCoords]);

  // Set default period when columnOrder changes
  useEffect(() => {
    if (columnOrder.length > 0 && !selectedPeriod) {
      // Use base period if available, otherwise first period
      const defaultPeriod = basePeriodIndex >= 0 && basePeriodIndex < columnOrder.length 
        ? columnOrder[basePeriodIndex] 
        : columnOrder[0];
      setSelectedPeriod(defaultPeriod);
    }
  }, [columnOrder, basePeriodIndex, selectedPeriod]);

  // Get marker color based on percentage and country
  const getMarkerColor = (percentage, countryName) => {
    const isUAE = countryName.toLowerCase().includes('uae');
    if (isUAE) return '#2E865F'; // Green for UAE
    
    if (percentage >= 10) return '#d73027'; // Red for high
    if (percentage >= 5) return '#f46d43';  // Orange for medium-high  
    if (percentage >= 2) return '#fdae61';  // Yellow for medium
    return '#4575b4'; // Blue for low
  };

  // Get marker size based on percentage
  const getMarkerSize = (percentage, zoomLevel) => {
    const baseSize = Math.max(6, Math.min(20, 6 + percentage * 0.8));
    // Scale with zoom but keep reasonable bounds
    return Math.max(4, Math.min(30, baseSize / Math.max(zoomLevel, 0.5)));
  };

  // Mouse event handlers for zoom and pan
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(5, zoom * zoomFactor));
    
    // Calculate new pan to zoom toward mouse
    const zoomChange = newZoom / zoom;
    const newPanX = (pan.x - (mouseX - centerX)) * zoomChange + (mouseX - centerX);
    const newPanY = (pan.y - (mouseY - centerY)) * zoomChange + (mouseY - centerY);
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [zoom, pan]);

  const handleMouseDown = useCallback((e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - pan.x, 
        y: e.clientY - pan.y 
      });
    }
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom control functions
  const zoomIn = () => setZoom(prev => Math.min(5, prev * 1.2));
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev / 1.2));
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Check if we have data to display
  if (!dataGenerated) {
    return (
      <div className="sales-country-map-container">
        <div className="empty-state">
          <h3>🗺️ 2D World Map - Sales by Country</h3>
          <p>Please select columns and click the Generate button to view the 2D world map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-country-map-container">
      {/* Period Selection Section */}
      <div className="period-selection-section">
        <h4>📅 Select Period to Display:</h4>
        <div className="period-buttons-grid">
          {columnOrder.map((period, index) => (
            <button
              key={index}
              className={`period-button ${selectedPeriod === period ? 'selected' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {basePeriodIndex === index && <span className="base-period-star">★ </span>}
              {period.year} {period.isCustomRange ? period.displayName : period.month} {period.type}
            </button>
          ))}
        </div>
        <div className="period-info">
          <span className="info-text">
            ★ = Base Period | 
            Showing: {selectedPeriod ? `${selectedPeriod.year} ${selectedPeriod.isCustomRange ? selectedPeriod.displayName : selectedPeriod.month} ${selectedPeriod.type}` : 'None'} |
            Countries: {countries.length}
          </span>
        </div>
      </div>

      {/* Map Controls */}
      <div className="map-controls">
        <div className="zoom-controls">
          <button onClick={zoomIn} className="control-button">🔍+</button>
          <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomOut} className="control-button">🔍-</button>
          <button onClick={resetZoom} className="control-button">⌂</button>
        </div>
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{backgroundColor: '#2E865F'}}></span>
            <span>UAE (Local)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{backgroundColor: '#d73027'}}></span>
            <span>High ≥10%</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{backgroundColor: '#f46d43'}}></span>
            <span>Med ≥5%</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{backgroundColor: '#4575b4'}}></span>
            <span>Low &lt;5%</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={containerRef}
        className="map-container"
        style={{
          width: '100%',
          height: '600px',
          border: '2px solid #ddd',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative',
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          backgroundColor: '#f0f8ff'
        }}
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.2s ease',
            width: '100%',
            height: '100%',
            position: 'relative'
          }}
        >
          {/* Background Earth Image - Using same as 3D globe */}
          <img
            src="/assets/world.jpg"
            alt="World Map"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => console.error('Failed to load world.jpg')}
          />

          {/* SVG Overlay for Countries */}
          {imageLoaded && countries.length > 0 && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
              viewBox="0 0 1200 600"
              preserveAspectRatio="none"
            >
              {countries.map((country, index) => {
                const markerSize = getMarkerSize(country.percentage, zoom);
                const color = getMarkerColor(country.percentage, country.name);
                
                // Scale font size with zoom (inverse relationship)
                const fontSize = Math.max(8, Math.min(14, 10 / Math.max(zoom, 0.8)));
                const labelWidth = Math.max(60, Math.min(100, 80 / Math.max(zoom, 0.8)));
                const labelHeight = Math.max(20, Math.min(32, 24 / Math.max(zoom, 0.8)));
                
                return (
                  <g key={index}>
                    {/* Country marker */}
                    <circle
                      cx={country.x}
                      cy={country.y}
                      r={markerSize}
                      fill={color}
                      stroke="#fff"
                      strokeWidth={1.5}
                      opacity={0.9}
                    />
                    
                    {/* Country label - only show if zoom allows good readability */}
                    {zoom <= 2 && (
                      <g>
                        {/* Label background */}
                        <rect
                          x={country.x - labelWidth/2}
                          y={country.y - markerSize - labelHeight - 5}
                          width={labelWidth}
                          height={labelHeight}
                          fill="rgba(255, 255, 255, 0.95)"
                          stroke="rgba(0, 0, 0, 0.3)"
                          strokeWidth="0.5"
                          rx={3}
                        />
                        
                        {/* Country name */}
                        <text
                          x={country.x}
                          y={country.y - markerSize - labelHeight + fontSize - 2}
                          textAnchor="middle"
                          fontSize={fontSize}
                          fontWeight="600"
                          fill="#2c3e50"
                        >
                          {country.name}
                        </text>
                        
                        {/* Percentage */}
                        <text
                          x={country.x}
                          y={country.y - markerSize - 4}
                          textAnchor="middle"
                          fontSize={fontSize - 1}
                          fontWeight="500"
                          fill="#e74c3c"
                        >
                          {country.percentage.toFixed(1)}%
                        </text>
                      </g>
                    )}
                    
                    {/* Show simplified label when zoomed in */}
                    {zoom > 2 && (
                      <text
                        x={country.x}
                        y={country.y - markerSize - 5}
                        textAnchor="middle"
                        fontSize={Math.max(6, 8 / zoom)}
                        fontWeight="600"
                        fill="#2c3e50"
                        stroke="#fff"
                        strokeWidth={0.5}
                      >
                        {country.percentage.toFixed(1)}%
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Loading indicator */}
        {!imageLoaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.9)',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <p>Loading world map...</p>
          </div>
        )}
      </div>

      {/* Map Info */}
      <div className="map-info">
        <p>
          🖱️ Scroll to zoom • 🖱️ Drag to pan when zoomed • 
          Using same world texture as 3D globe for consistency •
          Zoom-responsive labels for optimal readability
        </p>
      </div>
    </div>
  );
};

export default SalesCountry2DMap; 
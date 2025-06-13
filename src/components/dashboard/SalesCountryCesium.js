// CesiumJS 3D Globe Component
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSalesData } from '../../contexts/SalesDataContext';
import './SalesCountryCesium.css';
import countryCoordinates from './countryCoordinates';
import './SalesCountryMap.css';

const SalesCountryCesium = () => {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  const { salesData, selectedDivision, loading: salesLoading } = useSalesData();
  const [countries, setCountries] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cesiumLoaded, setCesiumLoaded] = useState(false);

  const getCountriesFromExcel = useCallback(() => {
    if (!salesData || !selectedDivision) return [];

    const divisionCode = selectedDivision.split('-')[0];
    const countriesSheetName = `${divisionCode}-Countries`;
    const countriesData = salesData[countriesSheetName] || [];

    const countries = [];
    
    // Start from row 4 (index 3) to skip headers
    for (let i = 3; i < countriesData.length; i++) {
      const row = countriesData[i];
      if (row && row[0]) {
        const countryName = row[0].toString().trim();
        if (countryName && !countries.find(c => c.name === countryName)) {
          countries.push({
            name: countryName,
            percentage: getCountryPercentage(countryName, countriesData)
          });
        }
      }
    }

    return countries;
  }, [salesData, selectedDivision]);

  const getCountryPercentage = (countryName, countriesData) => {
    // Find the row with this country name
    const countryRow = countriesData.find(row => 
      row && row[0] && row[0].toString().toLowerCase() === countryName.toLowerCase()
    );
    
    if (!countryRow) return 0;

    // Calculate total for latest available period
    let totalValue = 0;
    let countryValue = 0;

    // Sum all values from the country row (excluding first column which is country name)
    for (let i = 1; i < countryRow.length; i++) {
      const value = parseFloat(countryRow[i]);
      if (!isNaN(value)) {
        countryValue += value;
      }
    }

    // Calculate total for all countries for the same period
    for (let rowIndex = 3; rowIndex < countriesData.length; rowIndex++) {
      const row = countriesData[rowIndex];
      if (row && row[0]) {
        for (let i = 1; i < row.length; i++) {
          const value = parseFloat(row[i]);
          if (!isNaN(value)) {
            totalValue += value;
          }
        }
      }
    }

    return totalValue > 0 ? (countryValue / totalValue) * 100 : 0;
  };

  const getCountryCoordinates = (countryName) => {
    // Handle country name mappings
    const nameMap = {
      'UAE': 'United Arab Emirates',
      'KSA': 'Saudi Arabia',
      'USA': 'United States of America',
      'UK': 'United Kingdom'
    };

    // Try direct match first
    if (countryCoordinates[countryName]) {
      return countryCoordinates[countryName];
    }
    
    // Try with mapping
    const mappedName = nameMap[countryName];
    if (mappedName && countryCoordinates[mappedName]) {
      return countryCoordinates[mappedName];
    }
    
    // Try case-insensitive search
    const found = Object.keys(countryCoordinates).find(key => 
      key.toLowerCase() === countryName.toLowerCase()
    );
    
    if (found) {
      return countryCoordinates[found];
    }
    
    // Try partial match
    const partialMatch = Object.keys(countryCoordinates).find(key => 
      key.toLowerCase().includes(countryName.toLowerCase()) ||
      countryName.toLowerCase().includes(key.toLowerCase())
    );
    
    return partialMatch ? countryCoordinates[partialMatch] : null;
  };

  const getMarkerColor = (percentage, countryName) => {
    if (countryName.toLowerCase().includes('uae') || countryName.toLowerCase().includes('emirates')) {
      return { r: 0, g: 255, b: 0, a: 1.0 }; // Lime for UAE (local)
    } else if (percentage >= 10) {
      return { r: 255, g: 0, b: 0, a: 1.0 }; // Red for high export
    } else if (percentage >= 5) {
      return { r: 255, g: 165, b: 0, a: 1.0 }; // Orange for medium export
    } else if (percentage >= 2) {
      return { r: 255, g: 255, b: 0, a: 1.0 }; // Yellow for low-medium export
    } else {
      return { r: 0, g: 255, b: 255, a: 1.0 }; // Cyan for very low export
    }
  };

  const initializeCesium = useCallback(() => {
    if (!cesiumLoaded || isInitialized || !cesiumContainer.current) {
      console.log('Cesium initialization blocked:', { cesiumLoaded, isInitialized, container: !!cesiumContainer.current });
      return;
    }

    console.log('Starting Cesium initialization...');

    try {
      const Cesium = window.Cesium;
      
      // Set Cesium Ion access token to default (for basic functionality)
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk';
      
      // Create viewer with simple, working configuration
      const viewer = new Cesium.Viewer(cesiumContainer.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: true,
        animation: false,
        timeline: false,
        fullscreenButton: true,
        vrButton: false,
        selectionIndicator: true,
        infoBox: true,
        scene3DOnly: false,
        requestRenderMode: false,
        maximumRenderTimeChange: Infinity,
        fullscreenElement: cesiumContainer.current
      });

      console.log('Cesium viewer created successfully');

      // Remove all default imagery layers
      viewer.imageryLayers.removeAll();
      
      // Add the 8K texture as primary imagery
      let imageryAdded = false;
      try {
        console.log('Loading 8K Earth texture...');
        const imageryProvider = new Cesium.SingleTileImageryProvider({
          url: '/assets/8k_earth.jpg'
        });
        viewer.imageryLayers.addImageryProvider(imageryProvider);
        imageryAdded = true;
        console.log('8K Earth texture loaded successfully');
      } catch (error) {
        console.warn('8K texture failed, trying fallback...', error);
      }

      // If 8K texture failed, use Cesium World Imagery
      if (!imageryAdded) {
        try {
          const worldImagery = Cesium.createWorldImagery();
          viewer.imageryLayers.addImageryProvider(worldImagery);
          imageryAdded = true;
          console.log('Cesium World Imagery loaded as fallback');
        } catch (error) {
          console.warn('World imagery failed, using default...', error);
        }
      }

      // Final fallback to Bing Maps
      if (!imageryAdded) {
        try {
          const bingProvider = new Cesium.BingMapsImageryProvider({
            url: 'https://dev.virtualearth.net',
            key: '', // Will use default
            mapStyle: Cesium.BingMapsStyle.AERIAL
          });
          viewer.imageryLayers.addImageryProvider(bingProvider);
          console.log('Bing Maps loaded as final fallback');
        } catch (error) {
          console.error('All imagery providers failed:', error);
        }
      }

      // Configure globe appearance
      viewer.scene.globe.show = true;
      viewer.scene.globe.enableLighting = false; // Disable lighting for consistent visibility
      viewer.scene.skyBox.show = true;
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      
      // Set camera to show UAE region properly zoomed out (6 clicks worth)
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(55.296249, 25.276987, 27731640), // UAE region, properly zoomed out
        orientation: {
          heading: 0.0,
          pitch: -Math.PI / 6, // 30 degrees down for better view
          roll: 0.0
        }
      });

      // Configure controls with much slower zoom and safe limits
      viewer.scene.screenSpaceCameraController.enableZoom = true;


      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableTilt = true;
      viewer.scene.screenSpaceCameraController.enableTranslate = true;
      viewer.scene.screenSpaceCameraController.wheelZoomSpeedMultiplier = 0.01; // Extremely slow zoom
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000.0; // Safer minimum distance
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 30000000; // Safer maximum distance
      
      // Add error handling for rendering issues
      viewer.scene.renderError.addEventListener(function(scene, error) {
        console.error('Cesium render error:', error);
        // Try to recover by resetting camera position to UAE region
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(55.296249, 25.276987, 27731640),
          orientation: {
            heading: 0.0,
            pitch: -Math.PI / 6,
            roll: 0.0
          }
        });
      });

      // Override home button
      viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
        e.cancel = true;
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(55.296249, 25.276987, 27731640), // Same as default view - properly zoomed out
          orientation: {
            heading: 0.0,
            pitch: -Math.PI / 6, // 30 degrees down for better view
            roll: 0.0
          },
          duration: 2.0
        });
      });



      // Store viewer reference
      viewerRef.current = viewer;
      setIsInitialized(true);

      // Add custom zoom buttons
      const toolbar = document.createElement('div');
      toolbar.className = 'cesium-zoom-toolbar';
      toolbar.style.position = 'absolute';
      toolbar.style.top = '60px';
      toolbar.style.right = '10px';
      toolbar.style.zIndex = '1000';
      toolbar.style.display = 'flex';
      toolbar.style.flexDirection = 'column';
      toolbar.style.gap = '5px';

      // Zoom In button
      const zoomInButton = document.createElement('button');
      zoomInButton.innerHTML = '+';
      zoomInButton.className = 'cesium-zoom-button';
      zoomInButton.style.width = '40px';
      zoomInButton.style.height = '40px';
      zoomInButton.style.backgroundColor = '#48b';
      zoomInButton.style.color = 'white';
      zoomInButton.style.border = 'none';
      zoomInButton.style.borderRadius = '5px';
      zoomInButton.style.fontSize = '20px';
      zoomInButton.style.cursor = 'pointer';
      zoomInButton.style.fontWeight = 'bold';
      zoomInButton.title = 'Zoom In';
      
      zoomInButton.onclick = () => {
        try {
          const camera = viewer.camera;
          const currentHeight = camera.positionCartographic.height;
          
          // Dynamic zoom factor based on current height (same as mouse wheel)
          const zoomFactor = 0.15; // 15% closer each click
          const newHeight = currentHeight * (1 - zoomFactor);
          
          // Safe zoom with bounds checking
          if (newHeight > 1000) { // Minimum zoom distance
            // Get current position and direction
            const currentPosition = camera.position.clone();
            const ellipsoid = viewer.scene.globe.ellipsoid;
            const cartographic = ellipsoid.cartesianToCartographic(currentPosition);
            
            // Calculate new position with same lat/lon but new height
            const newPosition = Cesium.Cartesian3.fromRadians(
              cartographic.longitude,
              cartographic.latitude, 
              newHeight
            );
            
            // Smoothly move camera to new position
            camera.flyTo({
              destination: newPosition,
              duration: 0.3, // Smooth 0.3 second animation
              easingFunction: Cesium.EasingFunction.CUBIC_OUT
            });
          }
    } catch (error) {
          console.warn('Zoom in error:', error);
        }
      };

      // Zoom Out button
      const zoomOutButton = document.createElement('button');
      zoomOutButton.innerHTML = '−';
      zoomOutButton.className = 'cesium-zoom-button';
      zoomOutButton.style.width = '40px';
      zoomOutButton.style.height = '40px';
      zoomOutButton.style.backgroundColor = '#48b';
      zoomOutButton.style.color = 'white';
      zoomOutButton.style.border = 'none';
      zoomOutButton.style.borderRadius = '5px';
      zoomOutButton.style.fontSize = '20px';
      zoomOutButton.style.cursor = 'pointer';
      zoomOutButton.style.fontWeight = 'bold';
      zoomOutButton.title = 'Zoom Out';
      
      zoomOutButton.onclick = () => {
        try {
          const camera = viewer.camera;
          const currentHeight = camera.positionCartographic.height;
          
          // Dynamic zoom factor based on current height (same as mouse wheel)
          const zoomFactor = 0.15; // 15% farther each click
          const newHeight = currentHeight * (1 + zoomFactor);
          
          // Safe zoom with bounds checking
          if (newHeight < 40000000) { // Maximum zoom distance
            // Get current position and direction
            const currentPosition = camera.position.clone();
            const ellipsoid = viewer.scene.globe.ellipsoid;
            const cartographic = ellipsoid.cartesianToCartographic(currentPosition);
            
            // Calculate new position with same lat/lon but new height
            const newPosition = Cesium.Cartesian3.fromRadians(
              cartographic.longitude,
              cartographic.latitude, 
              newHeight
            );
            
            // Smoothly move camera to new position
            camera.flyTo({
              destination: newPosition,
              duration: 0.3, // Smooth 0.3 second animation
              easingFunction: Cesium.EasingFunction.CUBIC_OUT
            });
          }
        } catch (error) {
          console.warn('Zoom out error:', error);
        }
      };

      toolbar.appendChild(zoomInButton);
      toolbar.appendChild(zoomOutButton);
      cesiumContainer.current.appendChild(toolbar);
      
      console.log('Cesium initialization completed successfully');

      // Add country markers if data is available
      if (countries.length > 0) {
        console.log('Adding markers for', countries.length, 'countries');
        addCountryMarkers(viewer);
      }

    } catch (error) {
      console.error('Critical error in Cesium initialization:', error);
      setIsInitialized(false);
    }
  }, [cesiumLoaded, isInitialized]);

  const addCountryMarkers = useCallback((viewer) => {
    console.log('addCountryMarkers called with:', { viewer: !!viewer, countries: countries });
    if (!viewer || !countries.length) {
      console.log('Returning early - viewer or countries missing');
      return;
    }

    const Cesium = window.Cesium;
    
    // Clear existing entities
    viewer.entities.removeAll();

    console.log('Adding markers for countries:', countries);

    countries.forEach(country => {
      console.log('Processing country:', country);
      const coordinates = getCountryCoordinates(country.name);
      console.log('Coordinates for', country.name, ':', coordinates);
      if (!coordinates) {
        console.log('No coordinates found for:', country.name);
        return;
      }

      const [longitude, latitude] = coordinates;
      const color = getMarkerColor(country.percentage, country.name);

      console.log('Adding marker for:', country.name, 'at', longitude, latitude, 'with percentage:', country.percentage);

      // Add point entity
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
        point: {
          pixelSize: Math.max(12, Math.min(35, 12 + (country.percentage * 0.8))),
          color: Cesium.Color.fromBytes(color.r, color.g, color.b, Math.floor(color.a * 255)),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.5, 1.5e7, 0.8)
        },
        label: {
          text: `${country.name}\n${country.percentage.toFixed(1)}%`,
          font: 'bold 12pt Arial',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -60),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 1.0),
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          show: true
        },
        description: `
          <div style="padding: 10px;">
            <h3>${country.name}</h3>
            <p><strong>Sales Percentage:</strong> ${country.percentage.toFixed(2)}%</p>
            <p><strong>Market Type:</strong> ${country.name.toLowerCase().includes('uae') ? 'Local Market' : 'Export Market'}</p>
          </div>
        `
      });
    });
  }, [countries]);

  // Load Cesium from CDN
  useEffect(() => {
    if (window.Cesium) {
      setCesiumLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Cesium.js';
    script.async = true;
    script.onload = () => {
      setCesiumLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Cesium');
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Extract countries when data changes
  useEffect(() => {
    const extractedCountries = getCountriesFromExcel();
    console.log('Extracted countries:', extractedCountries);
    console.log('Sales data:', salesData);
    console.log('Selected division:', selectedDivision);
    setCountries(extractedCountries);
  }, [getCountriesFromExcel, salesData, selectedDivision]);

  // Initialize Cesium when ready
  useEffect(() => {
    initializeCesium();
  }, [initializeCesium]);

  // Update markers when countries change
  useEffect(() => {
    if (viewerRef.current && countries.length > 0) {
      addCountryMarkers(viewerRef.current);
    }
  }, [countries, addCountryMarkers]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  if (salesLoading || !cesiumLoaded) {
    return (
      <div className="sales-country-map">
        <div className="map-loading">
          <p>Loading {salesLoading ? 'sales data' : 'Cesium 3D Globe'}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-country-map">
      <div className="map-header">
        <h3>Sales by Country - 3D Globe View</h3>
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'lime' }}></span>
            <span>UAE (Local)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'red' }}></span>
            <span>High Export (≥10%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'orange' }}></span>
            <span>Medium Export (5-10%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'yellow' }}></span>
            <span>Low-Medium Export (2-5%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'cyan' }}></span>
            <span>Low Export (&lt;2%)</span>
          </div>
        </div>
      </div>
      <div 
        ref={cesiumContainer} 
        className="cesium-container"
        style={{ 
          width: '100%', 
          height: '80vh', 
          minHeight: '600px',
          border: '1px solid #ccc',
          borderRadius: '8px'
        }}
      />

    </div>
  );
};

export default SalesCountryCesium; 
// CesiumJS 3D Globe Component
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import countryCoordinates from './countryCoordinates';
import './SalesCountryMap.css';

const SalesCountryCesium = () => {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  const { salesData, loading: salesLoading } = useSalesData();
  const { selectedDivision } = useExcelData();
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
    if (!cesiumLoaded || isInitialized || !cesiumContainer.current) return;

    try {
      const Cesium = window.Cesium;
      
      // Create viewer without imagery first
      const viewer = new Cesium.Viewer(cesiumContainer.current, {
        // Start with no imagery to avoid conflicts
        imageryProvider: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: true,
        vrButton: false,
        selectionIndicator: true,
        infoBox: true,
        scene3DOnly: false
      });

      // Apply world texture directly to globe material with proper shader
      viewer.scene.globe.material = new Cesium.Material({
        fabric: {
          type: 'Image',
          uniforms: {
            image: '/assets/world.jpg'
          },
          source: `
            uniform sampler2D image;
            czm_material czm_getMaterial(czm_materialInput materialInput) {
              czm_material material = czm_getDefaultMaterial(materialInput);
              vec2 st = materialInput.st;
              vec4 colorSample = texture(image, st);
              material.diffuse = colorSample.rgb;
              material.alpha = colorSample.a;
              return material;
            }
          `
        }
      });

      // Set initial camera position (focused on UAE region but zoomed out to see globe)
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(55.296249, 25.276987, 15000000)
      });

      // Configure globe appearance - balanced settings for map visibility
      viewer.scene.globe.enableLighting = true;  // Enable lighting to show texture
      viewer.scene.globe.dynamicAtmosphereLighting = false;  // Keep atmosphere minimal
      viewer.scene.globe.showWaterEffect = false;  // Keep water effect off to prevent blue
      viewer.scene.skyBox.show = false;  // Keep skybox off
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      // Remove the gray base color to let the map texture show
      
      // Ensure globe is visible
      viewer.scene.globe.show = true;
      
      // Simple zoom controls (slower zooming)
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1.0;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 40075000;
      viewer.scene.screenSpaceCameraController.enableZoom = true;

      viewerRef.current = viewer;
      setIsInitialized(true);

      // Add markers for countries
      addCountryMarkers(viewer);

    } catch (error) {
      console.error('Error initializing Cesium:', error);
      // Fallback: try with basic ellipsoid terrain
             try {
         const Cesium = window.Cesium;
         const viewer = new Cesium.Viewer(cesiumContainer.current, {
           imageryProvider: false,
           terrainProvider: new Cesium.EllipsoidTerrainProvider(),
           baseLayerPicker: false,
           geocoder: false,
           homeButton: true,
           sceneModePicker: true,
           navigationHelpButton: false,
           animation: false,
           timeline: false,
           fullscreenButton: true,
           vrButton: false,
           selectionIndicator: true,
           infoBox: true
         });

         viewer.camera.setView({
           destination: Cesium.Cartesian3.fromDegrees(55.296249, 25.276987, 15000000)
         });

         // Apply world texture directly to globe material with proper shader
         viewer.scene.globe.material = new Cesium.Material({
           fabric: {
             type: 'Image',
             uniforms: {
               image: '/assets/world.jpg'
             },
             source: `
               uniform sampler2D image;
               czm_material czm_getMaterial(czm_materialInput materialInput) {
                 czm_material material = czm_getDefaultMaterial(materialInput);
                 vec2 st = materialInput.st;
                 vec4 colorSample = texture(image, st);
                 material.diffuse = colorSample.rgb;
                 material.alpha = colorSample.a;
                 return material;
               }
             `
           }
         });

        viewerRef.current = viewer;
        setIsInitialized(true);
        addCountryMarkers(viewer);
      } catch (fallbackError) {
        console.error('Fallback Cesium initialization failed:', fallbackError);
      }
    }
  }, [cesiumLoaded, isInitialized, countries]);

  const addCountryMarkers = useCallback((viewer) => {
    if (!viewer || !countries.length) return;

    const Cesium = window.Cesium;
    
    // Clear existing entities
    viewer.entities.removeAll();

    countries.forEach(country => {
      const coordinates = getCountryCoordinates(country.name);
      if (!coordinates) return;

      const [longitude, latitude] = coordinates;
      const color = getMarkerColor(country.percentage, country.name);

      // Add point entity
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
        point: {
          pixelSize: Math.max(8, Math.min(25, 8 + (country.percentage * 0.5))),
          color: Cesium.Color.fromBytes(color.r, color.g, color.b, Math.floor(color.a * 255)),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5)
        },
        label: {
          text: `${country.name}\n${country.percentage.toFixed(1)}%`,
          font: '12pt Arial',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -50),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5)
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
    setCountries(extractedCountries);
  }, [getCountriesFromExcel]);

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
          height: '500px', 
          border: '1px solid #ccc',
          borderRadius: '8px'
        }}
      />
      <div className="map-info">
        <p>Showing {countries.length} countries with sales data for {selectedDivision} division</p>
        <p>Click on markers for detailed information • Use mouse to rotate and zoom</p>
      </div>
    </div>
  );
};

export default SalesCountryCesium; 
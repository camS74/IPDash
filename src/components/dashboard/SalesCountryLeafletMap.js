import React, { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import countryCoordinates from './countryCoordinates';

// Fix for default markers in webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  iconUrl: '/leaflet/images/marker-icon.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
});

const SalesCountryLeafletMap = () => {
  const { salesData } = useSalesData();
  const { selectedDivision } = useExcelData(); // Get selectedDivision from same context as Dashboard
  const [countries, setCountries] = useState([]);

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

  // Load countries data when division changes
  useEffect(() => {
    const loadedCountries = getCountriesFromExcel();
    setCountries(loadedCountries);
  }, [getCountriesFromExcel]);

  useEffect(() => {
    const map = L.map('leaflet-map', {
      minZoom: 2,
      maxZoom: 18,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
      worldCopyJump: false
    }).setView([20, 0], 2);

    // English-only map tile options:
    // Option 1: CARTO Voyager (clean, English labels)
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 18,
      noWrap: true
    }).addTo(map);
    
    // Option 2: CARTO Positron (minimal, English-only)
    // L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
    //   attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    //   maxZoom: 18,
    // }).addTo(map);
    
    // Option 3: Stamen Toner (black & white, English)
    // L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
    //   attribution: 'Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap contributors',
    //   maxZoom: 18,
    // }).addTo(map);

    // Utility to create a custom SVG icon with % of sales inside the pin
    function createPinIcon(percentage) {
      const value = percentage.toFixed(1);
      const svg = `
        <svg width="40" height="54" viewBox="0 0 40 54" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 54C20 54 0 34.5 0 20C0 8.9543 8.9543 0 20 0C31.0457 0 40 8.9543 40 20C40 34.5 20 54 20 54Z" fill="#003366"/>
          <circle cx="20" cy="20" r="17" fill="white"/>
          <text x="20" y="22" text-anchor="middle" fill="#003366" font-size="11" font-family="Arial" font-weight="bold" alignment-baseline="middle">${value}</text>
          <text x="20" y="32" text-anchor="middle" fill="#003366" font-size="9" font-family="Arial" font-weight="bold" alignment-baseline="middle">%</text>
        </svg>
      `;
      return L.divIcon({
        className: '', // No default styles
        html: svg,
        iconSize: [40, 54],
        iconAnchor: [20, 54],
        popupAnchor: [0, -54]
      });
    }

    // Add markers for countries with sales data
    countries.forEach((country) => {
      const coordinates = getCountryCoordinates(country.name);
      if (coordinates) {
        const icon = createPinIcon(country.percentage);
        L.marker([coordinates[1], coordinates[0]], { icon })
          .addTo(map)
          .bindPopup(`<b>${country.name}</b><br/>Market Share: ${country.percentage.toFixed(2)}%`);
      }
    });

    return () => map.remove();
  }, [countries]);

  return <div id="leaflet-map" className="leaflet-container" />;
};

export default SalesCountryLeafletMap;
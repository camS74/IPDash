
import React, { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSalesData } from '../../contexts/SalesDataContext';
import countryCoordinates from './countryCoordinates';

// Fix for default markers in webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  iconUrl: '/leaflet/images/marker-icon.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
});

const SalesCountryLeafletMap = () => {
  const { salesData, selectedDivision } = useSalesData();
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
    const map = L.map('leaflet-map').setView([20, 0], 2);

    // English-only map tile options:
    // Option 1: CARTO Voyager (clean, English labels)
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 18,
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

    // Add markers for countries with sales data
    countries.forEach((country) => {
      const coordinates = getCountryCoordinates(country.name);
      if (coordinates) {
        // Create custom icon based on percentage
        const markerColor = country.percentage >= 10 ? 'red' : 
                           country.percentage >= 5 ? 'orange' : 
                           country.percentage >= 2 ? 'yellow' : 'blue';
        
        L.marker([coordinates[1], coordinates[0]])
          .addTo(map)
          .bindPopup(`<b>${country.name}</b><br/>Market Share: ${country.percentage.toFixed(2)}%`);
      }
    });

    return () => map.remove();
  }, [countries]);

  return <div id="leaflet-map" className="leaflet-container" />;
};

export default SalesCountryLeafletMap;
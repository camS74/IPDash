import React, { useState, useEffect } from 'react';
import countryCoordinates from './countryCoordinates';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import './CountryReference.css';

const CountryReference = () => {
  const { salesData, loading: salesLoading } = useSalesData();
  const { selectedDivision } = useExcelData(); // Get selectedDivision from same context as Dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [excelCountries, setExcelCountries] = useState(new Map()); // Store both original and matched names

  // Enhanced country name matching using fuzzy logic
  const findBestCountryMatch = (excelCountryName) => {
    if (!excelCountryName) return null;

    const excelName = excelCountryName.toLowerCase().trim();
    
    // Direct exact match first
    const exactMatch = Object.keys(countryCoordinates).find(
      country => country.toLowerCase() === excelName
    );
    if (exactMatch) return exactMatch;

    // Common mappings and variations
    const commonMappings = {
      'uae': 'United Arab Emirates',
      'emirates': 'United Arab Emirates',
      'saudi arabia': 'Saudi Arabia',
      'kingdom of saudi arabia': 'Saudi Arabia',
      'ksa': 'Saudi Arabia',
      'usa': 'United States of America',
      'us': 'United States of America',
      'united states': 'United States of America',
      'america': 'United States of America',
      'uk': 'United Kingdom',
      'britain': 'United Kingdom',
      'great britain': 'United Kingdom',
      'england': 'United Kingdom',
      'russia': 'Russia',
      'russian federation': 'Russia',
      'south korea': 'South Korea',
      'korea': 'South Korea',
      'republic of korea': 'South Korea',
      'north korea': 'North Korea',
      'democratic people\'s republic of korea': 'North Korea',
      'dprk': 'North Korea',
      'iran': 'Iran',
      'islamic republic of iran': 'Iran',
      'syria': 'Syria',
      'syrian arab republic': 'Syria',
      'congo': 'Congo',
      'republic of congo': 'Congo',
      'democratic republic of congo': 'Democratic Republic of Congo',
      'dr congo': 'Democratic Republic of Congo',
      'drc': 'Democratic Republic of Congo',
      'ivory coast': 'Ivory Coast',
      'cote d\'ivoire': 'Ivory Coast',
      'czech republic': 'Czech Republic',
      'czechia': 'Czech Republic',
      'slovakia': 'Slovakia',
      'slovak republic': 'Slovakia',
      'bosnia': 'Bosnia and Herzegovina',
      'herzegovina': 'Bosnia and Herzegovina',
      'macedonia': 'North Macedonia',
      'north macedonia': 'North Macedonia',
      'fyrom': 'North Macedonia',
      'myanmar': 'Myanmar',
      'burma': 'Myanmar',
      'cape verde': 'Cabo Verde',
      'cabo verde': 'Cabo Verde',
      'swaziland': 'Eswatini',
      'eswatini': 'Eswatini',
      'hong kong': 'Hong Kong',
      'macau': 'Macau',
      'macao': 'Macau',
      'taiwan': 'Taiwan',
      'republic of china': 'Taiwan',
      'palestine': 'Palestine',
      'palestinian territory': 'Palestine',
      'west bank': 'Palestine',
      'gaza': 'Palestine'
    };

    // Check common mappings
    const mappedCountry = commonMappings[excelName];
    if (mappedCountry && countryCoordinates[mappedCountry]) {
      return mappedCountry;
    }

    // Partial matching - check if Excel name is contained in any country name
    const partialMatch = Object.keys(countryCoordinates).find(country => {
      const countryLower = country.toLowerCase();
      return countryLower.includes(excelName) || excelName.includes(countryLower.split(' ')[0]);
    });
    if (partialMatch) return partialMatch;

    // Word-based matching - check individual words
    const excelWords = excelName.split(/\s+/);
    const wordMatch = Object.keys(countryCoordinates).find(country => {
      const countryWords = country.toLowerCase().split(/\s+/);
      return excelWords.some(excelWord => 
        countryWords.some(countryWord => 
          countryWord.includes(excelWord) || excelWord.includes(countryWord)
        )
      );
    });
    if (wordMatch) return wordMatch;

    return null;
  };

  // Function to get countries from the selected division only
  const getAllCountriesFromExcel = () => {
    const countriesMap = new Map(); // originalName -> matchedName
    
    if (!salesData || Object.keys(salesData).length === 0) {
      return countriesMap;
    }
    
    if (!selectedDivision) {
      return countriesMap;
    }
    
    const divisionName = selectedDivision; // Already just the division name
    const countriesSheetName = `${divisionName}-Countries`;
    
    const countriesData = salesData[countriesSheetName];
    
    if (countriesData && countriesData.length > 0) {
      const countries = [];
      for (let i = 3; i < countriesData.length; i++) { // Starting from row 3 (index 3)
        const row = countriesData[i];
        if (row && row[0] && typeof row[0] === 'string') { // First column (index 0)
          const countryName = row[0].toString().trim();
          if (!countries.includes(countryName)) {
            countries.push(countryName);
          }
        }
      }
      
      countries.forEach(countryName => {
        const matchedCountry = findBestCountryMatch(countryName);
        if (matchedCountry) {
          countriesMap.set(countryName, matchedCountry);
        }
      });
      
      return countriesMap;
    }
    
    return countriesMap;
  };

  useEffect(() => {
    if (!salesLoading && salesData && Object.keys(salesData).length > 0 && selectedDivision) {
      const countriesMap = getAllCountriesFromExcel();
      setExcelCountries(countriesMap);
    }
  }, [salesData, salesLoading, selectedDivision]);

  // Get unique matched countries from Excel
  const matchedCountriesSet = new Set(Array.from(excelCountries.values()));
  
  const filteredCountries = Object.entries(countryCoordinates).filter(([countryName, coords]) => {
    const matchesSearch = countryName.toLowerCase().includes(searchTerm.toLowerCase());
    const inExcel = matchedCountriesSet.has(countryName);
    
    if (filterType === 'inExcel') return matchesSearch && inExcel;
    if (filterType === 'notInExcel') return matchesSearch && !inExcel;
    return matchesSearch;
  });

  // Get actual Excel countries count (before coordinate matching)
  const actualExcelCountries = Array.from(excelCountries.keys()).length;
  
  const stats = {
    total: Object.keys(countryCoordinates).length,
    inExcel: matchedCountriesSet.size, // Countries with coordinates that match Excel
    inExcelRaw: actualExcelCountries, // Raw countries found in Excel (may not have coordinates)
    notInExcel: Object.keys(countryCoordinates).length - matchedCountriesSet.size
  };

  return (
    <div className="country-reference">
      <div className="country-reference-header">
        <h2>🌍 World Countries Reference</h2>
        <p>Countries from {selectedDivision?.split('-')[0] || 'Selected'} division with geographical coordinates</p>
        
        <div className="stats-summary">
          <div className="stat-box total">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Countries</span>
          </div>
          <div className="stat-box in-excel">
            <span className="stat-number">{stats.inExcel}</span>
            <span className="stat-label">With Coordinates</span>
          </div>
          <div className="stat-box excel-raw">
            <span className="stat-number">{stats.inExcelRaw}</span>
            <span className="stat-label">In Excel Sheet</span>
          </div>
          <div className="stat-box not-in-excel">
            <span className="stat-number">{stats.notInExcel}</span>
            <span className="stat-label">Not in Excel</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Countries ({stats.total})
          </button>
          <button
            className={`filter-btn in-excel ${filterType === 'inExcel' ? 'active' : ''}`}
            onClick={() => setFilterType('inExcel')}
          >
            In Excel Data ({stats.inExcel})
          </button>
          <button
            className={`filter-btn not-in-excel ${filterType === 'notInExcel' ? 'active' : ''}`}
            onClick={() => setFilterType('notInExcel')}
          >
            Not in Excel ({stats.notInExcel})
          </button>
        </div>
      </div>

      <div className="countries-table-container">
        <table className="countries-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Country Name</th>
              <th>Longitude</th>
              <th>Latitude</th>
              <th>Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {filteredCountries.map(([countryName, coords]) => {
              const inExcel = matchedCountriesSet.has(countryName);
              // Find original Excel name if matched
              const originalName = Array.from(excelCountries.entries())
                .find(([orig, matched]) => matched === countryName)?.[0];
              
              return (
                <tr 
                  key={countryName} 
                  className={`country-row ${inExcel ? 'in-excel' : 'not-in-excel'}`}
                >
                  <td className="status-cell">
                    <span className={`status-indicator ${inExcel ? 'in-excel' : 'not-in-excel'}`}>
                      {inExcel ? '✅' : '⚪'}
                    </span>
                  </td>
                  <td className="country-name-cell">
                    <div className="country-name">{countryName}</div>
                    {originalName && originalName !== countryName && (
                      <div className="excel-name">Excel: "{originalName}"</div>
                    )}
                  </td>
                  <td className="coord-cell">{coords[0].toFixed(4)}°</td>
                  <td className="coord-cell">{coords[1].toFixed(4)}°</td>
                  <td className="coords-array">[{coords[0].toFixed(4)}, {coords[1].toFixed(4)}]</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredCountries.length === 0 && (
        <div className="no-results">
          <h3>No countries found</h3>
          <p>Try adjusting your search term or filter selection.</p>
        </div>
      )}
    </div>
  );
};

export default CountryReference;

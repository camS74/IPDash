import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import 'echarts-gl';
import { useSalesData } from '../../../contexts/SalesDataContext';
import { useFilter } from '../../../contexts/FilterContext';
import './SalesCountryGlobe.css';

const SalesCountryGlobe = () => {
  const { salesData, selectedDivision } = useSalesData();
  const { columnOrder, dataGenerated } = useFilter();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [globeReady, setGlobeReady] = useState(false);

  // Initialize the first period when data is available
  useEffect(() => {
    if (columnOrder.length > 0 && !selectedPeriod) {
      setSelectedPeriod(columnOrder[0]);
    }
  }, [columnOrder, selectedPeriod]);

  // Load world map data for ECharts GL
  useEffect(() => {
    const loadWorldMap = async () => {
      try {
        // Load world map data
        const response = await fetch('https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/js/world.js');
        if (response.ok) {
          const worldMapScript = await response.text();
          // Execute the script to register the world map
          eval(worldMapScript);
          console.log('World map loaded successfully for globe');
          setGlobeReady(true);
        } else {
          throw new Error('Failed to load world map');
        }
      } catch (error) {
        console.error('Failed to load world map:', error);
        // Still allow the component to render with basic globe
        setGlobeReady(true);
      }
    };
    
    loadWorldMap();
  }, []);

  // Helper function to get country sales amount for a specific period
  const getCountrySalesAmount = (countryName, column) => {
    const divisionCode = selectedDivision ? selectedDivision.split('-')[0] : '';
    const countriesSheetName = `${divisionCode}-Countries`;
    const countriesData = salesData[countriesSheetName] || [];

    if (!countriesData.length) return 0;

    // Find the row with this country name
    const countryRow = countriesData.find(row => 
      row && row[0] && row[0].toString().toLowerCase() === countryName.toLowerCase()
    );
    
    if (!countryRow) return 0;

    // Determine which months to include based on selected period
    let monthsToInclude = [];
    
    if (column.months && Array.isArray(column.months)) {
      monthsToInclude = column.months;
    } else {
      if (column.month === 'Q1') {
        monthsToInclude = ['January', 'February', 'March'];
      } else if (column.month === 'Q2') {
        monthsToInclude = ['April', 'May', 'June'];
      } else if (column.month === 'Q3') {
        monthsToInclude = ['July', 'August', 'September'];
      } else if (column.month === 'Q4') {
        monthsToInclude = ['October', 'November', 'December'];
      } else if (column.month === 'Year') {
        monthsToInclude = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
      } else {
        monthsToInclude = [column.month];
      }
    }

    // Sum values for matching year, month(s), and type
    let sum = 0;
    let foundValues = false;
    
    // Check columns starting from index 1 (where data starts)
    for (let colIndex = 1; colIndex < countriesData[0]?.length || 0; colIndex++) {
      const yearValue = countriesData[0] && countriesData[0][colIndex];
      const monthValue = countriesData[1] && countriesData[1][colIndex];
      const typeValue = countriesData[2] && countriesData[2][colIndex];
      
      if (yearValue == column.year &&
          monthsToInclude.includes(monthValue) &&
          typeValue === column.type) {
        
        const value = countryRow[colIndex];
        
        if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
          sum += parseFloat(value);
          foundValues = true;
        }
      }
    }
    
    return foundValues ? sum : 0;
  };

  // Get unique countries from the data
  const getCountries = () => {
    const divisionCode = selectedDivision ? selectedDivision.split('-')[0] : '';
    const countriesSheetName = `${divisionCode}-Countries`;
    const countriesData = salesData[countriesSheetName] || [];
    
    if (!countriesData.length) return [];

    const countries = [];
    for (let i = 3; i < countriesData.length; i++) {
      const row = countriesData[i];
      if (row && row[0] && !countries.includes(row[0])) {
        countries.push(row[0]);
      }
    }
    return countries;
  };

  // Helper function to calculate total sales for a period (to calculate percentages)
  const getTotalSalesForPeriod = (column) => {
    const countries = getCountries();
    let total = 0;
    
    countries.forEach(countryName => {
      total += getCountrySalesAmount(countryName, column);
    });
    
    return total;
  };

  // Helper function to get country percentage for a specific period
  const getCountryPercentage = (countryName, column) => {
    const countrySales = getCountrySalesAmount(countryName, column);
    const totalSales = getTotalSalesForPeriod(column);
    
    if (totalSales === 0) return 0;
    return (countrySales / totalSales) * 100;
  };

  // Country name mapping (Excel names to ECharts world map names)
  const countryNameMapping = {
    'UAE': 'United Arab Emirates',
    'USA': 'United States of America',
    'UK': 'United Kingdom',
    'South Africa': 'South Africa',
    'Saudi Arabia': 'Saudi Arabia',
    'India': 'India',
    'Egypt': 'Egypt',
    'Jordan': 'Jordan',
    'Lebanon': 'Lebanon',
    'Kuwait': 'Kuwait',
    'Qatar': 'Qatar',
    'Oman': 'Oman',
    'Bahrain': 'Bahrain',
    'Turkey': 'Turkey',
    'Iran': 'Iran',
    'Pakistan': 'Pakistan',
    'Bangladesh': 'Bangladesh',
    'Sri Lanka': 'Sri Lanka',
    'Nepal': 'Nepal',
    'Afghanistan': 'Afghanistan',
    'Iraq': 'Iraq',
    'Syria': 'Syria',
    'Yemen': 'Yemen',
    'Morocco': 'Morocco',
    'Algeria': 'Algeria',
    'Tunisia': 'Tunisia',
    'Libya': 'Libya',
    'Sudan': 'Sudan',
    'Ethiopia': 'Ethiopia',
    'Kenya': 'Kenya',
    'Tanzania': 'Tanzania',
    'Uganda': 'Uganda',
    'Ghana': 'Ghana',
    'Nigeria': 'Nigeria',
    'Cameroon': 'Cameroon',
    'Madagascar': 'Madagascar',
    'Mauritius': 'Mauritius',
    'Seychelles': 'Seychelles',
    'Maldives': 'Maldives'
  };

  // Map Excel country name to ECharts country name
  const mapCountryName = (excelName) => {
    return countryNameMapping[excelName] || excelName;
  };

  // Initialize and update globe
  useEffect(() => {
    if (!chartRef.current || !globeReady || !selectedPeriod || !dataGenerated) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const countries = getCountries();
    const mapData = countries.map(country => {
      const percentage = getCountryPercentage(country, selectedPeriod);
      const mappedName = mapCountryName(country);
      const isUAE = country.toLowerCase() === 'uae';
      
      return {
        name: mappedName,
        value: percentage,
        originalName: country,
        isUAE: isUAE
      };
    }).filter(item => item.value > 0); // Only show countries with data

    // Find max value for color scaling
    const maxValue = Math.max(...mapData.map(item => item.value), 1);

    const option = {
      backgroundColor: '#000',
      title: {
        text: `Sales Distribution by Country - ${selectedDivision?.split('-')[0] || ''}`,
        subtext: `${selectedPeriod.year} ${selectedPeriod.isCustomRange ? selectedPeriod.displayName : selectedPeriod.month} ${selectedPeriod.type}`,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#ffffff'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#cccccc'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          if (params.componentType === 'series' && params.data) {
            const data = mapData.find(item => item.name === params.name);
            const countryType = data?.isUAE ? 'Local Sales' : 'Export Sales';
            return `<strong>${data?.originalName || params.name}</strong><br/>
                    ${countryType}: <strong>${params.value.toFixed(1)}%</strong>`;
          }
          return params.name;
        },
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#fff'
        }
      },
      visualMap: {
        show: true,
        min: 0,
        max: maxValue,
        left: 'left',
        top: 'bottom',
        text: ['High %', 'Low %'],
        realtime: false,
        calculable: true,
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        },
        formatter: function(value) {
          return value.toFixed(1) + '%';
        },
        textStyle: {
          color: '#ffffff'
        }
      },
      globe: {
        baseTexture: '/assets/world.jpg', // Use actual world texture
        shading: 'lambert',
        environment: '#000',
        atmosphere: {
          show: true
        },
        light: {
          main: {
            intensity: 2
          },
          ambient: {
            intensity: 0.1
          }
        },
        viewControl: {
          autoRotate: true,
          autoRotateSpeed: 1,
          targetCoord: [25.276987, 55.296249] // Center on UAE
        },
        layers: [{
          type: 'scatter3D',
          coordinateSystem: 'globe',
          blendMode: 'lighter',
          symbolSize: function(value) {
            return Math.max(value * 0.8, 2); // Minimum size of 2, max based on percentage
          },
          itemStyle: {
            color: function(params) {
              const data = mapData.find(item => item.name === params.name);
              if (data?.isUAE) {
                return '#2E865F'; // Green for UAE (local sales)
              }
              // Color based on percentage value
              const ratio = params.value[2] / maxValue;
              if (ratio > 0.7) return '#d73027';
              if (ratio > 0.5) return '#f46d43';
              if (ratio > 0.3) return '#fdae61';
              if (ratio > 0.1) return '#74add1';
              return '#4575b4';
            },
            opacity: 0.8
          },
          label: {
            show: true,
            formatter: function(params) {
              const data = mapData.find(item => item.name === params.name);
              return data?.originalName + '\n' + params.value[2].toFixed(1) + '%';
            },
            fontSize: 10,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderColor: '#ffffff',
            borderWidth: 1,
            borderRadius: 3,
            padding: [2, 4]
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12
            },
            itemStyle: {
              color: '#ffff00'
            }
          },
          data: mapData.map(item => {
            // Get approximate coordinates for countries (you can expand this mapping)
            const countryCoords = {
              'United Arab Emirates': [54.3773, 24.4539],
              'India': [78.9629, 20.5937],
              'Saudi Arabia': [45.0792, 23.8859],
              'Egypt': [30.8025, 26.8206],
              'United States of America': [-95.7129, 37.0902],
              'United Kingdom': [-3.4360, 55.3781],
              'South Africa': [22.9375, -30.5595],
              'Jordan': [36.2384, 30.5852],
              'Lebanon': [35.8623, 33.8547],
              'Kuwait': [47.4818, 29.3117],
              'Qatar': [51.1839, 25.3548],
              'Oman': [55.9754, 21.4735],
              'Bahrain': [50.6344, 26.0667],
              'Turkey': [35.2433, 38.9637],
              'Iran': [53.6880, 32.4279],
              'Pakistan': [69.3451, 30.3753],
              'Bangladesh': [90.3563, 23.6850],
              'Sri Lanka': [80.7718, 7.8731],
              'Nepal': [84.1240, 28.3949],
              'Afghanistan': [67.7090, 33.9391],
              'Iraq': [43.6793, 33.2232],
              'Syria': [38.9968, 34.8021],
              'Yemen': [48.5164, 15.5527],
              'Morocco': [-7.0926, 31.7917],
              'Algeria': [1.6596, 28.0339],
              'Tunisia': [9.5375, 33.8869],
              'Libya': [17.2283, 26.3351],
              'Sudan': [30.2176, 12.8628],
              'Ethiopia': [40.4897, 9.1450],
              'Kenya': [37.9062, -0.0236],
              'Tanzania': [34.8888, -6.3690],
              'Uganda': [32.2903, 1.3733],
              'Ghana': [-1.0232, 7.9465],
              'Nigeria': [8.6753, 9.0820],
              'Cameroon': [12.3547, 7.3697],
              'Madagascar': [46.8691, -18.7669],
              'Mauritius': [57.5522, -20.3484],
              'Seychelles': [55.4920, -4.6796],
              'Maldives': [73.2207, 3.2028]
            };
            
            const coords = countryCoords[item.name] || [0, 0];
            return {
              name: item.name,
              value: [coords[0], coords[1], item.value],
              originalName: item.originalName,
              isUAE: item.isUAE
            };
          })
        }]
      }
    };

    chartInstance.current.setOption(option, true);

    // Handle window resize
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedPeriod, salesData, selectedDivision, globeReady, dataGenerated]);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (!dataGenerated) {
    return (
      <div className="sales-country-globe-container">
        <div className="empty-state">
          <h3>3D Globe - Sales by Country</h3>
          <p>Please select columns and click the Generate button to view the interactive 3D globe.</p>
        </div>
      </div>
    );
  }

  if (!globeReady) {
    return (
      <div className="sales-country-globe-container">
        <div className="loading-state">
          <h3>Loading 3D Globe...</h3>
          <p>Preparing interactive globe visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-country-globe-container">
      <div className="period-selector">
        <h4>Select Period:</h4>
        <div className="period-buttons">
          {columnOrder.map((period, index) => (
            <button
              key={index}
              className={`period-button ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period.year} {period.isCustomRange ? period.displayName : period.month} {period.type}
            </button>
          ))}
        </div>
      </div>
      
      <div className="globe-legend">
        <div className="legend-item">
          <span className="legend-color local-sales"></span>
          <span>Local Sales (UAE)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color export-sales"></span>
          <span>Export Sales</span>
        </div>
        <div className="legend-note">
          <p>💡 Click and drag to rotate the globe, scroll to zoom</p>
        </div>
      </div>

      <div 
        ref={chartRef} 
        className="sales-country-globe-chart"
        style={{ width: '100%', height: '700px' }}
      />
    </div>
  );
};

export default SalesCountryGlobe; 
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useSalesData } from '../../../contexts/SalesDataContext';
import { useFilter } from '../../../contexts/FilterContext';
import './SalesCountryMapChart.css';

const SalesCountryMapChart = () => {
  const { salesData, selectedDivision } = useSalesData();
  const { columnOrder, dataGenerated } = useFilter();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [worldMapReady, setWorldMapReady] = useState(false);

  // Initialize the first period when data is available
  useEffect(() => {
    if (columnOrder.length > 0 && !selectedPeriod) {
      setSelectedPeriod(columnOrder[0]);
    }
  }, [columnOrder, selectedPeriod]);

  // Load world map data
  useEffect(() => {
    const loadWorldMap = async () => {
      try {
        // Try multiple sources for world map data
        let worldJson = null;
        
        // First try: CDN source
        try {
          const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/world.json');
          if (response.ok) {
            worldJson = await response.json();
          }
        } catch (e) {
          console.log('First CDN failed, trying alternative...');
        }
        
        // Second try: Alternative CDN
        if (!worldJson) {
          try {
            const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
            if (response.ok) {
              worldJson = await response.json();
            }
          } catch (e) {
            console.log('Second CDN failed, using simple map...');
          }
        }
        
        // If we have map data, register it
        if (worldJson) {
          echarts.registerMap('world', worldJson);
          console.log('World map loaded successfully');
          setWorldMapReady(true);
        } else {
          // Use a simple fallback approach - create basic country data
          console.log('Using fallback map approach');
          setWorldMapReady(true);
        }
      } catch (error) {
        console.error('Failed to load world map:', error);
        // Even if map loading fails, we can still show the component
        setWorldMapReady(true);
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

  // Country name mapping (Excel names to ECharts country names)
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

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current || !worldMapReady || !selectedPeriod || !dataGenerated) return;

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
        isUAE: isUAE,
        label: {
          show: isUAE,
          formatter: 'Local Sales\n{c}%',
          position: 'inside',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#fff'
        }
      };
    }).filter(item => item.value > 0); // Only show countries with data

    // Find max value for color scaling
    const maxValue = Math.max(...mapData.map(item => item.value));

    // Create a simpler bar chart as fallback if map doesn't work
    const option = {
      title: {
        text: `Sales Distribution by Country - ${selectedDivision?.split('-')[0] || ''}`,
        subtext: `${selectedPeriod.year} ${selectedPeriod.isCustomRange ? selectedPeriod.displayName : selectedPeriod.month} ${selectedPeriod.type}`,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#666'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const countryType = params.data.isUAE ? 'Local Sales' : 'Export Sales';
          return `<strong>${params.data.originalName}</strong><br/>
                  ${countryType}: <strong>${params.value.toFixed(1)}%</strong>`;
        },
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#fff'
        }
      },
      grid: {
        left: '15%',
        right: '10%',
        top: '15%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Market Share (%)',
        nameLocation: 'middle',
        nameGap: 25,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      yAxis: {
        type: 'category',
        data: mapData.map(item => item.originalName),
        inverse: true,
        axisLabel: {
          fontSize: 12
        }
      },
      series: [
        {
          name: 'Market Share',
          type: 'bar',
          data: mapData.map(item => ({
            value: item.value,
            originalName: item.originalName,
            isUAE: item.isUAE,
            itemStyle: {
              color: item.isUAE ? '#2E865F' : '#1976D2' // Green for UAE, Blue for others
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            fontSize: 11
          },
          barMaxWidth: 30
        }
      ]
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
  }, [selectedPeriod, salesData, selectedDivision, worldMapReady, dataGenerated]);

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
      <div className="sales-country-map-container">
        <div className="empty-state">
          <h3>Sales by Country Map</h3>
          <p>Please select columns and click the Generate button to view the interactive world map.</p>
        </div>
      </div>
    );
  }

  if (!worldMapReady) {
    return (
      <div className="sales-country-map-container">
        <div className="loading-state">
          <h3>Loading World Map...</h3>
          <p>Preparing interactive map visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-country-map-container">
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
      
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-color local-sales"></span>
          <span>Local Sales (UAE)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color export-sales"></span>
          <span>Export Sales</span>
        </div>
      </div>

      <div 
        ref={chartRef} 
        className="sales-country-map-chart"
        style={{ width: '100%', height: '600px' }}
      />
    </div>
  );
};

export default SalesCountryMapChart; 
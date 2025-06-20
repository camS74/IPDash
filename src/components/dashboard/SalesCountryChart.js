import React, { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useFilter } from '../../contexts/FilterContext';
import '../charts/components/SalesCountryMapChart.css';

const SalesCountryChart = () => {
  const { salesData } = useSalesData();
  const { selectedDivision } = useExcelData(); // Get selectedDivision from same context as Dashboard
  const { columnOrder, basePeriodIndex, dataGenerated } = useFilter();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [panelData, setPanelData] = useState({ localSales: 0, exportSales: 0, regionalData: {} });

  // Color scheme definitions (same as ColumnConfigGrid)
  const colorSchemes = [
    { name: 'blue', label: 'Blue', primary: '#288cfa', secondary: '#103766', isDark: true },
    { name: 'green', label: 'Green', primary: '#2E865F', secondary: '#C6F4D6', isDark: true },
    { name: 'yellow', label: 'Yellow', primary: '#FFD700', secondary: '#FFFDE7', isDark: false },
    { name: 'orange', label: 'Orange', primary: '#FF6B35', secondary: '#FFE0B2', isDark: false },
    { name: 'boldContrast', label: 'Bold Contrast', primary: '#003366', secondary: '#FF0000', isDark: true }
  ];

  // Get period colors using the EXACT same logic as ColumnConfigGrid
  const getPeriodColor = (column) => {
    if (column.customColor) {
      const scheme = colorSchemes.find(s => s.name === column.customColor);
      if (scheme) {
        return scheme.primary;
      }
    }
    
    // Default to blue if no custom color (same as ColumnConfigGrid)
    const defaultScheme = colorSchemes[0]; // blue
    return defaultScheme.primary;
  };

  // Helper function to get country sales amount for a specific period
  const getCountrySalesAmount = (countryName, countriesData, column) => {
    const countryRow = countriesData.find(row => 
      row && row[0] && row[0].toString().toLowerCase() === countryName.toLowerCase()
    );
    
    if (!countryRow) {
      console.log(`Country not found: ${countryName}`);
      return 0;
    }
    
    // Determine which months to include based on selected period - SAME AS TABLE
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

    // Sum values for matching year, month(s), and type - SAME AS TABLE
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
          console.log(`Found match for ${countryName} ${yearValue}-${monthValue}-${typeValue}: ${value}`);
        }
      }
    }
    
    console.log(`${countryName} total for ${column.year}-${column.month}-${column.type}: ${sum} (months: ${monthsToInclude.join(', ')})`);
    return foundValues ? sum : 0;
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
    console.log(`Total sales for ${column.year}-${column.month}-${column.type}: ${total}`);
    return total;
  };

  // Get country percentage for specific period  
  const getCountryPercentage = (countryName, countriesData, column) => {
    const countrySales = getCountrySalesAmount(countryName, countriesData, column);
    const totalSales = getTotalSalesForPeriod(countriesData, column);
    
    if (totalSales === 0) return 0;
    return (countrySales / totalSales) * 100;
  };

  // Process data for chart visualization
  useEffect(() => {
    if (!salesData || !selectedDivision || !dataGenerated || columnOrder.length === 0) {
      setChartData(null);
      return;
    }

    setLoading(true);

    const divisionCode = selectedDivision.split('-')[0];
    const countriesSheetName = `${divisionCode}-Countries`;
    const countriesData = salesData[countriesSheetName];

    console.log('Division code:', divisionCode);
    console.log('Countries sheet name:', countriesSheetName);
    console.log('Countries data length:', countriesData ? countriesData.length : 'null');
    console.log('First few rows of countries data:', countriesData ? countriesData.slice(0, 5) : 'null');
    
    // Debug the headers to understand the structure
    if (countriesData && countriesData.length > 3) {
      console.log('Header row 0 (Years):', countriesData[0]);
      console.log('Header row 1 (Months):', countriesData[1]);
      console.log('Header row 2 (Types):', countriesData[2]);
    }

    if (!countriesData || countriesData.length <= 3) {
      setChartData(null);
      setLoading(false);
      return;
    }

    // Get all countries from data
    const allCountries = [];
    for (let i = 3; i < countriesData.length; i++) {
      const row = countriesData[i];
      if (row && row[0]) {
        const countryName = row[0].toString().trim();
        allCountries.push(countryName);
      }
    }

    console.log('Found countries:', allCountries);
    console.log('Column order:', columnOrder);

    // Calculate total percentage for each country across all periods to rank them
    const countryTotals = {};
    allCountries.forEach(countryName => {
      let total = 0;
      columnOrder.forEach(column => {
        const percentage = getCountryPercentage(countryName, countriesData, column);
        total += percentage;
      });
      countryTotals[countryName] = total;
    });

    console.log('Country totals:', countryTotals);

    // Sort countries by their total percentage across all periods and get top 10
    const topCountries = allCountries
      .sort((a, b) => countryTotals[b] - countryTotals[a])
      .slice(0, 10);

    console.log('Top 10 countries:', topCountries);

    // Filter out Budget and Forecast periods
    const filteredColumns = columnOrder.filter(column => 
      column.type !== 'Budget' && column.type !== 'Forecast'
    );

    console.log('Filtered columns (excluding Budget/Forecast):', filteredColumns);

    if (filteredColumns.length === 0) {
      setChartData(null);
      setLoading(false);
      return;
    }

    // Prepare chart data - Countries on X-axis, Periods as series
    const categories = topCountries; // Countries on X-axis

    // Create series data for filtered periods - colors based on period content
    const allSeries = filteredColumns.map((column) => {
      const periodName = column.isCustomRange 
        ? `${column.year} ${column.displayName} ${column.type}` 
        : `${column.year} ${column.month} ${column.type}`;
      
      const data = topCountries.map(country => {
        const percentage = getCountryPercentage(country, countriesData, column);
        const roundedPercentage = Math.round(percentage * 10) / 10; // Round to 1 decimal place
        console.log(`${country} - ${periodName}: ${roundedPercentage}%`);
        return roundedPercentage;
      });

      console.log(`Series ${periodName} data:`, data);

      return {
        name: periodName,
        type: 'bar',
        data: data,
        column, // Store column for button color matching
        itemStyle: {
          color: getPeriodColor(column) // Color based on period content, not position
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 10,
          color: '#333'
        }
      };
    });

    setChartData({
      categories,
      allSeries,
      topCountries,
      totalPeriods: filteredColumns.length,
      filteredColumns,
      countriesData // Store for panel calculations
    });
    setLoading(false);
  }, [salesData, selectedDivision, columnOrder, dataGenerated]);

  // Set default selected period to base period when data loads
  useEffect(() => {
    if (chartData && chartData.filteredColumns && basePeriodIndex !== null) {
      // Find the index in filteredColumns that corresponds to the base period
      const basePeriodColumn = columnOrder[basePeriodIndex];
      if (basePeriodColumn) {
        const filteredIndex = chartData.filteredColumns.findIndex(filteredCol => 
          filteredCol.year === basePeriodColumn.year && 
          filteredCol.month === basePeriodColumn.month && 
          filteredCol.type === basePeriodColumn.type
        );
        
        if (filteredIndex !== -1) {
          setSelectedPeriodIndex(filteredIndex);
        }
      }
    }
  }, [chartData, basePeriodIndex, columnOrder]);

  // Calculate panel data when period changes
  useEffect(() => {
    if (!chartData || !chartData.filteredColumns || !chartData.countriesData || !chartData.topCountries) {
      return;
    }

    const currentPeriod = chartData.filteredColumns[selectedPeriodIndex];
    if (!currentPeriod) return;

    console.log('Calculating panel data for period:', currentPeriod);

    // Calculate Local vs Export Sales for the selected period
    let localSales = 0;
    let exportSales = 0;
    
    chartData.topCountries.forEach(country => {
      const percentage = getCountryPercentage(country, chartData.countriesData, currentPeriod);
      if (country.toLowerCase().includes('united arab emirates') || country.toLowerCase().includes('uae')) {
        localSales += percentage;
      } else {
        exportSales += percentage;
      }
    });

    // Regional mapping
    const regionMapping = {
      'GCC': ['United Arab Emirates', 'UAE', 'Kingdom Of Saudi Arabia', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'],
      'Levant': ['Jordan', 'Lebanon', 'Syria', 'Palestine'],
      'North Africa': ['Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco'],
      'South Africa': ['South Africa'],
      'Europe': ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Poland', 'Czech Republic'],
      'Americas': ['United States', 'USA', 'Canada', 'Mexico', 'Brazil', 'Argentina'],
      'Asia': ['India', 'China', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Indonesia'],
      'Others': []
    };

    // Calculate regional breakdown
    const regionalData = {};
    Object.keys(regionMapping).forEach(region => {
      regionalData[region] = 0;
    });

    chartData.topCountries.forEach(country => {
      const percentage = getCountryPercentage(country, chartData.countriesData, currentPeriod);
      let assigned = false;
      
      for (const [region, countries] of Object.entries(regionMapping)) {
        if (region !== 'Others' && countries.some(c => 
          country.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(country.toLowerCase())
        )) {
          regionalData[region] += percentage;
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        regionalData['Others'] += percentage;
      }
    });

    console.log('Panel data calculated:', {
      localSales: Math.round(localSales * 10) / 10,
      exportSales: Math.round(exportSales * 10) / 10,
      regionalData
    });

    setPanelData({
      localSales: Math.round(localSales * 10) / 10,
      exportSales: Math.round(exportSales * 10) / 10,
      regionalData
    });
  }, [chartData, selectedPeriodIndex]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current || !chartData || !chartData.allSeries || chartData.allSeries.length === 0) return;

    // Dispose previous chart instance
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }

    // Initialize new chart
    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    // Get current period data
    const currentSeries = chartData.allSeries[selectedPeriodIndex];
    const currentPeriodName = currentSeries ? currentSeries.name : 'No Data';

    const option = {
      title: {
        text: `Top 10 Countries - ${currentPeriodName}`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#2c3e50'
        },
        padding: [10, 0, 0, 0]
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        },
        formatter: function(params) {
          const param = Array.isArray(params) ? params[0] : params;
          return `<div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${param.axisValue}</div>
                  <div style="margin: 4px 0;">
                    ${param.marker} ${param.seriesName}: <strong>${param.value.toFixed(1)}%</strong>
                  </div>`;
        }
      },
      legend: {
        show: false  // Hide legend since we're showing one period at a time
      },
      grid: {
        left: '20%',
        right: '15%',
        bottom: '8%',
        top: '60px',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        show: false,  // Hide X-axis completely
        min: 0
      },
      yAxis: {
        type: 'category',
        data: chartData.categories,
        axisLabel: {
          interval: 0,
          fontSize: 11,
          color: '#555',
          fontWeight: '500',
          margin: 10
        },
        axisTick: {
          alignWithLabel: true,
          length: 6
        },
        axisLine: {
          lineStyle: {
            color: '#ccc',
            width: 1
          }
        },
        splitLine: {
          show: false
        }
      },
      series: [{
        ...currentSeries,
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 12,
          color: '#333',
          fontWeight: '600',
          distance: 8
        },
        barMaxWidth: 35,
        barCategoryGap: '20%',
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.3)'
          }
        }
      }],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          xAxisIndex: 0
        }
      ],
      toolbox: {
        feature: {
          saveAsImage: {
            title: 'Save as Image',
            name: 'sales_by_country_chart',
            pixelRatio: 2
          }
        },
        right: 15,
        top: 15,
        iconStyle: {
          borderColor: '#666'
        }
      }
    };

    console.log('Chart option:', option);
    console.log('Chart series:', option.series);
    chart.setOption(option);

    // Handle resize
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [chartData, selectedPeriodIndex]);

  // Check if we have data to display
  if (!dataGenerated) {
    return (
      <div className="sales-country-map-container">
        <div className="empty-state">
          <h3>📊 Sales by Country Chart</h3>
          <p>Please select columns and click the Generate button to view the sales by country chart.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sales-country-map-container">
        <div className="empty-state">
          <h3>📊 Loading Chart Data...</h3>
          <p>Processing sales data for visualization...</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="sales-country-map-container">
        <div className="empty-state">
          <h3>📊 No Data Available</h3>
          <p>No sales data found for the selected division. Please check your data source.</p>
        </div>
      </div>
    );
  }

      return (
    <div className="sales-country-map-container">
      {/* Period Buttons Selector */}
      {chartData && chartData.allSeries && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center'
          }}>
            {chartData.allSeries.map((series, index) => {
              const column = series.column; // Get column from series
              const periodName = column.isCustomRange 
                ? `${column.year} ${column.displayName}` 
                : `${column.year} ${column.month}`;
              
              // Use the EXACT same color that was calculated for the chart
              const buttonColor = series.itemStyle.color;
              const isSelected = selectedPeriodIndex === index;
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedPeriodIndex(index)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backgroundColor: buttonColor,
                                          color: (buttonColor === '#FFD700' || buttonColor === '#FF6B35') ? '#000' : '#fff',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? `0 4px 12px ${buttonColor}60, 0 0 0 2px rgba(255,255,255,0.8)` : `0 2px 4px ${buttonColor}40`,
                    transform: isSelected ? 'translateY(-2px)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = `0 3px 8px ${buttonColor}50`;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.target.style.transform = 'none';
                      e.target.style.boxShadow = `0 2px 4px ${buttonColor}40`;
                    }
                  }}
                >
                  {periodName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="chart-layout">
        {/* Chart Container */}
        <div className="chart-main">
          <div 
            ref={chartRef}
            style={{
              width: '100%',
              height: '500px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
        </div>

        {/* Right Panels */}
        <div className="chart-panels">
          {/* Local vs Export Sales Panel */}
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h5 style={{ 
              margin: '0 0 16px 0', 
              color: '#2c3e50', 
              fontSize: '16px', 
              fontWeight: '600',
              textAlign: 'center'
            }}>
              🏠 Local vs Export Sales
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
                borderRadius: '6px',
                border: '1px solid #c3e6c3'
              }}>
                <span style={{ fontWeight: '500', color: '#2c3e50' }}>🇦🇪 Local Sales</span>
                <span style={{ fontWeight: '700', color: '#2E865F', fontSize: '16px' }}>
                  {panelData.localSales}%
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%)',
                borderRadius: '6px',
                border: '1px solid #bbdefb'
              }}>
                <span style={{ fontWeight: '500', color: '#2c3e50' }}>🌍 Export Sales</span>
                <span style={{ fontWeight: '700', color: '#1976d2', fontSize: '16px' }}>
                  {panelData.exportSales}%
                </span>
              </div>
            </div>
          </div>

          {/* Regional Breakdown Panel */}
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h5 style={{ 
              margin: '0 0 16px 0', 
              color: '#2c3e50', 
              fontSize: '16px', 
              fontWeight: '600',
              textAlign: 'center'
            }}>
              🌏 Sales by Region
            </h5>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {Object.entries(panelData.regionalData)
                 .filter(([region, value]) => value > 0)
                 .sort(([,a], [,b]) => b - a)
                 .map(([region, percentage]) => {
                  const regionEmojis = {
                    'GCC': '🏜️',
                    'Levant': '🏛️',
                    'North Africa': '🏺',
                    'South Africa': '🦁',
                    'Europe': '🏰',
                    'Americas': '🗽',
                    'Asia': '🏯',
                    'Others': '🌐'
                  };
                  
                  return (
                    <div key={region} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}>
                      <span style={{ fontWeight: '500', color: '#495057', fontSize: '13px' }}>
                        {regionEmojis[region]} {region}
                      </span>
                      <span style={{ fontWeight: '600', color: '#2c3e50', fontSize: '13px' }}>
                        {Math.round(percentage * 10) / 10}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesCountryChart;
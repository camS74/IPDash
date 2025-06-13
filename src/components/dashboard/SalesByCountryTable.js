import React, { useRef } from 'react';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useFilter } from '../../contexts/FilterContext';
import SalesCountryPDFExport from './SalesCountryPDFExport';
import './SalesByCountryTable.css';

const SalesByCountryTable = () => {
  const { salesData, selectedDivision } = useSalesData();
  const { columnOrder, basePeriodIndex, dataGenerated } = useFilter();
  const tableRef = useRef(null);

  // Create extended columns with delta columns, filtering out Budget/Forecast
  const createExtendedColumns = () => {
    // First filter out Budget and Forecast columns
    const filteredColumns = columnOrder.filter(col => 
      col.type !== 'Budget' && col.type !== 'Forecast'
    );
    
    const extendedColumns = [];
    
    filteredColumns.forEach((col, index) => {
      extendedColumns.push(col);
      
      // Add delta column after each period (except the last one)
      if (index < filteredColumns.length - 1) {
        extendedColumns.push({
          columnType: 'delta',
          fromColumn: col,
          toColumn: filteredColumns[index + 1]
        });
      }
    });
    
    return extendedColumns;
  };

  const extendedColumns = createExtendedColumns();

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

  // Calculate delta percentage between two periods for a country
  const calculateDelta = (countryName, fromColumn, toColumn) => {
    const fromPercentage = getCountryPercentage(countryName, fromColumn);
    const toPercentage = getCountryPercentage(countryName, toColumn);
    
    if (fromPercentage === 0 && toPercentage === 0) return 0;
    if (fromPercentage === 0) return toPercentage > 0 ? 100 : 0;
    
    return ((toPercentage - fromPercentage) / fromPercentage) * 100;
  };

  // Helper function to format delta values with arrows - SAME AS ProductGroupTable
  const formatDelta = (delta) => {
    if (isNaN(delta) || !isFinite(delta)) return null;
    
    // If delta is 0, show a small dash
    if (delta === 0) {
      return {
        arrow: '─',
        percentage: '0.0%',
        color: '#6c757d'
      };
    }
    
    let arrow = '';
    let color = '#000000';
    
    if (delta > 0) {
      arrow = '▲'; // Up arrow for positive
      color = '#0066cc'; // Blue
    } else if (delta < 0) {
      arrow = '▼'; // Down arrow for negative  
      color = '#cc0000'; // Dark red
    }
    
    const sign = delta > 0 ? '+' : '';
    // Don't add decimals if delta is >= 100% or <= -100%
    const formattedValue = Math.abs(delta) >= 100 ? Math.round(delta) : delta.toFixed(1);
    return {
      arrow: arrow,
      percentage: `${sign}${formattedValue}%`,
      color: color
    };
  };

  // Color schemes available for columns - MUST MATCH TableView.js exactly
  const colorSchemes = [
    { name: 'blue', label: 'Blue', primary: '#288cfa', secondary: '#103766', light: '#E3F2FD', isDark: true },
    { name: 'green', label: 'Green', primary: '#2E865F', secondary: '#C6F4D6', light: '#E8F5E9', isDark: true },
    { name: 'yellow', label: 'Yellow', primary: '#FFEA00', secondary: '#FFFDE7', light: '#FFFDE7', isDark: false },
    { name: 'orange', label: 'Orange', primary: '#FF9800', secondary: '#FFE0B2', light: '#FFF3E0', isDark: false },
    { name: 'boldContrast', label: 'Bold Contrast', primary: '#003366', secondary: '#E6EEF5', light: '#E6EEF5', isDark: true }
  ];

  // Function to get column style based on the column configuration - SAME AS TableView.js
  const getColumnHeaderStyle = (column) => {
    // Ensure column is defined
    if (!column) {
      return { 
        backgroundColor: '#288cfa', 
        color: '#FFFFFF',
        fontWeight: 'bold'
      };
    }
    
    // Check if column has customColor property safely
    if (column.customColor) {
      const scheme = colorSchemes.find(s => s.name === column.customColor);
      if (scheme) {
        return { 
          backgroundColor: scheme.primary,
          color: scheme.isDark ? '#FFFFFF' : '#000000',
          fontWeight: 'bold'
        };
      }
    }
    
    // Default color assignment based on month/type
    if (column.month === 'Q1' || column.month === 'Q2' || column.month === 'Q3' || column.month === 'Q4') {
      return {
        backgroundColor: '#FF9800', // Orange
        color: '#000000',
        fontWeight: 'bold'
      };
    } else if (column.month === 'January') {
      return {
        backgroundColor: '#FFEA00', // Yellow
        color: '#000000',
        fontWeight: 'bold'
      };
    } else if (column.month === 'Year') {
      return {
        backgroundColor: '#288cfa', // Blue
        color: '#FFFFFF',
        fontWeight: 'bold'
      };
    } else if (column.type === 'Budget') {
      return {
        backgroundColor: '#2E865F', // Green
        color: '#FFFFFF',
        fontWeight: 'bold'
      };
    }
    
    // Default to blue
    return { 
      backgroundColor: '#288cfa', 
      color: '#FFFFFF',
      fontWeight: 'bold'
    };
  };

  // Function to get cell background color based on column configuration
  const getCellBackgroundColor = (column) => {
    // Use exactly the same color logic as in TableView.js but for cell backgrounds
    if (column.customColor) {
      const scheme = colorSchemes.find(s => s.name === column.customColor);
      if (scheme) {
        return scheme.light;
      }
    }
    
    // Default color assignment based on month/type
    if (column.month === 'Q1' || column.month === 'Q2' || column.month === 'Q3' || column.month === 'Q4') {
      return colorSchemes.find(s => s.name === 'orange').light;
    } else if (column.month === 'January') {
      return colorSchemes.find(s => s.name === 'yellow').light;
    } else if (column.month === 'Year') {
      return colorSchemes.find(s => s.name === 'blue').light;
    } else if (column.type === 'Budget') {
      return colorSchemes.find(s => s.name === 'green').light;
    }
    
    // Default to blue
    return colorSchemes.find(s => s.name === 'blue').light;
  };

  // Get delta cell style
  const getDeltaCellStyle = (deltaFormatted) => {
    return {
      backgroundColor: '#f8f9fa',
      textAlign: 'center',
      color: deltaFormatted ? deltaFormatted.color : '#000000',
      fontWeight: 'bold',
      fontSize: '11px',
      padding: '8px 4px'
    };
  };

  // Only show data if Generate button has been clicked
  if (!dataGenerated) {
    return (
      <div className="table-view">
        <h3>Sales by Country Table</h3>
        <div className="table-empty-state">
          <p>Please select columns and click the Generate button to view sales by country data.</p>
        </div>
      </div>
    );
  }

  const countries = getCountries();

  if (!countries.length) {
    return (
      <div className="table-view">
        <h3>Sales by Country Table</h3>
        <div className="table-empty-state">
          <p>No country data available. Please ensure Sales data is loaded.</p>
        </div>
      </div>
    );
  }

  // Sort countries by base period percentage (highest to lowest)
  const sortedCountries = [...countries].sort((a, b) => {
    const filteredColumns = columnOrder.filter(col => 
      col.type !== 'Budget' && col.type !== 'Forecast'
    );
    
    if (filteredColumns.length === 0) return 0;
    
    // Use base period if it's not Budget/Forecast, otherwise use first filtered column
    let baseColumn;
    if (basePeriodIndex >= 0 && basePeriodIndex < columnOrder.length) {
      const originalBaseColumn = columnOrder[basePeriodIndex];
      if (originalBaseColumn.type !== 'Budget' && originalBaseColumn.type !== 'Forecast') {
        baseColumn = originalBaseColumn;
      } else {
        baseColumn = filteredColumns[0];
      }
    } else {
      baseColumn = filteredColumns[0];
    }
    
    const percentageA = getCountryPercentage(a, baseColumn);
    const percentageB = getCountryPercentage(b, baseColumn);
    
    return percentageB - percentageA;
  });

  return (
    <div className="table-view">
      <SalesCountryPDFExport tableRef={tableRef} selectedDivision={selectedDivision} />
        <div className="table-header">
          <div className="header-center">
            <h3 className="table-title">Sales by Country</h3>
            <div className="table-subtitle">(%)</div>
          </div>
        </div>
      <div className="table-container" ref={tableRef}>
        <table className="financial-table sales-country-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          {/* Column Groups for width control */}
          <colgroup>
            <col style={{ width: '12%' }}/>
          </colgroup>
          {extendedColumns.map((col, index) => {
            const filteredDataColumns = extendedColumns.filter(c => c.columnType !== 'delta').length;
            return (
              <colgroup key={`colgroup-${index}`}>
                <col style={{ width: col.columnType === 'delta' ? `${5.15 * 0.45}%` : `${(82.85 / filteredDataColumns) * 0.55}%` }}/>
              </colgroup>
            );
          })}
          
          <thead>
            {/* Year Row */}
            <tr>
              <th className="empty-header" rowSpan="3"></th>
              {extendedColumns.map((col, index) => (
                col.columnType === 'delta' ? (
                  <th
                    key={`delta-${index}`}
                    rowSpan="3"
                    style={{ 
                      backgroundColor: '#f8f9fa', 
                      color: '#000000', 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '8px 4px'
                    }}
                  >
                    <div style={{ lineHeight: '1.1' }}>
                      <div style={{ fontSize: '12px' }}>Difference</div>
                    </div>
                  </th>
                ) : (
                  <th
                    key={`year-${index}`}
                    style={getColumnHeaderStyle(col)}
                  >
                                         {(() => {
                       // Find the filtered column index for this extended column
                       const filteredColumns = columnOrder.filter(col => 
                         col.type !== 'Budget' && col.type !== 'Forecast'
                       );
                       const dataColumnIndex = extendedColumns.slice(0, index + 1).filter(c => c.columnType !== 'delta').length - 1;
                       
                       // Check if the original base period column is in our filtered columns
                       if (basePeriodIndex >= 0 && basePeriodIndex < columnOrder.length) {
                         const basePeriodColumn = columnOrder[basePeriodIndex];
                         const basePeriodFilteredIndex = filteredColumns.findIndex(col => 
                           col.year === basePeriodColumn.year && 
                           col.month === basePeriodColumn.month && 
                           col.type === basePeriodColumn.type
                         );
                         return basePeriodFilteredIndex === dataColumnIndex && <span style={{ color: '#28a745' }}>★ </span>;
                       }
                       return false;
                     })()} 
                    {col.year}
                  </th>
                )
              ))}
            </tr>
            
            {/* Month Row */}
            <tr>
              {extendedColumns.map((col, index) => (
                col.columnType === 'delta' ? null : (
                  <th
                    key={`month-${index}`}
                    style={getColumnHeaderStyle(col)}
                  >
                    {col.isCustomRange ? col.displayName : col.month}
                  </th>
                )
              )).filter(Boolean)}
            </tr>
            
            {/* Type Row */}
            <tr>
              {extendedColumns.map((col, index) => (
                col.columnType === 'delta' ? null : (
                  <th 
                    key={`type-${index}`}
                    style={getColumnHeaderStyle(col)}
                  >
                    {col.type}
                  </th>
                )
              )).filter(Boolean)}
            </tr>
          </thead>
          
          <tbody>
            {sortedCountries.map((country, rowIndex) => (
              <tr key={rowIndex}>
                <td className="row-label" style={{ 
                  backgroundColor: '#f8f9fa',
                  fontWeight: 'bold',
                  padding: '8px 12px'
                }}>
                  {country}
                </td>
                {extendedColumns.map((col, colIndex) => {
                  if (col.columnType === 'delta') {
                    // Delta column - calculate percentage difference
                    const delta = calculateDelta(country, col.fromColumn, col.toColumn);
                    const deltaFormatted = formatDelta(delta);
                    return (
                      <td 
                        key={`delta-${country}-${colIndex}`} 
                        className="metric-cell delta-cell" 
                        style={getDeltaCellStyle(deltaFormatted)}
                      >
                        {deltaFormatted ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '0 0 auto' }}>{deltaFormatted.arrow}</span>
                            <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '1', textAlign: 'center' }}>{deltaFormatted.percentage}</span>
                          </div>
                        ) : ''}
                      </td>
                    );
                  } else {
                    // Regular data column
                    const percentage = getCountryPercentage(country, col);
                    return (
                      <td 
                        key={`${country}-${colIndex}`}
                        className="metric-cell"
                        style={{
                          backgroundColor: getCellBackgroundColor(col),
                          textAlign: 'center',
                          padding: '8px 4px'
                        }}
                      >
                        {percentage.toFixed(1)}%
                      </td>
                    );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="table-info">
        <p>
          ★ = Base Period | Countries sorted by base period percentage (highest to lowest) | Δ% shows percentage change between consecutive periods
        </p>
      </div>
    </div>
  );
};

export default SalesByCountryTable; 
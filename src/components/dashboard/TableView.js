import React, { useRef } from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useFilter } from '../../contexts/FilterContext';
import PDFExport from './PDFExport';
import './TableView.css';
import { computeCellValue as sharedComputeCellValue } from '../../utils/computeCellValue';

// Helper function for safely removing DOM elements
const safelyRemoveElement = (element) => {
  try {
    // Check if element exists
    if (!element) return;
    
    // Try direct removal if element has parent
    if (element.parentNode) {
      element.parentNode.removeChild(element);
      return;
    }
    
    // Fallback: check if it's in document.body
    if (document.body && document.body.contains(element)) {
      document.body.removeChild(element);
      return;
    }
    
    // Fallback for loading overlays: find by class
    if (element.classList && element.classList.contains('loading-overlay')) {
      const overlays = document.querySelectorAll('.loading-overlay');
      overlays.forEach(overlay => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      });
    }
  } catch (cleanupError) {
    console.warn('Error removing element:', cleanupError);
    // Try one more approach with a slight delay
    setTimeout(() => {
      try {
        // Final attempt to remove loading overlays
        const overlays = document.querySelectorAll('.loading-overlay');
        overlays.forEach(overlay => {
          try {
            if (overlay && overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            } else if (document.body && document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
          } catch (e) {
            // Silently fail
          }
        });
      } catch (e) {
        // Last effort failed, nothing more we can do
      }
    }, 500);
  }
};

const TableView = () => {
  const { excelData, selectedDivision } = useExcelData();
  const { columnOrder, dataGenerated } = useFilter();
  const tableRef = useRef(null);

  // Only show data if Generate button has been clicked
  if (!dataGenerated) {
    return (
      <div className="table-view">
        <h3>Financial Table</h3>
        <div className="table-empty-state">
          <p>Please select columns and click the Generate button to view data.</p>
        </div>
      </div>
    );
  }

  // Get the Excel data based on selectedDivision
  const divisionData = excelData[selectedDivision] || [];

  // Dynamically get row labels from Excel data if available
  let salesRows = [];

  if (divisionData && divisionData.length > 0) {
    // Use actual row labels from Excel data
    salesRows = [
      { key: 'sales', label: divisionData[3] ? divisionData[3][0] : 'Sales', index: 3, isHeader: true, isCalculated: false },
      { key: 'salesVolume', label: divisionData[7] ? divisionData[7][0] : 'Sales volume (kg)', index: 7, isCalculated: false },
      { key: 'productionVolume', label: divisionData[8] ? divisionData[8][0] : 'Production volume (kg)', index: 8, isCalculated: false },
      { key: 'separator1', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'costOfSales', label: divisionData[4] ? divisionData[4][0] : 'Cost of Sales', index: 4, isHeader: false, isCalculated: false },
      { key: 'material', label: divisionData[5] ? divisionData[5][0] : 'Material', index: 5, isHeader: false, isCalculated: false },
      { key: 'morm', label: 'Margin over Material', index: -2, isHeader: false, isCalculated: true, formula: 'sales-material' },
      { key: 'separator2', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index9', label: divisionData[9] ? divisionData[9][0] : 'Row 9', index: 9, isHeader: false, isCalculated: false },
      { key: 'index10', label: divisionData[10] ? divisionData[10][0] : 'Row 10', index: 10, isHeader: false, isCalculated: false },
      { key: 'index12', label: divisionData[12] ? divisionData[12][0] : 'Row 12', index: 12, isHeader: false, isCalculated: false },
      { key: 'index13', label: divisionData[13] ? divisionData[13][0] : 'Row 13', index: 13, isHeader: false, isCalculated: false },
      { key: 'index14', label: divisionData[14] ? divisionData[14][0] : 'Row 14 (Sum)', index: -3, isHeader: false, isCalculated: true, formula: 'sum9-10-12-13' },
      { key: 'index15', label: divisionData[15] ? divisionData[15][0] : 'Row 15', index: 15, isHeader: false, isCalculated: false },
      { key: 'index16', label: divisionData[16] ? divisionData[16][0] : 'Row 16 (Sum)', index: -4, isHeader: false, isCalculated: true, formula: 'sum14-15' },
      { key: 'index18', label: divisionData[18] ? divisionData[18][0] : 'Row 18 (%)', index: -5, isHeader: false, isCalculated: true, formula: 'percent16-4' },
      { key: 'separator3', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index19', label: divisionData[19] ? divisionData[19][0] : 'Row 19 (Sales-Material)', index: -6, isHeader: false, isCalculated: true, formula: 'calc19-3-4' },
      { key: 'index21', label: divisionData[21] ? divisionData[21][0] : 'Row 21 (Row19+Row10)', index: -7, isHeader: false, isCalculated: true, formula: 'calc21-19-10' },
      { key: 'separator4', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index31', label: divisionData[31] ? divisionData[31][0] : 'Row 31', index: 31, isHeader: false, isCalculated: false },
      { key: 'index32', label: divisionData[32] ? divisionData[32][0] : 'Row 32', index: 32, isHeader: false, isCalculated: false },
      { key: 'index40', label: divisionData[40] ? divisionData[40][0] : 'Row 40', index: 40, isHeader: false, isCalculated: false },
      { key: 'index42', label: divisionData[42] ? divisionData[42][0] : 'Row 42', index: 42, isHeader: false, isCalculated: false },
      { key: 'index43', label: divisionData[43] ? divisionData[43][0] : 'Row 43', index: 43, isHeader: false, isCalculated: false },
      { key: 'index44', label: divisionData[44] ? divisionData[44][0] : 'Row 44', index: 44, isHeader: false, isCalculated: false },
      { key: 'index49', label: divisionData[49] ? divisionData[49][0] : 'Row 49', index: 49, isHeader: false, isCalculated: false },
      { key: 'index50', label: divisionData[50] ? divisionData[50][0] : 'Row 50', index: 50, isHeader: false, isCalculated: false },
      { key: 'index51', label: divisionData[51] ? divisionData[51][0] : 'Row 51', index: 51, isHeader: false, isCalculated: false },
      { key: 'index52', label: divisionData[52] ? divisionData[52][0] : 'Row 52 (Sum)', index: -8, isHeader: false, isCalculated: true, formula: 'sum-31-32-40-42-43-44-49-50-51' },
      { key: 'separator6', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index59', label: divisionData[59] ? divisionData[59][0] : 'Row 59 (Row14+Row52)', index: -11, isHeader: false, isCalculated: true, formula: 'sum-14-52' },
      { key: 'separator7', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index54', label: divisionData[54] ? divisionData[54][0] : 'Row 54 (Row19-Row52)', index: -9, isHeader: false, isCalculated: true, formula: 'diff-19-52' },
      { key: 'ebit', label: 'EBIT', index: -12, isHeader: false, isCalculated: true, formula: 'sum-54-42' },
      { key: 'index56', label: divisionData[56] ? divisionData[56][0] : 'Row 56 (EBITDA)', index: -10, isHeader: false, isCalculated: true, formula: 'sum-54-10-42-44-51' },
    ];
  } else {
    // Fallback rows if Excel data is not yet loaded
    salesRows = [
      { key: 'sales', label: 'Sales', index: 3, isHeader: true, isCalculated: false },
      { key: 'salesVolume', label: 'Sales volume (kg)', index: 7, isCalculated: false },
      { key: 'productionVolume', label: 'Production volume (kg)', index: 8, isCalculated: false },
      { key: 'separator1', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'costOfSales', label: 'Cost of Sales', index: 4, isHeader: false, isCalculated: false },
      { key: 'material', label: 'Material', index: 5, isHeader: false, isCalculated: false },
      { key: 'morm', label: 'Margin over Material', index: -2, isHeader: false, isCalculated: true, formula: 'sales-material' },
      { key: 'separator2', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index9', label: 'Row 9', index: 9, isHeader: false, isCalculated: false },
      { key: 'index10', label: 'Row 10', index: 10, isHeader: false, isCalculated: false },
      { key: 'index12', label: 'Row 12', index: 12, isHeader: false, isCalculated: false },
      { key: 'index13', label: 'Row 13', index: 13, isHeader: false, isCalculated: false },
      { key: 'index14', label: 'Row 14 (Sum)', index: -3, isHeader: false, isCalculated: true, formula: 'sum9-10-12-13' },
      { key: 'index15', label: 'Row 15', index: 15, isHeader: false, isCalculated: false },
      { key: 'index16', label: 'Row 16 (Sum)', index: -4, isHeader: false, isCalculated: true, formula: 'sum14-15' },
      { key: 'index18', label: 'Row 18 (%)', index: -5, isHeader: false, isCalculated: true, formula: 'percent16-4' },
      { key: 'separator3', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index19', label: 'Row 19 (Sales-Material)', index: -6, isHeader: false, isCalculated: true, formula: 'calc19-3-4' },
      { key: 'index21', label: 'Row 21 (Row19+Row10)', index: -7, isHeader: false, isCalculated: true, formula: 'calc21-19-10' },
      { key: 'separator4', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index31', label: 'Row 31', index: 31, isHeader: false, isCalculated: false },
      { key: 'index32', label: 'Row 32', index: 32, isHeader: false, isCalculated: false },
      { key: 'index40', label: 'Row 40', index: 40, isHeader: false, isCalculated: false },
      { key: 'index42', label: 'Row 42', index: 42, isHeader: false, isCalculated: false },
      { key: 'index43', label: 'Row 43', index: 43, isHeader: false, isCalculated: false },
      { key: 'index44', label: 'Row 44', index: 44, isHeader: false, isCalculated: false },
      { key: 'index49', label: 'Row 49', index: 49, isHeader: false, isCalculated: false },
      { key: 'index50', label: 'Row 50', index: 50, isHeader: false, isCalculated: false },
      { key: 'index51', label: 'Row 51', index: 51, isHeader: false, isCalculated: false },
      { key: 'index52', label: 'Row 52 (Sum)', index: -8, isHeader: false, isCalculated: true, formula: 'sum-31-32-40-42-43-44-49-50-51' },
      { key: 'separator6', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index59', label: 'Row 59 (Row14+Row52)', index: -11, isHeader: false, isCalculated: true, formula: 'sum-14-52' },
      { key: 'separator7', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index54', label: 'Row 54 (Row19-Row52)', index: -9, isHeader: false, isCalculated: true, formula: 'diff-19-52' },
      { key: 'ebit', label: 'EBIT', index: -12, isHeader: false, isCalculated: true, formula: 'sum-54-42' },
      { key: 'index56', label: 'Row 56 (EBITDA)', index: -10, isHeader: false, isCalculated: true, formula: 'sum-54-10-42-44-51' },
    ];
  }

  // Function to compute the value for a specific cell based on row index and column configuration
  const computeCellValue = (rowIndex, column) => {
    const value = sharedComputeCellValue(divisionData, rowIndex, column);
    if (value === 0) return '';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Function to compute percent of sales for a specific cell
  const computePercentOfSales = (rowIndex, column) => {
    try {
      // Validate inputs
      if (!column || typeof column !== 'object') {
        console.warn('Invalid column parameter in computePercentOfSales');
        return '';
      }
      
      if (typeof rowIndex !== 'number') {
        console.warn('Invalid rowIndex parameter in computePercentOfSales');
        return '';
      }

      // Skip for Sales row itself
      if (rowIndex === 3) return '';

      // Get the value for this row and the sales row
      const value = computeCellValue(rowIndex, column);
      const salesValue = computeCellValue(3, column);

      // If either is empty, return empty string
      if (value === '' || value === 'Error' || salesValue === '' || salesValue === 'Error') return '';

      // Parse the values (remove commas)
      const numValue = parseFloat(value.replace(/,/g, ''));
      const numSalesValue = parseFloat(salesValue.replace(/,/g, ''));

      // Check for valid numbers
      if (isNaN(numValue) || isNaN(numSalesValue)) return '';

      // Calculate percentage if sales is not zero
      if (numSalesValue === 0) return '0.00%';

      const percentage = (numValue / numSalesValue) * 100;
      return percentage.toFixed(2) + '%';
    } catch (error) {
      console.error('Error computing percent of sales:', error);
      return '';
    }
  };

  // Function to compute sales per kg
  const computeSalesPerKg = (rowIndex, column) => {
    try {
      // Validate inputs
      if (!column || typeof column !== 'object') {
        console.warn('Invalid column parameter in computeSalesPerKg');
        return '';
      }
      
      if (typeof rowIndex !== 'number') {
        console.warn('Invalid rowIndex parameter in computeSalesPerKg');
        return '';
      }

      // Skip for Sales Volume and Production Volume rows
      if (rowIndex === 7 || rowIndex === 8) return '';

      // Get the sales volume value (always from row 7)
      const volumeValue = computeCellValue(7, column); // Sales Volume row
      
      // If volume is empty, return empty string
      if (volumeValue === '') return '';
      
      // Parse the volume value
      const numVolumeValue = parseFloat(volumeValue.replace(/,/g, ''));
      
      // Check for valid numbers and non-zero volume
      if (isNaN(numVolumeValue) || numVolumeValue === 0) return '0.00';
      
      // Get the value for the current row
      const currentValue = computeCellValue(rowIndex, column);
      
      // If the current row value is empty, return empty string
      if (currentValue === '') return '';
      
      // Parse the current row value
      const numCurrentValue = parseFloat(currentValue.replace(/,/g, ''));
      
      // Check for valid number
      if (isNaN(numCurrentValue)) return '';
      
      // Calculate per kg value (current row value divided by sales volume)
      const perKgValue = numCurrentValue / numVolumeValue;
      
      // Format with exactly 2 decimal places
      return perKgValue.toFixed(2);
    } catch (error) {
      console.error('Error computing sales per kg:', error);
      return '';
    }
  };

  // Color schemes available for columns - MUST MATCH ColumnConfigGrid.js exactly
  const colorSchemes = [
    { name: 'blue', label: 'Blue', primary: '#288cfa', secondary: '#103766', light: '#E3F2FD', isDark: true },
    { name: 'green', label: 'Green', primary: '#2E865F', secondary: '#C6F4D6', light: '#E8F5E9', isDark: true },
    { name: 'yellow', label: 'Yellow', primary: '#FFD700', secondary: '#FFFDE7', light: '#FFFDE7', isDark: false },
    { name: 'orange', label: 'Orange', primary: '#FF6B35', secondary: '#FFE0B2', light: '#FFF3E0', isDark: false },
    { name: 'boldContrast', label: 'Bold Contrast', primary: '#003366', secondary: '#E6EEF5', light: '#E6EEF5', isDark: true }
  ];

  // Function to get column style based on the column configuration
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
        backgroundColor: '#FF6B35', // Orange (light red)
        color: '#000000',
        fontWeight: 'bold'
      };
    } else if (column.month === 'January') {
      return {
        backgroundColor: '#FFD700', // Yellow
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
    // Use exactly the same color logic as in ProductGroupTable.js for dynamic backgrounds
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

  return (
    <div className="table-view" ref={tableRef}>
      <PDFExport tableRef={tableRef} selectedDivision={selectedDivision} />
        <div className="table-header">
          <div className="header-center">
            <h3 className="table-title">{selectedDivision} Financials</h3>
            <div className="table-subtitle">(AED)</div>
          </div>
        </div>
      <div className="table-container">
        <table className="financial-table">
          <colgroup>
            <col style={{ width: '18%' }}/>
          </colgroup>
          {columnOrder.map((_, index) => (
            <colgroup key={`colgroup-${index}`} className="period-column-group">
              <col style={{ width: `${76 / columnOrder.length * 0.7}%` }}/>
              <col style={{ width: `${76 / columnOrder.length * 0.18}%` }}/>
              <col style={{ width: `${76 / columnOrder.length * 0.12}%` }}/>
            </colgroup>
          ))}
          <thead>
            <tr>
              <th className="empty-header" rowSpan="4"></th>
              {columnOrder.map((column, index) => (
                <th
                  key={`year-${index}`}
                  style={getColumnHeaderStyle(column)}
                  colSpan="3"
                >
                  {column.year}
                </th>
              ))}
            </tr>
            <tr>
              {columnOrder.map((column, index) => (
                <th
                  key={`month-${index}`}
                  style={getColumnHeaderStyle(column)}
                  colSpan="3"
                >
                  {column.isCustomRange ? column.displayName : column.month}
                </th>
              ))}
            </tr>
            <tr>
              {columnOrder.map((column, index) => (
                <th 
                  key={`type-${index}`}
                  style={getColumnHeaderStyle(column)}
                  colSpan="3"
                >
                  {column.type}
                </th>
              ))}
            </tr>
            
            <tr>
              {columnOrder.map((column, index) => (
                <React.Fragment key={`metric-${index}`}>
                  <th style={{...getColumnHeaderStyle(column), fontSize: '13px'}}>
                    Amount
                  </th>
                  <th style={{...getColumnHeaderStyle(column), fontSize: '12px', lineHeight: '1.1', textAlign: 'center', padding: '2px'}}>
                    %<br/>of<br/>Sales
                  </th>
                  <th style={{...getColumnHeaderStyle(column), fontSize: '12px', lineHeight: '1.1', textAlign: 'center', padding: '2px'}}>
                    Sales<br/>per<br/>Kg
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Sales section */}
            {salesRows.map((row) => {
              // If it's a separator row, render a spacer row
              if (row.isSeparator) {
                return (
                  <tr key={row.key} className="separator-row">
                    <td colSpan={columnOrder.length + 1}>&nbsp;</td>
                  </tr>
                );
              }
              
              // Check if this row should have bold styling in ledger column based on the specific rows shown in the image
              const isBoldRow = 
                row.label === 'Margin over Material' || 
                row.label === 'Row 14 (Sum)' || 
                row.label.includes('Actual Direct Cost') ||
                row.label === 'Row 19 (Sales-Material)' ||
                row.label.includes('Gross profit') ||
                row.label === 'Row 52 (Sum)' ||
                row.label.includes('Total Below GP Expenses') ||
                row.label.includes('Total Expenses') ||
                row.label === 'Row 54 (Row19-Row52)' || 
                row.label.includes('Net Profit') ||
                row.label === 'EBIT' ||
                row.label === 'Row 56 (EBITDA)' ||
                row.label.includes('EBITDA');
              
              return (
                <tr key={row.key} className={`${row.isHeader ? 'section-header' : ''} ${isBoldRow ? 'important-row' : ''}`}>
                  <td className="row-label">{row.label}</td>
                  {columnOrder.flatMap((column, colIndex) => {
                    // Handle calculated fields with formulas
                    if (row.isCalculated) {
                      // Get background color based on the column's properties
                      const bgColor = getCellBackgroundColor(column);

                      // Process formulas based on the type
                      let formattedResult = '';
                      if (row.formula === 'sales-material') {
                        // Find the values for sales and material in this column
                        const salesValue = computeCellValue(3, column);
                        const materialValue = computeCellValue(5, column);

                        // Convert string values with commas back to numbers for calculation
                        const salesNum = salesValue === '' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                        const materialNum = materialValue === '' ? 0 : parseFloat(materialValue.replace(/,/g, ''));

                        // Calculate the result
                        const result = salesNum - materialNum;

                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'sum9-10-12-13') {
                        // Find the values for rows 9, 10, 12, and 13 in this column
                        const value9 = computeCellValue(9, column);
                        const value10 = computeCellValue(10, column);
                        const value12 = computeCellValue(12, column);
                        const value13 = computeCellValue(13, column);

                        // Convert string values with commas back to numbers for calculation
                        const num9 = value9 === '' ? 0 : parseFloat(value9.replace(/,/g, ''));
                        const num10 = value10 === '' ? 0 : parseFloat(value10.replace(/,/g, ''));
                        const num12 = value12 === '' ? 0 : parseFloat(value12.replace(/,/g, ''));
                        const num13 = value13 === '' ? 0 : parseFloat(value13.replace(/,/g, ''));

                        // Calculate the sum
                        const result = num9 + num10 + num12 + num13;

                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'sum14-15') {
                        // Calculate row 14 (sum of 9, 10, 12, 13)
                        const value9 = computeCellValue(9, column);
                        const value10 = computeCellValue(10, column);
                        const value12 = computeCellValue(12, column);
                        const value13 = computeCellValue(13, column);

                        const num9 = value9 === '' ? 0 : parseFloat(value9.replace(/,/g, ''));
                        const num10 = value10 === '' ? 0 : parseFloat(value10.replace(/,/g, ''));
                        const num12 = value12 === '' ? 0 : parseFloat(value12.replace(/,/g, ''));
                        const num13 = value13 === '' ? 0 : parseFloat(value13.replace(/,/g, ''));

                        // Value for row 14
                        const num14 = num9 + num10 + num12 + num13;

                        // Get row 15 value
                        const value15 = computeCellValue(15, column);
                        const num15 = value15 === '' ? 0 : parseFloat(value15.replace(/,/g, ''));

                        // Calculate row 16 = row 14 + row 15
                        const result = num14 + num15;

                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'percent16-4') {
                        // First calculate row 16 (sum of row 14 + row 15)
                        // We need to get row 14 first (sum of 9, 10, 12, 13)
                        const value9 = computeCellValue(9, column);
                        const value10 = computeCellValue(10, column);
                        const value12 = computeCellValue(12, column);
                        const value13 = computeCellValue(13, column);
                        
                        const num9 = value9 === '' ? 0 : parseFloat(value9.replace(/,/g, ''));
                        const num10 = value10 === '' ? 0 : parseFloat(value10.replace(/,/g, ''));
                        const num12 = value12 === '' ? 0 : parseFloat(value12.replace(/,/g, ''));
                        const num13 = value13 === '' ? 0 : parseFloat(value13.replace(/,/g, ''));

                        // Value for row 14
                        const num14 = num9 + num10 + num12 + num13;
                        
                        // Get row 15 value
                        const value15 = computeCellValue(15, column);
                        const num15 = value15 === '' ? 0 : parseFloat(value15.replace(/,/g, ''));

                        // Calculate row 16 = row 14 + row 15
                        const num16 = num14 + num15;

                        // Get Material value (row 4)
                        const materialValue = computeCellValue(4, column);
                        const material = materialValue === '' ? 0 : parseFloat(materialValue.replace(/,/g, ''));

                        // Calculate row 16 as percentage of row 4 (Material)
                        let percentResult = 0;
                        if (material !== 0) {
                          percentResult = (num16 / material) * 100;
                        }
                        
                        // Format the result as percentage with 1 decimal place
                        formattedResult = percentResult.toLocaleString('en-US', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        }) + '%';
                      } else if (row.formula === 'calc19-3-4') {
                        // Get Sales value (row 3)
                        const salesValue = computeCellValue(3, column);
                        const sales = salesValue === '' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                        
                        // Get Material value (row 4)
                        const materialValue = computeCellValue(4, column);
                        const material = materialValue === '' ? 0 : parseFloat(materialValue.replace(/,/g, ''));
                        
                        // Calculate row 19 = Sales - Material
                        const result = sales - material;
                        
                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'calc21-19-10') {
                        // Calculate Row 19 (Sales - Material) first
                        const salesValue = computeCellValue(3, column);
                        const materialValue = computeCellValue(4, column);
                        
                        const sales = salesValue === '' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                        const material = materialValue === '' ? 0 : parseFloat(materialValue.replace(/,/g, ''));
                        
                        const row19 = sales - material;
                        
                        // Get Row 10 value
                        const row10Value = computeCellValue(10, column);
                        const row10 = row10Value === '' ? 0 : parseFloat(row10Value.replace(/,/g, ''));
                        
                        // Calculate Row 21 = Row 19 + Row 10
                        const result = row19 + row10;
                        
                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'sum-31-32-40-42-43-44-49-50-51') {
                        // Get values for all rows to be summed
                        const value31 = computeCellValue(31, column);
                        const value32 = computeCellValue(32, column);
                        const value40 = computeCellValue(40, column);
                        const value42 = computeCellValue(42, column);
                        const value43 = computeCellValue(43, column);
                        const value44 = computeCellValue(44, column);
                        const value49 = computeCellValue(49, column);
                        const value50 = computeCellValue(50, column);
                        const value51 = computeCellValue(51, column);

                        // Convert to numbers, handling '' values as 0
                        const num31 = value31 === '' ? 0 : parseFloat(value31.replace(/,/g, ''));
                        const num32 = value32 === '' ? 0 : parseFloat(value32.replace(/,/g, ''));
                        const num40 = value40 === '' ? 0 : parseFloat(value40.replace(/,/g, ''));
                        const num42 = value42 === '' ? 0 : parseFloat(value42.replace(/,/g, ''));
                        const num43 = value43 === '' ? 0 : parseFloat(value43.replace(/,/g, ''));
                        const num44 = value44 === '' ? 0 : parseFloat(value44.replace(/,/g, ''));
                        const num49 = value49 === '' ? 0 : parseFloat(value49.replace(/,/g, ''));
                        const num50 = value50 === '' ? 0 : parseFloat(value50.replace(/,/g, ''));
                        const num51 = value51 === '' ? 0 : parseFloat(value51.replace(/,/g, ''));

                        // Calculate the sum of all rows
                        const result = num31 + num32 + num40 + num42 + num43 + num44 + num49 + num50 + num51;
                        
                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'sum-14-52') {
                        // For Row 14, we need to calculate it based on rows 9, 10, 12, 13
                        const value9 = computeCellValue(9, column);
                        const value10 = computeCellValue(10, column);
                        const value12 = computeCellValue(12, column);
                        const value13 = computeCellValue(13, column);

                        // Parse values to numbers
                        const num9 = value9 === '' ? 0 : parseFloat(value9.replace(/,/g, ''));
                        const num10 = value10 === '' ? 0 : parseFloat(value10.replace(/,/g, ''));
                        const num12 = value12 === '' ? 0 : parseFloat(value12.replace(/,/g, ''));
                        const num13 = value13 === '' ? 0 : parseFloat(value13.replace(/,/g, ''));

                        // Calculate Row 14 as sum of rows 9, 10, 12, 13
                        const row14 = num9 + num10 + num12 + num13;
                        
                        // For Row 52, we need to calculate it based on rows 31, 32, 40, 42, 43, 44, 49, 50, 51
                        const value31 = computeCellValue(31, column);
                        const value32 = computeCellValue(32, column);
                        const value40 = computeCellValue(40, column);
                        const value42 = computeCellValue(42, column);
                        const value43 = computeCellValue(43, column);
                        const value44 = computeCellValue(44, column);
                        const value49 = computeCellValue(49, column);
                        const value50 = computeCellValue(50, column);
                        const value51 = computeCellValue(51, column);

                        // Parse values to numbers
                        const num31 = value31 === '' ? 0 : parseFloat(value31.replace(/,/g, ''));
                        const num32 = value32 === '' ? 0 : parseFloat(value32.replace(/,/g, ''));
                        const num40 = value40 === '' ? 0 : parseFloat(value40.replace(/,/g, ''));
                        const num42 = value42 === '' ? 0 : parseFloat(value42.replace(/,/g, ''));
                        const num43 = value43 === '' ? 0 : parseFloat(value43.replace(/,/g, ''));
                        const num44 = value44 === '' ? 0 : parseFloat(value44.replace(/,/g, ''));
                        const num49 = value49 === '' ? 0 : parseFloat(value49.replace(/,/g, ''));
                        const num50 = value50 === '' ? 0 : parseFloat(value50.replace(/,/g, ''));
                        const num51 = value51 === '' ? 0 : parseFloat(value51.replace(/,/g, ''));

                        // Calculate Row 52 as sum of rows 31, 32, 40, 42, 43, 44, 49, 50, 51
                        const row52 = num31 + num32 + num40 + num42 + num43 + num44 + num49 + num50 + num51;
                        
                        // Calculate Row 59 as Row 14 + Row 52
                        const result = row14 + row52;
                        
                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'diff-19-52') {
                        // First calculate Row 19 (Sales - Material)
                        const salesValue = computeCellValue(3, column);
                        const materialValue = computeCellValue(4, column);
                        
                        const sales = salesValue === '' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                        const material = materialValue === '' ? 0 : parseFloat(materialValue.replace(/,/g, ''));
                        
                        const row19 = sales - material;
                        
                        // Then calculate Row 52 (sum of rows 31, 32, 40, 42, 43, 44, 49, 50, 51)
                        const value31 = computeCellValue(31, column);
                        const value32 = computeCellValue(32, column);
                        const value40 = computeCellValue(40, column);
                        const value42 = computeCellValue(42, column);
                        const value43 = computeCellValue(43, column);
                        const value44 = computeCellValue(44, column);
                        const value49 = computeCellValue(49, column);
                        const value50 = computeCellValue(50, column);
                        const value51 = computeCellValue(51, column);

                        const num31 = value31 === '' ? 0 : parseFloat(value31.replace(/,/g, ''));
                        const num32 = value32 === '' ? 0 : parseFloat(value32.replace(/,/g, ''));
                        const num40 = value40 === '' ? 0 : parseFloat(value40.replace(/,/g, ''));
                        const num42 = value42 === '' ? 0 : parseFloat(value42.replace(/,/g, ''));
                        const num43 = value43 === '' ? 0 : parseFloat(value43.replace(/,/g, ''));
                        const num44 = value44 === '' ? 0 : parseFloat(value44.replace(/,/g, ''));
                        const num49 = value49 === '' ? 0 : parseFloat(value49.replace(/,/g, ''));
                        const num50 = value50 === '' ? 0 : parseFloat(value50.replace(/,/g, ''));
                        const num51 = value51 === '' ? 0 : parseFloat(value51.replace(/,/g, ''));

                        const row52 = num31 + num32 + num40 + num42 + num43 + num44 + num49 + num50 + num51;
                        
                        // Calculate Row 54 = Row 19 - Row 52
                        const result = row19 - row52;
                        
                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'sum-54-10-42-44-51') {
                        // Get values for rows 54, 10, 42, 44, and 51
                        const value54 = computeCellValue(54, column);
                        const value10 = computeCellValue(10, column);
                        const value42 = computeCellValue(42, column);
                        const value44 = computeCellValue(44, column);
                        const value51 = computeCellValue(51, column);

                        // Parse values to numbers
                        const num54 = value54 === '' ? 0 : parseFloat(value54.replace(/,/g, ''));
                        const num10 = value10 === '' ? 0 : parseFloat(value10.replace(/,/g, ''));
                        const num42 = value42 === '' ? 0 : parseFloat(value42.replace(/,/g, ''));
                        const num44 = value44 === '' ? 0 : parseFloat(value44.replace(/,/g, ''));
                        const num51 = value51 === '' ? 0 : parseFloat(value51.replace(/,/g, ''));

                        // Calculate EBITDA as sum of rows 54, 10, 42, 44, and 51
                        const result = num54 + num10 + num42 + num44 + num51;
                        
                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'sum-54-42') {
                        // Calculate Net Profit (Row 54) first: Row 19 - Row 52
                        // First calculate Row 19 (Sales - Material)
                        const salesValue = computeCellValue(3, column);
                        const materialValue = computeCellValue(4, column);
                        
                        const sales = salesValue === '' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                        const material = materialValue === '' ? 0 : parseFloat(materialValue.replace(/,/g, ''));
                        
                        const row19 = sales - material;
                        
                        // Then calculate Row 52 (sum of rows 31, 32, 40, 42, 43, 44, 49, 50, 51)
                        const value31 = computeCellValue(31, column);
                        const value32 = computeCellValue(32, column);
                        const value40 = computeCellValue(40, column);
                        const value42 = computeCellValue(42, column);
                        const value43 = computeCellValue(43, column);
                        const value44 = computeCellValue(44, column);
                        const value49 = computeCellValue(49, column);
                        const value50 = computeCellValue(50, column);
                        const value51 = computeCellValue(51, column);

                        const num31 = value31 === '' ? 0 : parseFloat(value31.replace(/,/g, ''));
                        const num32 = value32 === '' ? 0 : parseFloat(value32.replace(/,/g, ''));
                        const num40 = value40 === '' ? 0 : parseFloat(value40.replace(/,/g, ''));
                        const num42 = value42 === '' ? 0 : parseFloat(value42.replace(/,/g, ''));
                        const num43 = value43 === '' ? 0 : parseFloat(value43.replace(/,/g, ''));
                        const num44 = value44 === '' ? 0 : parseFloat(value44.replace(/,/g, ''));
                        const num49 = value49 === '' ? 0 : parseFloat(value49.replace(/,/g, ''));
                        const num50 = value50 === '' ? 0 : parseFloat(value50.replace(/,/g, ''));
                        const num51 = value51 === '' ? 0 : parseFloat(value51.replace(/,/g, ''));

                        const row52 = num31 + num32 + num40 + num42 + num43 + num44 + num49 + num50 + num51;
                        
                        // Calculate Net Profit (Row 54) = Row 19 - Row 52
                        const netProfit = row19 - row52;
                        
                        // Calculate EBIT = Net Profit + Bank Interest (Row 42)
                        const result = netProfit + num42;
                        
                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      }
                      
                      // Return an array of cells instead of using React.Fragment
                      return [
                        <td
                          key={`amount-${row.key}-${colIndex}`}
                          className="calculated-cell"
                          style={{ backgroundColor: bgColor }}
                        >
                          {formattedResult === '' ? '' : formattedResult}
                        </td>,
                        <td
                          key={`percent-${row.key}-${colIndex}`}
                          className="calculated-cell"
                          style={{ backgroundColor: bgColor }}
                        >
                          {(() => {
                            if (row.index === -5) return '';
                            try {
                              if (formattedResult === '') return '';
                              const cellNum = parseFloat(formattedResult.replace(/,/g, ''));
                              const salesValue = computeCellValue(3, column);
                              const salesNum = salesValue === '' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                              if (salesNum === 0) return '0.00%';
                              const percentValue = (cellNum / salesNum) * 100;
                              return percentValue.toFixed(2) + '%';
                            } catch (error) {
                              console.error('Error computing percent of sales for calculated cell:', error);
                              return 'Error';
                            }
                          })()}
                        </td>,
                        <td
                          key={`perkg-${row.key}-${colIndex}`}
                          className="calculated-cell"
                          style={{ backgroundColor: bgColor }}
                        >
                          {(() => {
                            if (row.index === -5) return '';
                            try {
                              if (formattedResult === '') return '';
                              const cellNum = parseFloat(formattedResult.replace(/,/g, ''));
                              const volumeValue = computeCellValue(7, column);
                              const volumeNum = volumeValue === '' ? 0 : parseFloat(volumeValue.replace(/,/g, ''));
                              if (isNaN(cellNum) || isNaN(volumeNum) || volumeNum === 0) return '0.00';
                              const perKgValue = cellNum / volumeNum;
                              return perKgValue.toFixed(2);
                            } catch (error) {
                              console.error('Error computing sales per kg for calculated cell:', error);
                              return '';
                            }
                          })()}
                        </td>
                      ];
                    }

                    // Regular data cells (not calculated)
                    const cellValue = computeCellValue(row.index, column);
                    const bgColor = getCellBackgroundColor(column);
                    
                    // Return an array of cells instead of using React.Fragment
                    return [
                      <td 
                        key={`amount-${row.key}-${colIndex}`}
                        style={{ backgroundColor: bgColor }}
                      >
                        {cellValue}
                      </td>,
                      <td 
                        key={`percent-${row.key}-${colIndex}`}
                        style={{ backgroundColor: bgColor }}
                      >
                        {/* Keep % of Sales empty for specific rows */}
                        {row.index !== 7 && row.index !== 8 && row.index !== -5 ? computePercentOfSales(row.index, column) : ''}
                      </td>,
                      <td 
                        key={`perkg-${row.key}-${colIndex}`}
                        style={{ 
                          backgroundColor: bgColor, 
                          color: row.index === 3 ? '#2E865F' : 'inherit', 
                          fontWeight: row.index === 3 ? 'bold' : 'inherit' 
                        }}
                      >
                        {/* Show Sales per kg for all rows except Sales Volume and Production Volume */}
                        {computeSalesPerKg(row.index, column)}
                      </td>
                    ];
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
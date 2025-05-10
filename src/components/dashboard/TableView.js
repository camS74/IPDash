import React, { useRef } from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useFilter } from '../../contexts/FilterContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './TableView.css';

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
    if (document.body.contains(element)) {
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
    console.error('Error removing element:', cleanupError);
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
      { key: 'material', label: divisionData[4] ? divisionData[4][0] : 'Material', index: 4, isHeader: false, isCalculated: false },
      { key: 'index5', label: divisionData[5] ? divisionData[5][0] : 'Row 5', index: 5, isHeader: false, isCalculated: false },
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
      { key: 'separator5', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index52', label: divisionData[52] ? divisionData[52][0] : 'Row 52 (Sum)', index: -8, isHeader: false, isCalculated: true, formula: 'sum-31-32-40-42-43-44-49-50' },
      { key: 'separator6', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index59', label: divisionData[59] ? divisionData[59][0] : 'Row 59 (Row14+Row52)', index: -11, isHeader: false, isCalculated: true, formula: 'sum-14-52' },
      { key: 'separator7', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index54', label: divisionData[54] ? divisionData[54][0] : 'Row 54 (Row19-Row52)', index: -9, isHeader: false, isCalculated: true, formula: 'diff-19-52' },
      { key: 'index56', label: divisionData[56] ? divisionData[56][0] : 'Row 56 (Row54+Row19+Row42+Row44)', index: -10, isHeader: false, isCalculated: true, formula: 'sum-54-19-42-44' },
    ];
  } else {
    // Fallback rows if Excel data is not yet loaded
    salesRows = [
      { key: 'sales', label: 'Sales', index: 3, isHeader: true, isCalculated: false },
      { key: 'salesVolume', label: 'Sales volume (kg)', index: 7, isCalculated: false },
      { key: 'productionVolume', label: 'Production volume (kg)', index: 8, isCalculated: false },
      { key: 'separator1', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'material', label: 'Material', index: 4, isHeader: false, isCalculated: false },
      { key: 'index5', label: 'Row 5', index: 5, isHeader: false, isCalculated: false },
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
      { key: 'separator5', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index52', label: 'Row 52 (Sum)', index: -8, isHeader: false, isCalculated: true, formula: 'sum-31-32-40-42-43-44-49-50' },
      { key: 'separator6', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index59', label: 'Row 59 (Row14+Row52)', index: -11, isHeader: false, isCalculated: true, formula: 'sum-14-52' },
      { key: 'separator7', label: '', index: -1, isHeader: false, isSeparator: true },
      { key: 'index54', label: 'Row 54 (Row19-Row52)', index: -9, isHeader: false, isCalculated: true, formula: 'diff-19-52' },
      { key: 'index56', label: 'Row 56 (Row54+Row19+Row42+Row44)', index: -10, isHeader: false, isCalculated: true, formula: 'sum-54-19-42-44' },
    ];
  }

  // Function to compute the value for a specific cell based on row index and column configuration
  const computeCellValue = (rowIndex, column) => {
    try {
      // For testing purposes, return the index to verify structure
      if (divisionData.length === 0) return rowIndex;

      // Determine which months to include based on selected period
      let monthsToInclude = [];
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
        // Single month
        monthsToInclude = [column.month];
      }

      // Find cells in the Excel data that match our criteria and sum them
      let sum = 0;
      let foundValues = false;

      // Loop through the data to find matching cells
      for (let c = 1; c < divisionData[0].length; c++) {
        const cellYear = divisionData[0][c];
        const cellMonth = divisionData[1][c];
        const cellType = divisionData[2][c];

        // Check if this cell matches our criteria
        if (
          cellYear == column.year &&
          monthsToInclude.includes(cellMonth) &&
          cellType === column.type
        ) {
          // Add the value to our sum if it exists
          const value = divisionData[rowIndex][c];
          if (value !== undefined && value !== null && !isNaN(value)) {
            sum += parseFloat(value);
            foundValues = true;
          }
        }
      }

      // Format the sum with commas if values were found, otherwise a placeholder
      if (foundValues) {
        // Format number with commas
        return sum.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
      } else {
        return 'N/A';
      }
    } catch (error) {
      console.error('Error computing cell value:', error);
      return 'Error';
    }
  };

  // Function to calculate percentage of sales
  const computePercentOfSales = (rowIndex, column) => {
    try {
      const cellValue = computeCellValue(rowIndex, column);
      const salesValue = computeCellValue(3, column); // Row 3 is Sales
      
      // Convert string values with commas back to numbers
      const cellNum = cellValue === 'N/A' ? 0 : parseFloat(cellValue.replace(/,/g, ''));
      const salesNum = salesValue === 'N/A' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
      
      // Calculate percentage
      if (salesNum === 0) return 'N/A';
      
      const percentValue = (cellNum / salesNum) * 100;
      
      // Format with 2 decimal places
      return percentValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + '%';
    } catch (error) {
      console.error('Error computing percent of sales:', error);
      return 'Error';
    }
  };

  // Function to calculate sales per kg
  const computeSalesPerKg = (rowIndex, column) => {
    try {
      const cellValue = computeCellValue(rowIndex, column);
      const salesVolumeValue = computeCellValue(7, column); // Row 7 is Sales Volume
      
      // Convert string values with commas back to numbers
      const cellNum = cellValue === 'N/A' ? 0 : parseFloat(cellValue.replace(/,/g, ''));
      const salesVolumeNum = salesVolumeValue === 'N/A' ? 0 : parseFloat(salesVolumeValue.replace(/,/g, ''));
      
      // Calculate sales per kg
      if (salesVolumeNum === 0) return 'N/A';
      
      const perKgValue = cellNum / salesVolumeNum;
      
      // Format with 2 decimal places
      return perKgValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      console.error('Error computing sales per kg:', error);
      return 'Error';
    }
  };

  // Color schemes available for columns - MUST MATCH ColumnConfigGrid.js exactly
  const colorSchemes = [
    { name: 'blue', label: 'Blue', primary: '#288cfa', secondary: '#103766', light: '#E3F2FD', isDark: true },
    { name: 'green', label: 'Green', primary: '#2E865F', secondary: '#C6F4D6', light: '#E8F5E9', isDark: true },
    { name: 'yellow', label: 'Yellow', primary: '#FFEA00', secondary: '#FFFDE7', light: '#FFFDE7', isDark: false },
    { name: 'orange', label: 'Orange', primary: '#FF9800', secondary: '#FFE0B2', light: '#FFF3E0', isDark: false },
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
    // Use exactly the same color logic as in ColumnConfigGrid.js but for cell backgrounds
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

  // Function to export table as PDF
  const exportToPDF = () => {
    if (!tableRef.current) return;
    
    // Show loading state
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div><div>Generating PDF...</div>';
    document.body.appendChild(loadingOverlay);
    
    // Get date for filename
    const today = new Date();
    const dateString = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const fileName = `Financial_Table_${selectedDivision}_${dateString}.pdf`;
    
    // Create variables outside try block so we can access them in catch/finally
    let wrapper = null;
    
    try {
      // Create a wrapper div for better control
      wrapper = document.createElement('div');
      wrapper.className = 'pdf-export-wrapper';
      wrapper.style.width = '277mm'; // A4 landscape width minus 20mm margins
      wrapper.style.boxSizing = 'border-box';
      wrapper.style.margin = '0';
      wrapper.style.padding = '0';
      wrapper.style.backgroundColor = '#ffffff';
      document.body.appendChild(wrapper);
      
      // Create title for PDF
      const titleDiv = document.createElement('div');
      titleDiv.innerHTML = `
        <h2 style="text-align:center; margin-bottom:5px; margin-top:0; color:#333; font-size:18px;">Financial Table</h2>
        <div style="text-align:center; margin-bottom:10px; font-weight:bold; font-size:12px;">(AED)</div>
      `;
      wrapper.appendChild(titleDiv);
      
      // Clone the table with proper styling preserved
      const tableContent = document.createElement('div');
      tableContent.className = 'pdf-table-container';
      tableContent.style.width = '100%';
      tableContent.style.overflow = 'visible';
      tableContent.style.margin = '0';
      tableContent.style.padding = '0';
      
      // Clone the original table
      const tableClone = tableRef.current.cloneNode(true);
      tableClone.className = 'financial-table pdf-export-table';
      tableClone.style.width = '100%';
      tableClone.style.tableLayout = 'fixed';
      tableClone.style.borderCollapse = 'collapse';
      tableClone.style.margin = '0 auto';
      tableClone.style.fontSize = '9px';
      
      // Adjust cell styles directly
      const allCells = tableClone.querySelectorAll('th, td');
      allCells.forEach(cell => {
        cell.style.fontFamily = 'Arial, sans-serif';
        cell.style.padding = '3px 4px';
        cell.style.fontSize = '9px';
        cell.style.overflow = 'hidden';
        cell.style.textOverflow = 'ellipsis';
        cell.style.whiteSpace = 'nowrap';
        cell.style.border = '1px solid #ddd';
      });
      
      // Handle header styling
      const headerCells = tableClone.querySelectorAll('thead th');
      headerCells.forEach(cell => {
        cell.style.fontWeight = 'bold';
        cell.style.textAlign = 'center';
      });
      
      // Handle first column cells
      const firstColCells = tableClone.querySelectorAll('td:first-child');
      firstColCells.forEach(cell => {
        cell.style.textAlign = 'left';
        cell.style.paddingLeft = '6px';
        cell.style.backgroundColor = '#ffffff';
      });
      
      // Handle amount cells
      const amountCells = tableClone.querySelectorAll('td:nth-child(3n+2)');
      amountCells.forEach(cell => {
        cell.style.textAlign = 'right';
        cell.style.paddingRight = '8px';
      });
      
      // Apply header colors safely
      const headerRows = tableClone.querySelectorAll('thead tr');
      headerRows.forEach((row, rowIndex) => {
        const headerCells = row.querySelectorAll('th');
        headerCells.forEach((cell, cellIndex) => {
          // Skip the first empty cell in the header
          if (rowIndex === 0 && cellIndex === 0) return;
          
          // Apply default header styling if column information is missing
          let backgroundColor = '#288cfa'; // Default blue
          let textColor = '#FFFFFF';      // Default white text
          
          try {
            // Try to get column information safely
            const colIndex = Math.floor((cellIndex - 1) / 3);
            if (colIndex < columnOrder.length) {
              const column = columnOrder[colIndex];
              if (column) {
                // Get style safely with fallbacks
                const style = getColumnHeaderStyle(column);
                if (style) {
                  backgroundColor = style.backgroundColor || backgroundColor;
                  textColor = style.color || textColor;
                }
              }
            }
          } catch (error) {
            console.log('Error applying header color, using default', error);
          }
          
          // Apply the styles
          cell.style.backgroundColor = backgroundColor;
          cell.style.color = textColor;
        });
      });
      
      // Apply cell background colors safely
      const dataRows = tableClone.querySelectorAll('tbody tr:not(.separator-row)');
      dataRows.forEach(row => {
        const dataCells = row.querySelectorAll('td:not(:first-child)');
        dataCells.forEach((cell, cellIndex) => {
          try {
            const colIndex = Math.floor(cellIndex / 3);
            if (colIndex < columnOrder.length) {
              const column = columnOrder[colIndex];
              if (column) {
                // Get background color safely
                const bgColor = getCellBackgroundColor(column);
                if (bgColor) {
                  cell.style.backgroundColor = bgColor;
                }
              }
            }
          } catch (error) {
            console.log('Error applying cell background color', error);
          }
        });
      });
      
      // Ensure separator rows have proper styling
      const separatorRows = tableClone.querySelectorAll('tr.separator-row');
      separatorRows.forEach(row => {
        row.style.height = '4px';
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
          cell.style.padding = '0';
          cell.style.border = 'none';
          cell.style.backgroundColor = '#f9f9f9';
        });
      });
      
      // Add table to the wrapper
      tableContent.appendChild(tableClone);
      wrapper.appendChild(tableContent);
      
      // Use html2canvas with improved settings
      html2canvas(wrapper, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: 277*3.78, // Convert mm to px for better scaling
        height: 190*3.78  // Convert mm to px for better scaling
      }).then(canvas => {
        // Define A4 landscape dimensions (297mm × 210mm)
        const pdfWidth = 297;
        const pdfHeight = 210;
        
        // Create PDF in landscape orientation
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        
        // Calculate margins
        const marginLeft = 10;
        const marginTop = 10;
        const contentWidth = pdfWidth - (marginLeft * 2);
        const contentHeight = pdfHeight - (marginTop * 2);
        
        // Add the canvas as image
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', marginLeft, marginTop, contentWidth, contentHeight);
        
        // Add footer
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Generated on: ${new Date().toLocaleDateString()} - ${selectedDivision}`, pdfWidth - 15, pdfHeight - 5, { align: 'right' });
        
        // Save PDF
        pdf.save(fileName);
        
        // Clean up using our safe helper
        safelyRemoveElement(wrapper);
        safelyRemoveElement(loadingOverlay);
      }).catch(error => {
        console.error('Error generating PDF canvas:', error);
        alert('Error generating PDF. Please try again.');
      }).finally(() => {
        // Cleanup after promise completes (success or error)
        safelyRemoveElement(wrapper);
        safelyRemoveElement(loadingOverlay);
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error generating PDF. Please try again.');
      
      // Cleanup in case of error before promise
      safelyRemoveElement(wrapper);
      safelyRemoveElement(loadingOverlay);
    }
  }; // End of exportToPDF function
  
  return (
    <div className="table-view">
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <button 
              onClick={exportToPDF} 
              className="export-pdf-btn"
              title="Export to PDF"
            >
              Export to PDF
            </button>
          </div>
          <div style={{ flex: 2, textAlign: 'center' }}>
            <h3 style={{ marginBottom: '2px', color: '#333' }}>Financial Table</h3>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>(AED)</div>
          </div>
          <div style={{ flex: 1 }}></div>
        </div>
      </div>
      <div className="table-container" style={{ display: 'flex', justifyContent: 'center' }}>
        <table className="financial-table" ref={tableRef}>
          <colgroup>
            <col style={{ width: '302px' }}/>
          </colgroup>
          {columnOrder.map((_, index) => (
            <colgroup key={`colgroup-${index}`} className="period-column-group">
              <col style={{ width: '80px' }}/>
              <col style={{ width: '48px' }}/>
              <col style={{ width: '57px' }}/>
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
                  {column.month}
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
                  <th style={{...getColumnHeaderStyle(column), fontSize: '13px', width: '80px'}}>
                    Amount
                  </th>
                  <th style={{...getColumnHeaderStyle(column), fontSize: '12px', lineHeight: '1.1', width: '48px', textAlign: 'center', padding: '2px'}}>
                    %<br/>of<br/>Sales
                  </th>
                  <th style={{...getColumnHeaderStyle(column), fontSize: '12px', lineHeight: '1.1', width: '57px', textAlign: 'center', padding: '2px'}}>
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
              
              // Otherwise render a normal data row
              // Check if this row should have bold styling in ledger column based on the label
              const isImportantRow = 
                row.label === 'Sales' || 
                row.label === 'Margin over Material' || 
                row.label === 'Cost of Sales' ||
                row.label === 'Labour' ||
                row.label === 'Dir.Cost in Stock/Stock Adj.' ||
                row.label === 'Gross profit (after Depn.)' ||
                row.label === 'Selling expenses' ||
                row.label === 'Total Below GP Expenses' ||
                row.label === 'Total Expenses' ||
                row.label === 'Net Profit' ||
                row.label.trim().toUpperCase() === 'EBITDA';
              
              return (
                <tr key={row.key} className={`${row.isHeader ? 'section-header' : ''} ${isImportantRow ? 'important-row' : ''}`}>
                  <td className="row-label">{row.label}</td>
                  {columnOrder.flatMap((column, colIndex) => {
                    // Handle calculated fields with formulas
                    if (row.isCalculated) {
                      // Get background color based on the column's properties
                      const bgColor = getCellBackgroundColor(column);

                      // Process formulas based on the type
                      let formattedResult = 'N/A';
                      if (row.formula === 'sales-material') {
                        // Find the values for sales and material in this column
                        const salesValue = computeCellValue(3, column);
                        const materialValue = computeCellValue(4, column);

                        // Convert string values with commas back to numbers for calculation
                        const salesNum = salesValue === 'N/A' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                        const materialNum = materialValue === 'N/A' ? 0 : parseFloat(materialValue.replace(/,/g, ''));

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
                        const num9 = value9 === 'N/A' ? 0 : parseFloat(value9.replace(/,/g, ''));
                        const num10 = value10 === 'N/A' ? 0 : parseFloat(value10.replace(/,/g, ''));
                        const num12 = value12 === 'N/A' ? 0 : parseFloat(value12.replace(/,/g, ''));
                        const num13 = value13 === 'N/A' ? 0 : parseFloat(value13.replace(/,/g, ''));

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

                        const num9 = value9 === 'N/A' ? 0 : parseFloat(value9.replace(/,/g, ''));
                        const num10 = value10 === 'N/A' ? 0 : parseFloat(value10.replace(/,/g, ''));
                        const num12 = value12 === 'N/A' ? 0 : parseFloat(value12.replace(/,/g, ''));
                        const num13 = value13 === 'N/A' ? 0 : parseFloat(value13.replace(/,/g, ''));

                        // Value for row 14
                        const num14 = num9 + num10 + num12 + num13;

                        // Get row 15 value
                        const value15 = computeCellValue(15, column);
                        const num15 = value15 === 'N/A' ? 0 : parseFloat(value15.replace(/,/g, ''));

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
                        
                        const num9 = value9 === 'N/A' ? 0 : parseFloat(value9.replace(/,/g, ''));
                        const num10 = value10 === 'N/A' ? 0 : parseFloat(value10.replace(/,/g, ''));
                        const num12 = value12 === 'N/A' ? 0 : parseFloat(value12.replace(/,/g, ''));
                        const num13 = value13 === 'N/A' ? 0 : parseFloat(value13.replace(/,/g, ''));

                        // Value for row 14
                        const num14 = num9 + num10 + num12 + num13;
                        
                        // Get row 15 value
                        const value15 = computeCellValue(15, column);
                        const num15 = value15 === 'N/A' ? 0 : parseFloat(value15.replace(/,/g, ''));

                        // Calculate row 16 = row 14 + row 15
                        const num16 = num14 + num15;

                        // Get Material value (row 4)
                        const materialValue = computeCellValue(4, column);
                        const material = materialValue === 'N/A' ? 0 : parseFloat(materialValue.replace(/,/g, ''));

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
                        const sales = salesValue === 'N/A' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                        
                        // Get Material value (row 4)
                        const materialValue = computeCellValue(4, column);
                        const material = materialValue === 'N/A' ? 0 : parseFloat(materialValue.replace(/,/g, ''));
                        
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
                        
                        const sales = salesValue === 'N/A' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                        const material = materialValue === 'N/A' ? 0 : parseFloat(materialValue.replace(/,/g, ''));
                        
                        const row19 = sales - material;
                        
                        // Get Row 10 value
                        const row10Value = computeCellValue(10, column);
                        const row10 = row10Value === 'N/A' ? 0 : parseFloat(row10Value.replace(/,/g, ''));
                        
                        // Calculate Row 21 = Row 19 + Row 10
                        const result = row19 + row10;
                        
                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'sum-31-32-40-42-43-44-49-50') {
                        // Get values for all rows to be summed
                        const value31 = computeCellValue(31, column);
                        const value32 = computeCellValue(32, column);
                        const value40 = computeCellValue(40, column);
                        const value42 = computeCellValue(42, column);
                        const value43 = computeCellValue(43, column);
                        const value44 = computeCellValue(44, column);
                        const value49 = computeCellValue(49, column);
                        const value50 = computeCellValue(50, column);

                        // Convert to numbers, handling 'N/A' values as 0
                        const num31 = value31 === 'N/A' ? 0 : parseFloat(value31.replace(/,/g, ''));
                        const num32 = value32 === 'N/A' ? 0 : parseFloat(value32.replace(/,/g, ''));
                        const num40 = value40 === 'N/A' ? 0 : parseFloat(value40.replace(/,/g, ''));
                        const num42 = value42 === 'N/A' ? 0 : parseFloat(value42.replace(/,/g, ''));
                        const num43 = value43 === 'N/A' ? 0 : parseFloat(value43.replace(/,/g, ''));
                        const num44 = value44 === 'N/A' ? 0 : parseFloat(value44.replace(/,/g, ''));
                        const num49 = value49 === 'N/A' ? 0 : parseFloat(value49.replace(/,/g, ''));
                        const num50 = value50 === 'N/A' ? 0 : parseFloat(value50.replace(/,/g, ''));

                        // Calculate the sum of all rows
                        const result = num31 + num32 + num40 + num42 + num43 + num44 + num49 + num50;
                        
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
                        const num9 = value9 === 'N/A' ? 0 : parseFloat(value9.replace(/,/g, ''));
                        const num10 = value10 === 'N/A' ? 0 : parseFloat(value10.replace(/,/g, ''));
                        const num12 = value12 === 'N/A' ? 0 : parseFloat(value12.replace(/,/g, ''));
                        const num13 = value13 === 'N/A' ? 0 : parseFloat(value13.replace(/,/g, ''));

                        // Calculate Row 14 as sum of rows 9, 10, 12, 13
                        const row14 = num9 + num10 + num12 + num13;
                        
                        // For Row 52, we need to calculate it based on rows 31, 32, 40, 42, 43, 44, 49, 50
                        const value31 = computeCellValue(31, column);
                        const value32 = computeCellValue(32, column);
                        const value40 = computeCellValue(40, column);
                        const value42 = computeCellValue(42, column);
                        const value43 = computeCellValue(43, column);
                        const value44 = computeCellValue(44, column);
                        const value49 = computeCellValue(49, column);
                        const value50 = computeCellValue(50, column);

                        // Parse values to numbers
                        const num31 = value31 === 'N/A' ? 0 : parseFloat(value31.replace(/,/g, ''));
                        const num32 = value32 === 'N/A' ? 0 : parseFloat(value32.replace(/,/g, ''));
                        const num40 = value40 === 'N/A' ? 0 : parseFloat(value40.replace(/,/g, ''));
                        const num42 = value42 === 'N/A' ? 0 : parseFloat(value42.replace(/,/g, ''));
                        const num43 = value43 === 'N/A' ? 0 : parseFloat(value43.replace(/,/g, ''));
                        const num44 = value44 === 'N/A' ? 0 : parseFloat(value44.replace(/,/g, ''));
                        const num49 = value49 === 'N/A' ? 0 : parseFloat(value49.replace(/,/g, ''));
                        const num50 = value50 === 'N/A' ? 0 : parseFloat(value50.replace(/,/g, ''));

                        // Calculate Row 52 as sum of rows 31, 32, 40, 42, 43, 44, 49, 50
                        const row52 = num31 + num32 + num40 + num42 + num43 + num44 + num49 + num50;
                        
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
                        
                        const sales = salesValue === 'N/A' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                        const material = materialValue === 'N/A' ? 0 : parseFloat(materialValue.replace(/,/g, ''));
                        
                        const row19 = sales - material;
                        
                        // Then calculate Row 52 (sum of rows 31, 32, 40, 42, 43, 44, 49, 50)
                        const value31 = computeCellValue(31, column);
                        const value32 = computeCellValue(32, column);
                        const value40 = computeCellValue(40, column);
                        const value42 = computeCellValue(42, column);
                        const value43 = computeCellValue(43, column);
                        const value44 = computeCellValue(44, column);
                        const value49 = computeCellValue(49, column);
                        const value50 = computeCellValue(50, column);

                        const num31 = value31 === 'N/A' ? 0 : parseFloat(value31.replace(/,/g, ''));
                        const num32 = value32 === 'N/A' ? 0 : parseFloat(value32.replace(/,/g, ''));
                        const num40 = value40 === 'N/A' ? 0 : parseFloat(value40.replace(/,/g, ''));
                        const num42 = value42 === 'N/A' ? 0 : parseFloat(value42.replace(/,/g, ''));
                        const num43 = value43 === 'N/A' ? 0 : parseFloat(value43.replace(/,/g, ''));
                        const num44 = value44 === 'N/A' ? 0 : parseFloat(value44.replace(/,/g, ''));
                        const num49 = value49 === 'N/A' ? 0 : parseFloat(value49.replace(/,/g, ''));
                        const num50 = value50 === 'N/A' ? 0 : parseFloat(value50.replace(/,/g, ''));

                        const row52 = num31 + num32 + num40 + num42 + num43 + num44 + num49 + num50;
                        
                        // Calculate Row 54 = Row 19 - Row 52
                        const result = row19 - row52;
                        
                        // Format the result with commas
                        formattedResult = result.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });
                      } else if (row.formula === 'sum-54-19-42-44') {
                        // Calculate Row 54 (Row19 - Row52)
                        // First calculate Row 19 (Sales - Material)
                        const salesValue = computeCellValue(3, column);
                        const materialValue = computeCellValue(4, column);
                        
                        const sales = salesValue === 'N/A' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                        const material = materialValue === 'N/A' ? 0 : parseFloat(materialValue.replace(/,/g, ''));
                        
                        const row19 = sales - material;
                        
                        // Then calculate Row 52 (sum of rows 31, 32, 40, 42, 43, 44, 49, 50)
                        const value31 = computeCellValue(31, column);
                        const value32 = computeCellValue(32, column);
                        const value40 = computeCellValue(40, column);
                        const value42 = computeCellValue(42, column);
                        const value43 = computeCellValue(43, column);
                        const value44 = computeCellValue(44, column);
                        const value49 = computeCellValue(49, column);
                        const value50 = computeCellValue(50, column);

                        const num31 = value31 === 'N/A' ? 0 : parseFloat(value31.replace(/,/g, ''));
                        const num32 = value32 === 'N/A' ? 0 : parseFloat(value32.replace(/,/g, ''));
                        const num40 = value40 === 'N/A' ? 0 : parseFloat(value40.replace(/,/g, ''));
                        const num42 = value42 === 'N/A' ? 0 : parseFloat(value42.replace(/,/g, ''));
                        const num43 = value43 === 'N/A' ? 0 : parseFloat(value43.replace(/,/g, ''));
                        const num44 = value44 === 'N/A' ? 0 : parseFloat(value44.replace(/,/g, ''));
                        const num49 = value49 === 'N/A' ? 0 : parseFloat(value49.replace(/,/g, ''));
                        const num50 = value50 === 'N/A' ? 0 : parseFloat(value50.replace(/,/g, ''));

                        const row52 = num31 + num32 + num40 + num42 + num43 + num44 + num49 + num50;
                        
                        // Calculate Row 54
                        const row54 = row19 - row52;
                        
                        // Now calculate Row 56 = Row 54 + Row 19 + Row 42 + Row 44
                        const result = row54 + row19 + num42 + num44;
                        
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
                          style={{ backgroundColor: bgColor, width: '80px' }}
                        >
                          {formattedResult}
                        </td>,
                        <td
                          key={`percent-${row.key}-${colIndex}`}
                          className="calculated-cell"
                          style={{ backgroundColor: bgColor, width: '57px' }}
                        >
                          {(() => {
                            // For Direct cost as % of C.O.G.S (index -5), show empty cell
                            if (row.index === -5) return '';
                            
                            try {
                              // Convert formattedResult to number for calculation
                              const cellNum = formattedResult === 'N/A' ? 0 : parseFloat(formattedResult.replace(/,/g, ''));
                              const salesValue = computeCellValue(3, column); // Row 3 is Sales
                              const salesNum = salesValue === 'N/A' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
                              
                              // Calculate percentage
                              if (salesNum === 0) return 'N/A';
                              
                              const percentValue = (cellNum / salesNum) * 100;
                              
                              // Format with 2 decimal places
                              return percentValue.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }) + '%';
                            } catch (error) {
                              console.error('Error computing percent of sales for calculated cell:', error);
                              return 'Error';
                            }
                          })()}
                        </td>,
                        <td
                          key={`perkg-${row.key}-${colIndex}`}
                          className="calculated-cell"
                          style={{ backgroundColor: bgColor, width: '57px' }}
                        >
                          {(() => {
                            // For Direct cost as % of C.O.G.S (index -5), show empty cell
                            if (row.index === -5) return '';
                            
                            try {
                              // Convert formattedResult to number for calculation
                              const cellNum = formattedResult === 'N/A' ? 0 : parseFloat(formattedResult.replace(/,/g, ''));
                              const salesVolumeValue = computeCellValue(7, column); // Row 7 is Sales Volume
                              const salesVolumeNum = salesVolumeValue === 'N/A' ? 0 : parseFloat(salesVolumeValue.replace(/,/g, ''));
                              
                              // Calculate sales per kg
                              if (salesVolumeNum === 0) return 'N/A';
                              
                              const perKgValue = cellNum / salesVolumeNum;
                              
                              // Format with 2 decimal places
                              return perKgValue.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              });
                            } catch (error) {
                              console.error('Error computing sales per kg for calculated cell:', error);
                              return 'Error';
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
                        style={{ backgroundColor: bgColor, width: '80px' }}
                      >
                        {cellValue}
                      </td>,
                      <td 
                        key={`percent-${row.key}-${colIndex}`}
                        style={{ backgroundColor: bgColor, width: '57px' }}
                      >
                        {/* Keep % of Sales empty for specific rows */}
                        {row.index !== 7 && row.index !== 8 && row.index !== -5 ? computePercentOfSales(row.index, column) : ''}
                      </td>,
                      <td 
                        key={`perkg-${row.key}-${colIndex}`}
                        style={{ backgroundColor: bgColor, width: '57px' }}
                      >
                        {/* Keep Sales per kg empty for specific rows */}
                        {row.index !== 7 && row.index !== 8 && row.index !== -5 ? computeSalesPerKg(row.index, column) : ''}
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
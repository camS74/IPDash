import React, { useRef, useImperativeHandle } from 'react';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useFilter } from '../../contexts/FilterContext';

import './ProductGroupTable.css';

const ProductGroupTable = React.forwardRef((props, ref) => {
  const { salesData, getProductGroups } = useSalesData();
  const { selectedDivision } = useExcelData(); // Get selectedDivision from same context as Dashboard
  const { columnOrder, dataGenerated } = useFilter();
  const internalTableRef = useRef(null);
  const tableRef = ref || internalTableRef;

  // Expose the table ref for PDF export
  useImperativeHandle(ref, () => ({
    getTableElement: () => internalTableRef.current,
  }));

  // Only show data if Generate button has been clicked
  if (!dataGenerated) {
    return (
      <div className="table-view">
        <h3>Product Group Table</h3>
        <div className="table-empty-state">
          <p>Please select columns and click the Generate button to view product data.</p>
        </div>
      </div>
    );
  }

  // Get the Sales data based on selectedDivision from ExcelDataContext
  // For Product Groups, we need to map division names to the correct sheet names
  const getProductGroupSheetName = (division) => {
    return `${division}-Product Group`;
  };

  const divisionSheetName = getProductGroupSheetName(selectedDivision);
  const divisionData = salesData[divisionSheetName] || [];
  
  // Get product groups from the correct division data
  const getProductGroupsForDivision = (divisionName) => {
    const sheetName = getProductGroupSheetName(divisionName);
    const sheetData = salesData[sheetName] || [];
    const productGroups = [];
    
    // Extract unique product groups from column A (starting from row 4, index 3)
    for (let i = 3; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row && row[0] && row[3]) { // Product Group name exists and has Figures Heads
        const productGroup = row[0];
        const figuresHead = row[3];
        
        // Group by product name
        if (!productGroups.find(pg => pg.name === productGroup)) {
          productGroups.push({
            name: productGroup,
            material: row[1] || '',
            process: row[2] || '',
            metrics: []
          });
        }
        
        // Add metric to the product group
        const existingGroup = productGroups.find(pg => pg.name === productGroup);
        if (existingGroup && !existingGroup.metrics.find(m => m.type === figuresHead)) {
          existingGroup.metrics.push({
            type: figuresHead,
            rowIndex: i,
            data: row.slice(4) // Data starts from column 5 (index 4)
          });
        }
      }
    }
    
    return productGroups;
  };

  const productGroups = getProductGroupsForDivision(selectedDivision);

  // Dynamic function to get categories from Column C for the selected division
  const getCategoriesForDivision = (divisionName) => {
    const sheetName = getProductGroupSheetName(divisionName);
    const sheetData = salesData[sheetName] || [];
    const categories = new Set();
    
    // Extract unique values from Column C (Process) starting from row 4
    for (let i = 3; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row && row[2]) { // Column C (index 2) = Process
        const process = row[2].toString().trim();
        if (process && process.toLowerCase() !== 'n/a') {
          categories.add(process);
        }
      }
    }
    
    return Array.from(categories).sort(); // Return sorted array
  };

  const dynamicCategories = getCategoriesForDivision(selectedDivision);

  // Dynamic function to get material categories from Column B for the selected division
  const getMaterialCategoriesForDivision = (divisionName) => {
    const sheetName = getProductGroupSheetName(divisionName);
    const sheetData = salesData[sheetName] || [];
    const materialCategories = new Set();
    
    // Extract unique values from Column B (Material) starting from row 4
    for (let i = 3; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row && row[1]) { // Column B (index 1) = Material
        const material = row[1].toString().trim();
        if (material && material.toLowerCase() !== 'n/a') {
          materialCategories.add(material);
        }
      }
    }
    
    // Sort alphabetically but put "Others" at the end
    const sortedCategories = Array.from(materialCategories).sort();
    const othersIndex = sortedCategories.indexOf('Others');
    
    if (othersIndex !== -1) {
      // Remove "Others" from its current position and add it to the end
      sortedCategories.splice(othersIndex, 1);
      sortedCategories.push('Others');
    }
    
    return sortedCategories;
  };

  const dynamicMaterialCategories = getMaterialCategoriesForDivision(selectedDivision);

  // Function to check if a product group is empty across all selected periods and metrics
  const isProductGroupEmpty = (productGroup, selectedColumns) => {
    const metricsToCheck = ['KGS', 'Sales', 'MoRM', 'Sls/Kg', 'RM/kg', 'MoRM/Kg', 'MoRM %'];
    
    for (const metric of metricsToCheck) {
      for (const column of selectedColumns.filter(col => col.columnType !== 'delta')) {
        let value;
        if (['KGS', 'Sales', 'MoRM'].includes(metric)) {
          value = getRawValue(productGroup, metric, column);
        } else {
          value = calculateDerivedMetric(productGroup, metric, column);
        }
        if (value > 0) return false; // Found non-zero value, not empty
      }
    }
    return true; // All values are zero/empty
  };

  // Function to check if a category is empty across all selected periods and metrics
  const isCategoryEmpty = (categoryName, categoryType, selectedColumns) => {
    const metricsToCheck = ['KGS', 'Sales', 'MoRM', 'Sls/Kg', 'RM/kg', 'MoRM/Kg', 'MoRM %'];
    
    for (const metric of metricsToCheck) {
      for (const column of selectedColumns.filter(col => col.columnType !== 'delta')) {
        let value;
        if (['KGS', 'Sales', 'MoRM'].includes(metric)) {
          value = calculateCategoryTotals(column, metric, categoryName, categoryType);
        } else {
          value = calculateDerivedCategoryTotals(column, metric, categoryName, categoryType);
        }
        if (value > 0) return false; // Found non-zero value, not empty
      }
    }
    return true; // All values are zero/empty
  };

  // Note: visibleProductGroups filtering will be done after extendedColumns is created

  if (!divisionData.length || !productGroups.length) {
    return (
      <div className="table-view">
        <h3>Product Group Table</h3>
        <div className="table-empty-state">
          <p>No product group data available. Please ensure Sales data is loaded.</p>
        </div>
      </div>
    );
  }

  // Helper function to get value from sales data based on period selection
  const getRawValue = (productGroup, metricType, column) => {
    const metric = productGroup.metrics.find(m => m.type === metricType);
    if (!metric || !metric.data) {
      return 0;
    }

    // For sales data, we need to find matching columns from the raw Excel data
    // Get the sales sheet data to access headers
    const divisionSheetName = getProductGroupSheetName(selectedDivision);
    const divisionData = salesData[divisionSheetName] || [];
    if (divisionData.length < 3) return 0;

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

    // Sum values for matching year, month(s), and type from sales data
    let sum = 0;
    let foundValues = false;
    
    // Check columns starting from index 4 (where data starts)
    for (let colIndex = 4; colIndex < divisionData[0]?.length || 0; colIndex++) {
      const yearValue = divisionData[0] && divisionData[0][colIndex];
      const monthValue = divisionData[1] && divisionData[1][colIndex];
      const typeValue = divisionData[2] && divisionData[2][colIndex];
      
      if (yearValue == column.year &&
          monthsToInclude.includes(monthValue) &&
          typeValue === column.type) {
        
        const dataIndex = colIndex - 4; // Adjust for data array starting at column 4
        const value = metric.data[dataIndex];
        
        if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
          sum += parseFloat(value);
          foundValues = true;
        }
      }
    }
    
    return foundValues ? sum : 0;
  };

  // Helper function to calculate derived metrics
  const calculateDerivedMetric = (productGroup, metricType, column) => {
    const kgs = getRawValue(productGroup, 'KGS', column);
    const sales = getRawValue(productGroup, 'Sales', column);
    const morm = getRawValue(productGroup, 'MoRM', column);

    switch (metricType) {
      case 'Sls/Kg':
        return kgs > 0 ? sales / kgs : 0;
      case 'RM/kg':
        return kgs > 0 ? (sales - morm) / kgs : 0;
      case 'MoRM/Kg':
        return kgs > 0 ? morm / kgs : 0;
      case 'MoRM %':
        return sales > 0 ? (morm / sales) * 100 : 0;
      default:
        return 0;
    }
  };

  // Helper function to format numbers
  const formatNumber = (value, metricType) => {
    if (value === 0 || isNaN(value)) return '';
    
    if (metricType === 'MoRM %') {
      return `${value.toFixed(1)}%`;
    } else if (['Sls/Kg', 'RM/kg', 'MoRM/Kg'].includes(metricType)) {
      return value.toFixed(2);
    } else {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    }
  };

  // Define the metrics to display for each product group
  const metricsToShow = ['KGS', 'Sales', 'MoRM', 'Sls/Kg', 'RM/kg', 'MoRM/Kg', 'MoRM %'];

  // Helper function to calculate totals for each column
  const calculateColumnTotals = (column, metricType) => {
    let total = 0;
    
    productGroups.forEach(productGroup => {
      // Skip Services Charges for KGS-related calculations
      if (productGroup.name === 'Services Charges' && 
          ['KGS', 'Sls/Kg', 'RM/kg', 'MoRM/Kg'].includes(metricType)) {
        return;
      }
      
      if (['KGS', 'Sales', 'MoRM'].includes(metricType)) {
        // Raw data - sum across all product groups
        total += getRawValue(productGroup, metricType, column);
      }
    });
    
    return total;
  };

  // Helper function to calculate derived totals
  const calculateDerivedTotals = (column, metricType) => {
    const totalKgs = calculateColumnTotals(column, 'KGS');
    const totalSales = calculateColumnTotals(column, 'Sales');
    const totalMorm = calculateColumnTotals(column, 'MoRM');

    switch (metricType) {
      case 'Sls/Kg':
        return totalKgs > 0 ? totalSales / totalKgs : 0;
      case 'RM/kg':
        return totalKgs > 0 ? (totalSales - totalMorm) / totalKgs : 0;
      case 'MoRM/Kg':
        return totalKgs > 0 ? totalMorm / totalKgs : 0;
      case 'MoRM %':
        return totalSales > 0 ? (totalMorm / totalSales) * 100 : 0;
      default:
        return 0;
    }
  };

  // Helper function to calculate category totals based on Process and Material columns
  const calculateCategoryTotals = (column, metricType, categoryName, categoryType = 'process') => {
    const divisionSheetName = getProductGroupSheetName(selectedDivision);
    const divisionData = salesData[divisionSheetName] || [];
    if (divisionData.length < 4) return 0;

    // Determine which months to include based on selected period - SAME LOGIC AS getRawValue
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

    let sum = 0;
    
    // Check columns starting from index 4 (where data starts) - SAME AS getRawValue
    for (let colIndex = 4; colIndex < divisionData[0]?.length || 0; colIndex++) {
      const yearValue = divisionData[0] && divisionData[0][colIndex];
      const monthValue = divisionData[1] && divisionData[1][colIndex];
      const typeValue = divisionData[2] && divisionData[2][colIndex];
      
      if (yearValue == column.year &&
          monthsToInclude.includes(monthValue) &&
          typeValue === column.type) {
        
        // Process all data rows for this matching column
        for (let rowIndex = 3; rowIndex < divisionData.length; rowIndex++) {
          const row = divisionData[rowIndex];
          if (!row || row.length < 4) continue;
          
          const productGroup = row[0]; // Column A - Product Group
          const material = row[1]; // Column B - Material  
          const process = row[2]; // Column C - Process
          const figuresHead = row[3]; // Column D - Figures Head
          
          // Skip Services Charges for KGS-related calculations (same as calculateColumnTotals)
          if (productGroup === 'Services Charges' && 
              ['KGS', 'Sls/Kg', 'RM/kg', 'MoRM/Kg'].includes(metricType)) {
            continue;
          }
          
          // Check if this row matches the metric type
          let matchesMetric = false;
          if (metricType === 'KGS') {
            matchesMetric = figuresHead && figuresHead.toString().toLowerCase().includes('kgs');
          } else if (metricType === 'Sales') {
            matchesMetric = figuresHead && figuresHead.toString().toLowerCase().includes('sales');
          } else if (metricType === 'MoRM') {
            matchesMetric = figuresHead && figuresHead.toString().toLowerCase().includes('morm');
          }
          
          if (!matchesMetric) continue;
          
          // Check if this row matches the category criteria (exact match with specified column)
          let matchesCategory = false;
          
          if (categoryType === 'process') {
            // Match against Column C (Process)
            if (process && process.toString().trim() === categoryName) {
              matchesCategory = true;
            }
          } else if (categoryType === 'material') {
            // Match against Column B (Material)
            if (material && material.toString().trim() === categoryName) {
              matchesCategory = true;
            }
          }
          
          if (matchesCategory) {
            const value = row[colIndex];
            if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
              sum += parseFloat(value);
            }
          }
        }
      }
    }
    
    return sum;
  };

  // Helper function to calculate derived category totals
  const calculateDerivedCategoryTotals = (column, metricType, categoryName, categoryType = 'process') => {
    const categoryKgs = calculateCategoryTotals(column, 'KGS', categoryName, categoryType);
    const categorySales = calculateCategoryTotals(column, 'Sales', categoryName, categoryType);
    const categoryMorm = calculateCategoryTotals(column, 'MoRM', categoryName, categoryType);

    switch (metricType) {
      case 'Sls/Kg':
        return categoryKgs > 0 ? categorySales / categoryKgs : 0;
      case 'RM/kg':
        return categoryKgs > 0 ? (categorySales - categoryMorm) / categoryKgs : 0;
      case 'MoRM/Kg':
        return categoryKgs > 0 ? categoryMorm / categoryKgs : 0;
      case 'MoRM %':
        return categorySales > 0 ? (categoryMorm / categorySales) * 100 : 0;
      default:
        return 0;
    }
  };

  // Color schemes available for columns - MUST MATCH TableView.js exactly
  const colorSchemes = [
    { name: 'blue', label: 'Blue', primary: '#288cfa', secondary: '#103766', light: '#E3F2FD', isDark: true },
    { name: 'green', label: 'Green', primary: '#2E865F', secondary: '#C6F4D6', light: '#E8F5E9', isDark: true },
    { name: 'yellow', label: 'Yellow', primary: '#FFD700', secondary: '#FFFDE7', light: '#FFFDE7', isDark: false },
    { name: 'orange', label: 'Orange', primary: '#FF6B35', secondary: '#FFE0B2', light: '#FFF3E0', isDark: false },
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

  // Create extended column order with delta columns
  const extendedColumns = [];
  columnOrder.forEach((column, index) => {
    // Add the data column
    extendedColumns.push({ ...column, columnType: 'data' });
    
    // Add delta column after each column except the last one
    if (index < columnOrder.length - 1) {
      extendedColumns.push({
        columnType: 'delta',
        deltaIndex: index,
        fromColumn: columnOrder[index],
        toColumn: columnOrder[index + 1]
      });
    }
  });

  // Filter out empty product groups and categories (after extendedColumns is created)
  const visibleProductGroups = productGroups.filter(pg => !isProductGroupEmpty(pg, extendedColumns));
  const visibleProcessCategories = dynamicCategories.filter(cat => !isCategoryEmpty(cat, 'process', extendedColumns));
  const visibleMaterialCategories = dynamicMaterialCategories.filter(cat => !isCategoryEmpty(cat, 'material', extendedColumns));

  // Helper function to calculate percentage difference
  const calculateDelta = (productGroup, metricType, fromColumn, toColumn) => {
    let fromValue, toValue;
    
    if (['KGS', 'Sales', 'MoRM'].includes(metricType)) {
      fromValue = getRawValue(productGroup, metricType, fromColumn);
      toValue = getRawValue(productGroup, metricType, toColumn);
    } else {
      fromValue = calculateDerivedMetric(productGroup, metricType, fromColumn);
      toValue = calculateDerivedMetric(productGroup, metricType, toColumn);
    }
    
    if (fromValue === 0 || isNaN(fromValue) || isNaN(toValue)) {
      return 0;
    }
    
    return ((toValue - fromValue) / fromValue) * 100;
  };

  // Helper function to calculate total delta
  const calculateTotalDelta = (metricType, fromColumn, toColumn) => {
    let fromValue, toValue;
    
    if (['KGS', 'Sales', 'MoRM'].includes(metricType)) {
      fromValue = calculateColumnTotals(fromColumn, metricType);
      toValue = calculateColumnTotals(toColumn, metricType);
    } else {
      fromValue = calculateDerivedTotals(fromColumn, metricType);
      toValue = calculateDerivedTotals(toColumn, metricType);
    }
    
    if (fromValue === 0 || isNaN(fromValue) || isNaN(toValue)) {
      return 0;
    }
    
    return ((toValue - fromValue) / fromValue) * 100;
  };

  // Helper function to calculate category delta
  const calculateCategoryDelta = (metricType, categoryName, fromColumn, toColumn, categoryType = 'process') => {
    let fromValue, toValue;
    
    if (['KGS', 'Sales', 'MoRM'].includes(metricType)) {
      fromValue = calculateCategoryTotals(fromColumn, metricType, categoryName, categoryType);
      toValue = calculateCategoryTotals(toColumn, metricType, categoryName, categoryType);
    } else {
      fromValue = calculateDerivedCategoryTotals(fromColumn, metricType, categoryName, categoryType);
      toValue = calculateDerivedCategoryTotals(toColumn, metricType, categoryName, categoryType);
    }
    
    if (fromValue === 0 || isNaN(fromValue) || isNaN(toValue)) {
      return 0;
    }
    
    return ((toValue - fromValue) / fromValue) * 100;
  };

  // Helper function to format delta values with arrows
  const formatDelta = (delta) => {
    if (isNaN(delta) || delta === 0) return '';
    
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

  // Helper function to get delta cell style
  const getDeltaCellStyle = (deltaFormatted) => {
    return {
      backgroundColor: '#f8f9fa',
      textAlign: 'center',
      color: deltaFormatted === '' ? '#000000' : deltaFormatted.color,
      fontWeight: 'bold',
      fontSize: '11px',
      lineHeight: '1.2',
      padding: '4px 2px'
    };
  };

  // Helper function to calculate percentage of sales for each product group
  const calculateSalesPercentage = (productGroup, column) => {
    // Get sales for this product group
    const productGroupSales = getRawValue(productGroup, 'Sales', column);
    
    // Get total sales across all product groups
    const totalSales = calculateColumnTotals(column, 'Sales');
    
    // Calculate percentage
    if (totalSales > 0) {
      return (productGroupSales / totalSales) * 100;
    }
    return 0;
  };

  // Helper function to calculate percentage of sales for each category
  const calculateCategorySalesPercentage = (categoryName, column, categoryType = 'process') => {
    // Get sales for this category
    const categorySales = calculateCategoryTotals(column, 'Sales', categoryName, categoryType);
    
    // Get total sales across all product groups
    const totalSales = calculateColumnTotals(column, 'Sales');
    
    // Calculate percentage
    if (totalSales > 0) {
      return (categorySales / totalSales) * 100;
    }
    return 0;
  };

  // Helper to get user-friendly division name
  const getDivisionDisplayName = () => {
    const divisionNames = {
      'FP': 'Flexible Packaging',
      'SB': 'Shopping Bags',
      'TF': 'Thermoforming Products',
      'HCM': 'Harwal Container Manufacturing'
    };
    return divisionNames[selectedDivision] || selectedDivision;
  };

  return (
    <div className="product-group-table-container">
      <div ref={internalTableRef} className="table-container-for-export">
        <div className="table-title">
          <h2>{getDivisionDisplayName()} - Product Group Analysis</h2>
        </div>
        <div className="table-scroll-container">
          <table className="product-group-table-table">
            <thead>
              <tr className="main-header-row">
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
                      {col.year}
                    </th>
                  )
                ))}
              </tr>
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
              {visibleProductGroups.map((productGroup, pgIndex) => (
                <React.Fragment key={`product-group-${pgIndex}`}>
                  {/* Product Group Header Row */}
                  <tr className="product-header-row">
                    <td className="row-label product-header">{productGroup.name}</td>
                    {extendedColumns.map((col, colIndex) => {
                      if (col.columnType === 'delta') {
                        // Calculate delta for sales percentage between periods
                        const fromPercentage = calculateSalesPercentage(productGroup, col.fromColumn);
                        const toPercentage = calculateSalesPercentage(productGroup, col.toColumn);
                        const delta = toPercentage - fromPercentage;
                        const deltaFormatted = formatDelta(delta);
                        
                        return (
                          <td key={`header-delta-${pgIndex}-${colIndex}`} 
                              className="product-header-cell" 
                              style={getDeltaCellStyle(deltaFormatted)}>
                            {deltaFormatted === '' ? '' : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '0 0 auto' }}>{deltaFormatted.arrow}</span>
                                <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '1', textAlign: 'center' }}>{deltaFormatted.percentage}</span>
                              </div>
                            )}
                          </td>
                        );
                      } else {
                                                 // Regular period column - show % of Sales
                         const salesPercentage = calculateSalesPercentage(productGroup, col);
                         return (
                           <td key={`header-${pgIndex}-${colIndex}`} 
                               className="product-header-cell" 
                               style={{ 
                                 backgroundColor: getCellBackgroundColor(col),
                                 textAlign: 'center',
                                 fontSize: '13px',
                                 color: '#000',
                                 fontWeight: 'bold'
                               }}>
                             {salesPercentage.toFixed(2)}% of Sls
                           </td>
                         );
                      }
                    })}
                  </tr>
                  
                  {/* Metrics Rows */}
                  {metricsToShow.map((metricType, metricIndex) => {
                    // Hide weight-related metrics for Services Charges
                    if (productGroup.name === 'Services Charges' && 
                        ['KGS', 'Sls/Kg', 'RM/kg', 'MoRM/Kg'].includes(metricType)) {
                      return null;
                    }
                    
                    return (
                    <tr key={`${productGroup.name}-${metricType}`} className="metric-row">
                      <td className="row-label metric-label">{metricType}</td>
                      {extendedColumns.map((col, colIndex) => {
                        if (col.columnType === 'delta') {
                          // Delta column - calculate percentage difference
                          const delta = calculateDelta(productGroup, metricType, col.fromColumn, col.toColumn);
                          const deltaFormatted = formatDelta(delta);
                          return (
                            <td key={`delta-${metricType}-${colIndex}`} 
                                className="metric-cell delta-cell" 
                                style={getDeltaCellStyle(deltaFormatted)}>
                              {deltaFormatted === '' ? '' : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '0 0 auto' }}>{deltaFormatted.arrow}</span>
                                  <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '1', textAlign: 'center' }}>{deltaFormatted.percentage}</span>
                                </div>
                              )}
                            </td>
                          );
                        } else {
                          // Regular data column
                          let value;
                          if (['KGS', 'Sales', 'MoRM'].includes(metricType)) {
                            // Raw data from Excel - now using period-based filtering
                            value = getRawValue(productGroup, metricType, col);
                          } else {
                            // Calculated metrics - now using period-based filtering
                            value = calculateDerivedMetric(productGroup, metricType, col);
                          }
                          
                          return (
                            <td key={`${metricType}-${colIndex}`} 
                                className="metric-cell" 
                                style={{ 
                                  backgroundColor: getCellBackgroundColor(col), 
                                  textAlign: 'center' 
                                }}>
                              {formatNumber(value, metricType)}
                            </td>
                          );
                        }
                      })}
                    </tr>
                    );
                  }).filter(Boolean)}
                  
                  {/* Separator between product groups */}
                  {pgIndex < visibleProductGroups.length - 1 && (
                    <tr className="separator-row">
                      <td colSpan={extendedColumns.length + 1} className="separator-cell"></td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {/* Total Row */}
              <React.Fragment key="total-section">
                <tr className="separator-row">
                  <td colSpan={extendedColumns.length + 1} className="separator-cell"></td>
                </tr>
                
                {/* Total Header Row */}
                <tr className="product-header-row total-header-row">
                  <td className="row-label product-header total-header">Total</td>
                  {extendedColumns.map((col, colIndex) => (
                    <td key={`total-header-${colIndex}`} 
                        className="product-header-cell total-header-cell" 
                        style={col.columnType === 'delta' ? 
                          { backgroundColor: '#f8f9fa' } : 
                          { backgroundColor: getCellBackgroundColor(col) }}>
                    </td>
                  ))}
                </tr>
                
                {/* Total Metrics Rows */}
                {metricsToShow.map((metricType, metricIndex) => (
                  <tr key={`total-${metricType}`} className="metric-row total-metric-row">
                    <td className="row-label metric-label total-metric-label">{metricType}</td>
                    {extendedColumns.map((col, colIndex) => {
                      if (col.columnType === 'delta') {
                        // Delta column for totals
                        const delta = calculateTotalDelta(metricType, col.fromColumn, col.toColumn);
                        const deltaFormatted = formatDelta(delta);
                        return (
                          <td key={`total-delta-${metricType}-${colIndex}`} 
                              className="metric-cell total-metric-cell delta-cell" 
                              style={getDeltaCellStyle(deltaFormatted)}>
                            {deltaFormatted === '' ? '' : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '0 0 auto' }}>{deltaFormatted.arrow}</span>
                                <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '1', textAlign: 'center' }}>{deltaFormatted.percentage}</span>
                              </div>
                            )}
                          </td>
                        );
                      } else {
                        // Regular total column
                        let value;
                        if (['KGS', 'Sales', 'MoRM'].includes(metricType)) {
                          // Raw totals
                          value = calculateColumnTotals(col, metricType);
                        } else {
                          // Calculated totals
                          value = calculateDerivedTotals(col, metricType);
                        }
                        
                        return (
                          <td key={`total-${metricType}-${colIndex}`} 
                              className="metric-cell total-metric-cell" 
                              style={{ 
                                backgroundColor: getCellBackgroundColor(col), 
                                textAlign: 'center',
                                fontWeight: 'bold'
                              }}>
                            {formatNumber(value, metricType)}
                          </td>
                        );
                      }
                    })}
                  </tr>
                ))}
              </React.Fragment>
              
              {/* Category Breakdown Rows - Dynamic based on Column C (Process) */}
              {visibleProcessCategories.map((categoryName, categoryIndex) => (
                <React.Fragment key={`category-${categoryName}`}>
                  <tr className="separator-row">
                    <td colSpan={extendedColumns.length + 1} className="separator-cell"></td>
                  </tr>
                  
                  {/* Category Header Row */}
                  <tr className="product-header-row category-header-row">
                    <td className="row-label product-header category-header">{categoryName}</td>
                    {extendedColumns.map((col, colIndex) => {
                      if (col.columnType === 'delta') {
                        // Calculate delta for category sales percentage between periods
                        const fromPercentage = calculateCategorySalesPercentage(categoryName, col.fromColumn);
                        const toPercentage = calculateCategorySalesPercentage(categoryName, col.toColumn);
                        const delta = toPercentage - fromPercentage;
                        const deltaFormatted = formatDelta(delta);
                        
                        return (
                          <td key={`${categoryName}-header-delta-${colIndex}`} 
                              className="product-header-cell category-header-cell" 
                              style={getDeltaCellStyle(deltaFormatted)}>
                            {deltaFormatted === '' ? '' : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '0 0 auto' }}>{deltaFormatted.arrow}</span>
                                <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '1', textAlign: 'center' }}>{deltaFormatted.percentage}</span>
                              </div>
                            )}
                          </td>
                        );
                      } else {
                        // Regular period column - show % of Sales for category
                        const categorySalesPercentage = calculateCategorySalesPercentage(categoryName, col);
                        return (
                          <td key={`${categoryName}-header-${colIndex}`} 
                              className="product-header-cell category-header-cell" 
                              style={{ 
                                backgroundColor: getCellBackgroundColor(col),
                                textAlign: 'center',
                                fontSize: '13px',
                                color: '#000',
                                fontWeight: 'bold'
                              }}>
                            {categorySalesPercentage.toFixed(2)}% of Sls
                          </td>
                        );
                      }
                    })}
                  </tr>
                  
                  {/* Category Metrics Rows */}
                  {metricsToShow.map((metricType, metricIndex) => (
                    <tr key={`${categoryName}-${metricType}`} className="metric-row category-metric-row">
                      <td className="row-label metric-label category-metric-label">{metricType}</td>
                      {extendedColumns.map((col, colIndex) => {
                        if (col.columnType === 'delta') {
                          // Delta column for categories
                          const delta = calculateCategoryDelta(metricType, categoryName, col.fromColumn, col.toColumn);
                          const deltaFormatted = formatDelta(delta);
                          return (
                            <td key={`${categoryName}-delta-${metricType}-${colIndex}`} 
                                className="metric-cell category-metric-cell delta-cell" 
                                style={getDeltaCellStyle(deltaFormatted)}>
                              {deltaFormatted === '' ? '' : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '0 0 auto' }}>{deltaFormatted.arrow}</span>
                                  <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '1', textAlign: 'center' }}>{deltaFormatted.percentage}</span>
                                </div>
                              )}
                            </td>
                          );
                        } else {
                          // Regular category column
                          // Calculate category values based on Process (Column C) and Material (Column B)
                          let value;
                          if (['KGS', 'Sales', 'MoRM'].includes(metricType)) {
                            // Raw category totals from sales data
                            value = calculateCategoryTotals(col, metricType, categoryName);
                          } else {
                            // Calculated category metrics
                            value = calculateDerivedCategoryTotals(col, metricType, categoryName);
                          }
                          
                          return (
                            <td key={`${categoryName}-${metricType}-${colIndex}`} 
                                className="metric-cell category-metric-cell" 
                                style={{ 
                                  backgroundColor: getCellBackgroundColor(col), 
                                  textAlign: 'center',
                                  fontWeight: 'bold',
                                  fontStyle: 'normal'
                                }}>
                              {formatNumber(value, metricType)}
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              
              {/* Material Category Breakdown Rows - Dynamic based on Column B (Material) */}
              {visibleMaterialCategories.map((materialName, materialIndex) => (
                <React.Fragment key={`material-${materialName}`}>
                  <tr className="separator-row">
                    <td colSpan={extendedColumns.length + 1} className="separator-cell"></td>
                  </tr>
                  
                  {/* Material Category Header Row */}
                  <tr className="product-header-row category-header-row">
                    <td className="row-label product-header category-header">{materialName}</td>
                    {extendedColumns.map((col, colIndex) => {
                      if (col.columnType === 'delta') {
                        // Calculate delta for material category sales percentage between periods
                        const fromPercentage = calculateCategorySalesPercentage(materialName, col.fromColumn, 'material');
                        const toPercentage = calculateCategorySalesPercentage(materialName, col.toColumn, 'material');
                        const delta = toPercentage - fromPercentage;
                        const deltaFormatted = formatDelta(delta);
                        
                        return (
                          <td key={`${materialName}-header-delta-${colIndex}`} 
                              className="product-header-cell category-header-cell" 
                              style={getDeltaCellStyle(deltaFormatted)}>
                            {deltaFormatted === '' ? '' : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '0 0 auto' }}>{deltaFormatted.arrow}</span>
                                <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '1', textAlign: 'center' }}>{deltaFormatted.percentage}</span>
                              </div>
                            )}
                          </td>
                        );
                      } else {
                        // Regular period column - show % of Sales for material category
                        const materialSalesPercentage = calculateCategorySalesPercentage(materialName, col, 'material');
                        return (
                          <td key={`${materialName}-header-${colIndex}`} 
                              className="product-header-cell category-header-cell" 
                              style={{ 
                                backgroundColor: getCellBackgroundColor(col),
                                textAlign: 'center',
                                fontSize: '13px',
                                color: '#000',
                                fontWeight: 'bold'
                              }}>
                            {materialSalesPercentage.toFixed(2)}% of Sls
                          </td>
                        );
                      }
                    })}
                  </tr>
                  
                  {/* Material Category Metrics Rows */}
                  {metricsToShow.map((metricType, metricIndex) => (
                    <tr key={`${materialName}-${metricType}`} className="metric-row category-metric-row">
                      <td className="row-label metric-label category-metric-label">{metricType}</td>
                      {extendedColumns.map((col, colIndex) => {
                        if (col.columnType === 'delta') {
                          // Delta column for material categories
                          const delta = calculateCategoryDelta(metricType, materialName, col.fromColumn, col.toColumn, 'material');
                          const deltaFormatted = formatDelta(delta);
                          return (
                            <td key={`${materialName}-delta-${metricType}-${colIndex}`} 
                                className="metric-cell category-metric-cell delta-cell" 
                                style={getDeltaCellStyle(deltaFormatted)}>
                              {deltaFormatted === '' ? '' : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '0 0 auto' }}>{deltaFormatted.arrow}</span>
                                  <span style={{ fontSize: '12px', color: deltaFormatted.color, flex: '1', textAlign: 'center' }}>{deltaFormatted.percentage}</span>
                                </div>
                              )}
                            </td>
                          );
                        } else {
                          // Regular material category column
                          // Calculate material category values based on Column B (Material)
                          let value;
                          if (['KGS', 'Sales', 'MoRM'].includes(metricType)) {
                            // Raw material category totals from sales data
                            value = calculateCategoryTotals(col, metricType, materialName, 'material');
                          } else {
                            // Calculated material category metrics
                            value = calculateDerivedCategoryTotals(col, metricType, materialName, 'material');
                          }
                          
                          return (
                            <td key={`${materialName}-${metricType}-${colIndex}`} 
                                className="metric-cell category-metric-cell" 
                                style={{ 
                                  backgroundColor: getCellBackgroundColor(col), 
                                  textAlign: 'center',
                                  fontWeight: 'bold',
                                  fontStyle: 'normal'
                                }}>
                              {formatNumber(value, metricType)}
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default ProductGroupTable; 
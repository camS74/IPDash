import React, { useRef } from 'react';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useFilter } from '../../contexts/FilterContext';
import './TableView.css';

const ProductGroupTable = () => {
  const { salesData, selectedDivision, getProductGroups } = useSalesData();
  const { columnOrder, dataGenerated } = useFilter();
  const tableRef = useRef(null);

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

  // Get the Sales data based on selectedDivision
  const divisionData = salesData[selectedDivision] || [];
  const productGroups = getProductGroups();

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
    const divisionData = salesData[selectedDivision] || [];
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
    if (value === 0 || isNaN(value)) return 'N/A';
    
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
  const calculateCategoryTotals = (column, metricType, categoryName) => {
    const divisionData = salesData[selectedDivision] || [];
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
          
          // Check if this row matches the category criteria
          let matchesCategory = false;
          
          if (categoryName === 'UnPrinted') {
            matchesCategory = process && process.toString().toLowerCase().includes('unprinted');
          } else if (categoryName === 'Printed') {
            // Match "printed" but exclude "unprinted" to avoid double counting
            const processLower = process ? process.toString().toLowerCase() : '';
            matchesCategory = processLower.includes('printed') && !processLower.includes('unprinted');
          } else if (categoryName === 'Non-PE') {
            // Direct match: Column B should contain "Non-PE" exactly, exclude N/A
            const materialLower = material ? material.toString().toLowerCase().trim() : '';
            matchesCategory = materialLower === 'non-pe';
          } else if (categoryName === 'PE') {
            // Direct match: Column B should contain "PE" exactly, exclude N/A
            const materialLower = material ? material.toString().toLowerCase().trim() : '';
            matchesCategory = materialLower === 'pe';
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
  const calculateDerivedCategoryTotals = (column, metricType, categoryName) => {
    const categoryKgs = calculateCategoryTotals(column, 'KGS', categoryName);
    const categorySales = calculateCategoryTotals(column, 'Sales', categoryName);
    const categoryMorm = calculateCategoryTotals(column, 'MoRM', categoryName);

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
  const calculateCategoryDelta = (metricType, categoryName, fromColumn, toColumn) => {
    let fromValue, toValue;
    
    if (['KGS', 'Sales', 'MoRM'].includes(metricType)) {
      fromValue = calculateCategoryTotals(fromColumn, metricType, categoryName);
      toValue = calculateCategoryTotals(toColumn, metricType, categoryName);
    } else {
      fromValue = calculateDerivedCategoryTotals(fromColumn, metricType, categoryName);
      toValue = calculateDerivedCategoryTotals(toColumn, metricType, categoryName);
    }
    
    if (fromValue === 0 || isNaN(fromValue) || isNaN(toValue)) {
      return 0;
    }
    
    return ((toValue - fromValue) / fromValue) * 100;
  };

  // Helper function to format delta values with arrows
  const formatDelta = (delta) => {
    if (isNaN(delta) || delta === 0) return 'N/A';
    
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
      color: deltaFormatted === 'N/A' ? '#000000' : deltaFormatted.color,
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
  const calculateCategorySalesPercentage = (categoryName, column) => {
    // Get sales for this category
    const categorySales = calculateCategoryTotals(column, 'Sales', categoryName);
    
    // Get total sales across all product groups
    const totalSales = calculateColumnTotals(column, 'Sales');
    
    // Calculate percentage
    if (totalSales > 0) {
      return (categorySales / totalSales) * 100;
    }
    return 0;
  };



  return (
    <div className="table-view">
      <div className="table-centered-block">
        <div className="table-container" ref={tableRef}>
          <div className="table-header">
            <div className="header-left"></div>
            <div className="header-center">
              <h3 className="table-title">Product Group - {selectedDivision.split('-')[0]}</h3>
              <div className="table-subtitle">(AED)</div>
            </div>
            <div className="header-right"></div>
          </div>
          <table className="financial-table product-group-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '20%' }}/>
            </colgroup>
            {extendedColumns.map((col, index) => (
              <colgroup key={`colgroup-${index}`}>
                <col style={{ width: col.columnType === 'delta' ? '5.15%' : `${74.85 / columnOrder.length}%` }}/>
              </colgroup>
            ))}
            <thead>
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
                          <div style={{ fontSize: '18px' }}>Δ</div>
                          <div style={{ fontSize: '14px' }}>%</div>
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
                {productGroups.map((productGroup, pgIndex) => (
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
                              {deltaFormatted === 'N/A' ? 'N/A' : (
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
                                {deltaFormatted === 'N/A' ? 'N/A' : (
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
                    {pgIndex < productGroups.length - 1 && (
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
                              {deltaFormatted === 'N/A' ? 'N/A' : (
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
                
                {/* Category Breakdown Rows */}
                {['UnPrinted', 'Printed', 'Non-PE', 'PE'].map((categoryName, categoryIndex) => (
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
                              {deltaFormatted === 'N/A' ? 'N/A' : (
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
                                {deltaFormatted === 'N/A' ? 'N/A' : (
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
              </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductGroupTable; 
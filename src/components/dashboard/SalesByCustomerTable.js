import React, { useRef } from 'react';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useFilter } from '../../contexts/FilterContext';
import './SalesByCountryTable.css'; // Reuse the same CSS

const SalesByCustomerTable = () => {
  const { salesData } = useSalesData();
  const { selectedDivision } = useExcelData(); 
  const { columnOrder, basePeriodIndex, dataGenerated } = useFilter();
  const tableRef = useRef(null);

  // Create extended columns with delta columns, filtering out Budget/Forecast
  const createExtendedColumns = () => {
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

  // Get unique customers from the data
  const getCustomers = () => {
    const divisionName = selectedDivision;
    const customersSheetName = `${divisionName}-Customers`;
    const customersData = salesData[customersSheetName] || [];
    
    if (!customersData.length) return [];

    const customers = [];
    for (let i = 3; i < customersData.length; i++) {
      const row = customersData[i];
      if (row && row[0] && !customers.includes(row[0])) {
        customers.push(row[0]);
      }
    }
    return customers;
  };

  // Helper function to get customer sales amount for a specific period
  const getCustomerSalesAmount = (customerName, column) => {
    const divisionName = selectedDivision;
    const customersSheetName = `${divisionName}-Customers`;
    const customersData = salesData[customersSheetName] || [];

    if (!customersData.length) return 0;

    // Find the row with this customer name
    const customerRow = customersData.find(row => 
      row && row[0] && row[0].toString().toLowerCase() === customerName.toLowerCase()
    );
    
    if (!customerRow) return 0;

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
    for (let colIndex = 1; colIndex < customersData[0]?.length || 0; colIndex++) {
      const yearValue = customersData[0] && customersData[0][colIndex];
      const monthValue = customersData[1] && customersData[1][colIndex];
      const typeValue = customersData[2] && customersData[2][colIndex];
      
      if (yearValue == column.year &&
          monthsToInclude.includes(monthValue) &&
          typeValue === column.type) {
        
        const value = customerRow[colIndex];
        
        if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
          sum += parseFloat(value);
          foundValues = true;
        }
      }
    }
    
    return foundValues ? sum : 0;
  };

  // Helper function to calculate total sales for a period
  const getTotalSalesForPeriod = (column) => {
    const customers = getCustomers();
    let total = 0;
    
    customers.forEach(customerName => {
      total += getCustomerSalesAmount(customerName, column);
    });
    
    return total;
  };

  // Helper function to get customer percentage for a specific period
  const getCustomerPercentage = (customerName, column) => {
    const customerSales = getCustomerSalesAmount(customerName, column);
    const totalSales = getTotalSalesForPeriod(column);
    
    if (totalSales === 0) return 0;
    return (customerSales / totalSales) * 100;
  };

  // Calculate delta percentage between two periods for a customer
  const calculateDelta = (customerName, fromColumn, toColumn) => {
    const fromSales = getCustomerSalesAmount(customerName, fromColumn);
    const toSales = getCustomerSalesAmount(customerName, toColumn);
    
    if (fromSales === 0 && toSales === 0) return 0;
    if (fromSales === 0) return toSales > 0 ? 100 : 0;
    
    return ((toSales - fromSales) / fromSales) * 100;
  };

  // Color scheme definitions
  const colorSchemes = [
    { name: 'blue', label: 'Blue', primary: '#288cfa', secondary: '#103766', light: '#E3F2FD', isDark: true },
    { name: 'green', label: 'Green', primary: '#2E865F', secondary: '#C6F4D6', light: '#E8F5E8', isDark: true },
    { name: 'yellow', label: 'Yellow', primary: '#FFD700', secondary: '#FFFDE7', light: '#FFFDE7', isDark: false },
    { name: 'orange', label: 'Orange', primary: '#FF6B35', secondary: '#FFE0B2', light: '#FFE0B2', isDark: false },
    { name: 'boldContrast', label: 'Bold Contrast', primary: '#003366', secondary: '#FF0000', light: '#CCE7FF', isDark: true }
  ];

  // Function to get column style based on the column configuration
  const getColumnHeaderStyle = (column) => {
    if (!column) {
      return { 
        backgroundColor: '#288cfa', 
        color: '#FFFFFF',
        fontWeight: 'bold'
      };
    }
    
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
    
    return { 
      backgroundColor: '#288cfa', 
      color: '#FFFFFF',
      fontWeight: 'bold'
    };
  };

  // Function to get cell background color based on column configuration
  const getCellBackgroundColor = (column) => {
    if (column.customColor) {
      const scheme = colorSchemes.find(s => s.name === column.customColor);
      if (scheme) {
        return scheme.light;
      }
    }
    
    if (column.month === 'Q1' || column.month === 'Q2' || column.month === 'Q3' || column.month === 'Q4') {
      return colorSchemes.find(s => s.name === 'orange').light;
    } else if (column.month === 'January') {
      return colorSchemes.find(s => s.name === 'yellow').light;
    } else if (column.month === 'Year') {
      return colorSchemes.find(s => s.name === 'blue').light;
    } else if (column.type === 'Budget') {
      return colorSchemes.find(s => s.name === 'green').light;
    }
    
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

  // Helper function to format delta for sales amounts (absolute difference, not percentage)
  const formatSalesDelta = (delta) => {
    if (delta === 0) {
      return { value: '0', color: '#333333' };
    }
    
    const sign = delta > 0 ? '+' : '';
    const formattedAmount = Math.abs(delta).toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
    
    return {
      value: `${sign}${formattedAmount}`,
      color: delta > 0 ? '#28a745' : '#dc3545'
    };
  };

  // Format delta value for percentages
  const formatDelta = (delta) => {
    if (delta === 0) return { value: '0.0%', color: '#666666' };
    const formatted = Math.abs(delta).toFixed(1) + '%';
    return {
      value: delta > 0 ? `+${formatted}` : `-${formatted}`,
      color: delta > 0 ? '#28a745' : '#dc3545'
    };
  };

  // Format delta value for counts
  const formatCountDelta = (delta) => {
    if (delta === 0) return { value: '0', color: '#666666' };
    const sign = delta > 0 ? '+' : '';
    return {
      value: `${sign}${delta}`,
      color: delta > 0 ? '#28a745' : '#dc3545'
    };
  };

  // Helper function to convert text to proper case (title case)
  const toProperCase = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Only show data if Generate button has been clicked
  if (!dataGenerated) {
    return (
      <div className="table-view">
        <h3>Sales by Customer Table</h3>
        <div className="table-empty-state">
          <p>Please select columns and click the Generate button to view sales by customer data.</p>
        </div>
      </div>
    );
  }

  const customers = getCustomers();

  if (!customers.length) {
    return (
      <div className="table-view">
        <h3>Sales by Customer Table</h3>
        <div className="table-empty-state">
          <p>No customer data available. Please ensure Sales data is loaded and {selectedDivision}-Customers sheet exists.</p>
        </div>
      </div>
    );
  }

  // Sort customers by base period sales amount (highest to lowest) and take top 20
  const sortedCustomers = [...customers].sort((a, b) => {
    const filteredColumns = columnOrder.filter(col => 
      col.type !== 'Budget' && col.type !== 'Forecast'
    );
    
    if (filteredColumns.length === 0) return 0;
    
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
    
    const salesA = getCustomerSalesAmount(a, baseColumn);
    const salesB = getCustomerSalesAmount(b, baseColumn);
    
    return salesB - salesA;
  });

  // Get top 20 customers and remaining customers for "Other Customers" row
  const top20Customers = sortedCustomers.slice(0, 20);
  const otherCustomers = sortedCustomers.slice(20); // All customers beyond top 20

  // Helper function to calculate "Other Customers" sales amount for a specific period
  const getOtherCustomersSalesAmount = (column) => {
    let total = 0;
    otherCustomers.forEach(customerName => {
      total += getCustomerSalesAmount(customerName, column);
    });
    return total;
  };

  // Helper function to calculate "Other Customers" delta
  const calculateOtherCustomersDelta = (fromColumn, toColumn) => {
    const fromSales = getOtherCustomersSalesAmount(fromColumn);
    const toSales = getOtherCustomersSalesAmount(toColumn);
    
    if (fromSales === 0 && toSales === 0) return 0;
    if (fromSales === 0) return toSales > 0 ? 100 : 0;
    
    return ((toSales - fromSales) / fromSales) * 100;
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

  // Helper function to calculate top 20 customers total sales for a specific period
  const getTop20CustomersSalesAmount = (column) => {
    let total = 0;
    top20Customers.forEach(customerName => {
      total += getCustomerSalesAmount(customerName, column);
    });
    return total;
  };

  // Helper function to calculate grand total sales for a specific period
  const getGrandTotalSalesAmount = (column) => {
    let total = 0;
    customers.forEach(customerName => {
      total += getCustomerSalesAmount(customerName, column);
    });
    return total;
  };

  // Helper function to count other customers with sales in a specific period
  const getOtherCustomersCount = (column) => {
    let count = 0;
    otherCustomers.forEach(customerName => {
      const salesAmount = getCustomerSalesAmount(customerName, column);
      if (salesAmount > 0) {
        count++;
      }
    });
    return count;
  };

  // Helper function to calculate delta for top 20 customers total
  const calculateTop20CustomersDelta = (fromColumn, toColumn) => {
    const fromAmount = getTop20CustomersSalesAmount(fromColumn);
    const toAmount = getTop20CustomersSalesAmount(toColumn);
    if (fromAmount === 0) return 0;
    return ((toAmount - fromAmount) / fromAmount) * 100;
  };

  // Helper function to calculate delta for top 20 percentage
  const calculateTop20PercentageDelta = (fromColumn, toColumn) => {
    const fromTop20 = getTop20CustomersSalesAmount(fromColumn);
    const fromTotal = getGrandTotalSalesAmount(fromColumn);
    const fromPercentage = fromTotal > 0 ? (fromTop20 / fromTotal) * 100 : 0;
    
    const toTop20 = getTop20CustomersSalesAmount(toColumn);
    const toTotal = getGrandTotalSalesAmount(toColumn);
    const toPercentage = toTotal > 0 ? (toTop20 / toTotal) * 100 : 0;
    
    return toPercentage - fromPercentage;
  };

  // Helper function to calculate delta for other customers count
  const calculateOtherCustomersCountDelta = (fromColumn, toColumn) => {
    const fromCount = getOtherCustomersCount(fromColumn);
    const toCount = getOtherCustomersCount(toColumn);
    if (fromCount === 0) return 0;
    return ((toCount - fromCount) / fromCount) * 100;
  };

  // Helper function to calculate delta for other customers percentage
  const calculateOtherCustomersPercentageDelta = (fromColumn, toColumn) => {
    const fromOther = getOtherCustomersSalesAmount(fromColumn);
    const fromTotal = getGrandTotalSalesAmount(fromColumn);
    const fromPercentage = fromTotal > 0 ? (fromOther / fromTotal) * 100 : 0;
    
    const toOther = getOtherCustomersSalesAmount(toColumn);
    const toTotal = getGrandTotalSalesAmount(toColumn);
    const toPercentage = toTotal > 0 ? (toOther / toTotal) * 100 : 0;
    
    return toPercentage - fromPercentage;
  };

  // Helper function to count all customers with sales in a specific period
  const getAllCustomersCount = (column) => {
    let count = 0;
    customers.forEach(customerName => {
      const salesAmount = getCustomerSalesAmount(customerName, column);
      if (salesAmount > 0) {
        count++;
      }
    });
    return count;
  };

  return (
    <div className="table-view">
      <div className="table-header">
        <div className="header-center">
          <h3 className="table-title">Top 20 Customers - {getDivisionDisplayName()}</h3>
          <div className="table-subtitle">(AED)</div>
        </div>
      </div>
      <div className="table-container" ref={tableRef}>
        <table className="financial-table sales-country-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          {/* Column Groups for width control */}
          <colgroup>
            <col style={{ width: '16.5%' }}/>
          </colgroup>
          {extendedColumns.map((col, index) => {
            const filteredDataColumns = extendedColumns.filter(c => c.columnType !== 'delta').length;
            return (
              <colgroup key={`colgroup-${index}`}>
                <col style={{ width: col.columnType === 'delta' ? `${5.15 * 0.54}%` : `${(78.5 / filteredDataColumns) * 0.33}%` }}/>
              </colgroup>
            );
          })}
          
          <thead>
            {/* Star Indicator Row */}
            <tr>
              <th className="empty-header"></th>
              {extendedColumns.map((col, index) => {
                if (col.columnType === 'delta') {
                  return <th key={`star-delta-${index}`} style={{ backgroundColor: '#ffffff', border: 'none', padding: '4px' }}></th>;
                }
                
                const filteredColumns = columnOrder.filter(col => 
                  col.type !== 'Budget' && col.type !== 'Forecast'
                );
                const dataColumnIndex = extendedColumns.slice(0, index + 1).filter(c => c.columnType !== 'delta').length - 1;
                
                let isBasePeriod = false;
                if (basePeriodIndex >= 0 && basePeriodIndex < columnOrder.length) {
                  const basePeriodColumn = columnOrder[basePeriodIndex];
                  const basePeriodFilteredIndex = filteredColumns.findIndex(col => 
                    col.year === basePeriodColumn.year && 
                    col.month === basePeriodColumn.month && 
                    col.type === basePeriodColumn.type
                  );
                  isBasePeriod = basePeriodFilteredIndex === dataColumnIndex;
                }
                
                return (
                  <th 
                    key={`star-${index}`} 
                    style={{ 
                      backgroundColor: '#ffffff', 
                      border: 'none', 
                      textAlign: 'center', 
                      padding: '4px',
                      fontSize: '32px',
                      color: '#FFD700'
                    }}
                  >
                    {isBasePeriod ? '★' : ''}
                  </th>
                );
              })}
            </tr>
            
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
                      padding: '8px 4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <span style={{ fontSize: '12px', width: '100%', textAlign: 'center' }}>Difference</span>
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
            {top20Customers.map((customerName, customerIndex) => (
              <tr key={customerIndex}>
                <td className="row-label" style={{ textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {toProperCase(customerName)}
                </td>
                {extendedColumns.map((col, colIndex) => {
                                  if (col.columnType === 'delta') {
                  const delta = calculateDelta(customerName, col.fromColumn, col.toColumn);
                  const deltaFormatted = formatDelta(delta);
                    return (
                      <td 
                        key={`delta-${customerIndex}-${colIndex}`}
                        style={getDeltaCellStyle(deltaFormatted)}
                      >
                        {deltaFormatted.value}
                      </td>
                    );
                  } else {
                    const salesAmount = getCustomerSalesAmount(customerName, col);
                    return (
                      <td 
                        key={`${customerIndex}-${colIndex}`}
                        style={{
                          backgroundColor: getCellBackgroundColor(col),
                          textAlign: 'center',
                          padding: '8px 4px'
                        }}
                      >
                        {salesAmount.toLocaleString('en-US', { 
                          minimumFractionDigits: 0, 
                          maximumFractionDigits: 0 
                        })}
                      </td>
                    );
                  }
                })}
              </tr>
            ))}
                        {/* Summary Section */}
            <tr>
              <td className="row-label" style={{ textAlign: 'left', fontWeight: 'bold', backgroundColor: '#4472C4', color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                Total Top 20 Customers
              </td>
              {extendedColumns.map((col, colIndex) => {
                                  if (col.columnType === 'delta') {
                    const delta = calculateTop20CustomersDelta(col.fromColumn, col.toColumn);
                    const deltaFormatted = formatDelta(delta);
                  return (
                    <td 
                      key={`delta-${colIndex}`}
                      style={{
                        ...getDeltaCellStyle(deltaFormatted),
                        backgroundColor: '#4472C4',
                        color: '#FFFFFF'
                      }}
                    >
                      {deltaFormatted.value}
                    </td>
                  );
                } else {
                  const salesAmount = getTop20CustomersSalesAmount(col);
                  return (
                    <td 
                      key={`${colIndex}`}
                      style={{
                        backgroundColor: '#4472C4',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        padding: '8px 4px',
                        fontWeight: 'bold'
                      }}
                    >
                      {salesAmount.toLocaleString('en-US', { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      })}
                    </td>
                  );
                }
              })}
            </tr>
            <tr>
              <td className="row-label" style={{ textAlign: 'left', fontWeight: 'bold', backgroundColor: '#4472C4', color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                % of Total Sales Top 20
              </td>
              {extendedColumns.map((col, colIndex) => {
                                  if (col.columnType === 'delta') {
                    const delta = calculateTop20PercentageDelta(col.fromColumn, col.toColumn);
                    const deltaFormatted = formatDelta(delta);
                  return (
                    <td 
                      key={`delta-${colIndex}`}
                      style={{
                        ...getDeltaCellStyle(deltaFormatted),
                        backgroundColor: '#4472C4',
                        color: '#FFFFFF'
                      }}
                    >
                      {deltaFormatted.value}%
                    </td>
                  );
                } else {
                  const top20Sales = getTop20CustomersSalesAmount(col);
                  const totalSales = getGrandTotalSalesAmount(col);
                  const percentage = totalSales > 0 ? (top20Sales / totalSales) * 100 : 0;
                  return (
                    <td 
                      key={`${colIndex}`}
                      style={{
                        backgroundColor: '#4472C4',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        padding: '8px 4px',
                        fontWeight: 'bold'
                      }}
                    >
                      {percentage.toFixed(1)}%
                    </td>
                  );
                }
              })}
            </tr>
            <tr>
              <td className="row-label" style={{ textAlign: 'left', fontWeight: 'bold', backgroundColor: '#003366', color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                Total Other Customers
              </td>
              {extendedColumns.map((col, colIndex) => {
                                  if (col.columnType === 'delta') {
                    const delta = calculateOtherCustomersDelta(col.fromColumn, col.toColumn);
                    const deltaFormatted = formatDelta(delta);
                  return (
                    <td 
                      key={`delta-${colIndex}`}
                      style={{
                        ...getDeltaCellStyle(deltaFormatted),
                        backgroundColor: '#003366',
                        color: '#FFFFFF'
                      }}
                    >
                      {deltaFormatted.value}
                    </td>
                  );
                } else {
                  const salesAmount = getOtherCustomersSalesAmount(col);
                  return (
                    <td 
                      key={`${colIndex}`}
                      style={{
                        backgroundColor: '#003366',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        padding: '8px 4px',
                        fontWeight: 'bold'
                      }}
                    >
                      {salesAmount.toLocaleString('en-US', { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      })}
                    </td>
                  );
                }
              })}
            </tr>
            <tr>
              <td className="row-label" style={{ textAlign: 'left', fontWeight: 'bold', backgroundColor: '#003366', color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                % of Total Sales Others
              </td>
              {extendedColumns.map((col, colIndex) => {
                                  if (col.columnType === 'delta') {
                    const delta = calculateOtherCustomersPercentageDelta(col.fromColumn, col.toColumn);
                    const deltaFormatted = formatDelta(delta);
                  return (
                    <td 
                      key={`delta-${colIndex}`}
                      style={{
                        ...getDeltaCellStyle(deltaFormatted),
                        backgroundColor: '#003366',
                        color: '#FFFFFF'
                      }}
                    >
                      {deltaFormatted.value}%
                    </td>
                  );
                } else {
                  const otherSales = getOtherCustomersSalesAmount(col);
                  const totalSales = getGrandTotalSalesAmount(col);
                  const percentage = totalSales > 0 ? (otherSales / totalSales) * 100 : 0;
                  return (
                    <td 
                      key={`${colIndex}`}
                      style={{
                        backgroundColor: '#003366',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        padding: '8px 4px',
                        fontWeight: 'bold'
                      }}
                    >
                      {percentage.toFixed(1)}%
                    </td>
                  );
                }
              })}
            </tr>
            <tr>
              <td className="row-label" style={{ textAlign: 'left', fontWeight: 'bold', backgroundColor: '#2196F3', color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                Number of All Customers
              </td>
              {extendedColumns.map((col, colIndex) => {
                if (col.columnType === 'delta') {
                  // Delta for all customers count (optional, can be left as 0 or blank)
                  return (
                    <td 
                      key={`delta-${colIndex}`}
                      style={{
                        ...getDeltaCellStyle({color: '#FFFFFF'}),
                        backgroundColor: '#2196F3',
                        color: '#FFFFFF'
                      }}
                    >
                      {/* No delta for all customers count */}
                    </td>
                  );
                } else {
                  // Show number of all customers with sales in this period
                  const customerCount = getAllCustomersCount(col);
                  return (
                    <td 
                      key={`${colIndex}`}
                      style={{
                        backgroundColor: '#2196F3',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        padding: '8px 4px',
                        fontWeight: 'bold'
                      }}
                    >
                      {customerCount}
                    </td>
                  );
                }
              })}
            </tr>
          </tbody>
        </table>
      </div>
      {/* Explanatory sentence below the table */}
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
        ★ = Sorting by Base Period highest to lowest | Δ% shows percentage change between consecutive periods
      </div>
    </div>
  );
};

export default SalesByCustomerTable; 
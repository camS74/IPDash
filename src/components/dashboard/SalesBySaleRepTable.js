import React, { useEffect, useState } from 'react';
import TabsComponent, { Tab } from './TabsComponent';
import { useFilter } from '../../contexts/FilterContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useSalesData } from '../../contexts/SalesDataContext';
import './SalesBySalesRepTable.css'; // Use dedicated CSS file



// Helper function to convert month names to numbers
const getMonthNumber = (monthName) => {
  const months = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
  };
  return months[monthName] || '01';
};

// Helper function to get months for a given period
const getMonthsForPeriod = (period) => {
  const monthMap = {
    'Q1': ['January', 'February', 'March'],
    'Q2': ['April', 'May', 'June'],
    'Q3': ['July', 'August', 'September'],
    'Q4': ['October', 'November', 'December'],
    'HY1': ['January', 'February', 'March', 'April', 'May', 'June'],
    'HY2': ['July', 'August', 'September', 'October', 'November', 'December'],
    'Year': ['January', 'February', 'March', 'April', 'May', 'June', 
             'July', 'August', 'September', 'October', 'November', 'December']
  };
  return monthMap[period] || [period];
};

// Helper function for delta calculation
const calculateDeltaDisplay = (newerValue, olderValue) => {
  if (!isNaN(newerValue) && !isNaN(olderValue)) {
    let deltaPercent;
    
    if (olderValue === 0) {
      deltaPercent = newerValue > 0 ? Infinity : newerValue < 0 ? -Infinity : 0;
    } else {
      deltaPercent = ((newerValue - olderValue) / Math.abs(olderValue)) * 100;
    }
    
    // Format based on value range
    let formattedDelta;
    if (deltaPercent === Infinity || deltaPercent === -Infinity) {
      formattedDelta = '∞';
    } else if (Math.abs(deltaPercent) > 99.99) {
      formattedDelta = Math.round(deltaPercent);
    } else {
      formattedDelta = deltaPercent.toFixed(1);
    }
    
    if (deltaPercent > 0) {
      return {
        arrow: '▲',
        value: deltaPercent === Infinity ? formattedDelta : `${formattedDelta}%`,
        color: '#288cfa'
      };
    } else if (deltaPercent < 0) {
      return {
        arrow: '▼',
        value: deltaPercent === -Infinity ? formattedDelta : `${Math.abs(formattedDelta)}%`,
        color: '#dc3545'
      };
    } else {
      return {
        arrow: '',
        value: '0.0%',
        color: 'black'
      };
    }
  }
  return '-';
};



// Helper function to prepare periods from column order
const preparePeriods = (columnOrder) => {
    const periods = [];
    
    columnOrder.forEach(col => {
      let monthsToInclude = [];
      
      if (col.months && Array.isArray(col.months)) {
        // Custom range - use all months in the range
        monthsToInclude = col.months;
      } else {
      // Handle quarters and standard periods using helper function
      monthsToInclude = getMonthsForPeriod(col.month);
      }
      
      // Add each month as a separate period for backend aggregation
      monthsToInclude.forEach(monthName => {
        periods.push({
          year: col.year,
          month: getMonthNumber(monthName),
          type: col.type || 'Actual',
          originalColumn: col // Keep reference to original column for grouping
        });
      });
    });
    
  return periods;
};

// Helper function to fetch dashboard data from API
const fetchDashboardData = async (salesRep, variable, periods) => {
    const response = await fetch('/api/fp/sales-rep-dashboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        salesRep,
        valueTypes: [variable], // Use original case to match database
        periods
      })
    });
    
    if (!response.ok) {
      console.error('Failed to fetch dashboard data:', response.status);
    throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const result = await response.json();
  return result.data;
};
    
// Helper function to build extended columns structure
const buildExtendedColumns = (columnOrder) => {
    const extendedColumns = [];
  
    columnOrder.forEach((col, index) => {
      extendedColumns.push({
        ...col,
        columnType: 'data',
        label: `${col.year}-${col.isCustomRange ? col.displayName : col.month}-${col.type}`
      });
      
      // Add delta column after each data column (except the last one)
      if (index < columnOrder.length - 1) {
        extendedColumns.push({
          columnType: 'delta',
          label: 'Delta'
        });
      }
    });
    
  return extendedColumns;
};

// Helper function to aggregate monthly data for a column
const aggregateColumnData = (pgName, variable, col, dashboardData) => {
          try {
            const year = col.year;
            const type = col.type || 'Actual';
            let aggregatedValue = 0;
            
            // Determine which months to aggregate based on column configuration
            let monthsToAggregate = [];
            
            if (col.months && Array.isArray(col.months)) {
              // Custom range - use all months in the range
              monthsToAggregate = col.months;
            } else {
      // Handle quarters and standard periods using helper function
      monthsToAggregate = getMonthsForPeriod(col.month);
            }
            
            // Sum values for all months in the period
            monthsToAggregate.forEach(monthName => {
              const month = getMonthNumber(monthName);
              const key = `${year}-${month}-${type}`;
              const monthValue = dashboardData[pgName]?.[variable]?.[key] || 0;
              
              if (typeof monthValue === 'number') {
                aggregatedValue += monthValue;
              }
            });
    
    return aggregatedValue;
  } catch (error) {
    // Error extracting sales data
    return 0;
  }
};

// Helper function to sort product groups with "Others" at the end
const sortProductGroups = (productGroups) => {
  return productGroups.sort((a, b) => {
    // If 'a' is "Others", it should come after 'b'
    if (a.toLowerCase() === 'others') return 1;
    // If 'b' is "Others", it should come after 'a'
    if (b.toLowerCase() === 'others') return -1;
    // For all other cases, maintain alphabetical order
    return a.localeCompare(b);
  });
};





// Helper function to process data for a single product group
const processProductGroupData = (pgName, variable, extendedColumns, dashboardData) => {
  const values = [];
  const dataValues = []; // Store only data values for delta calculation
  
  // First pass: process all data columns
  for (let idx = 0; idx < extendedColumns.length; idx++) {
    const col = extendedColumns[idx];
    
    if (col.columnType === 'data') {
      const aggregatedValue = aggregateColumnData(pgName, variable, col, dashboardData);
            
            // Format as comma-separated integer without decimals
            const formattedValue = Math.round(aggregatedValue).toLocaleString();
            dataValues.push(aggregatedValue); // Store raw value for delta calculation
            values.push(formattedValue);
        }
      }
      
      // Second pass: insert delta calculations
      const finalValues = [];
      let dataIndex = 0;
      
      for (let idx = 0; idx < extendedColumns.length; idx++) {
        const col = extendedColumns[idx];
        
        if (col.columnType === 'data') {
          finalValues.push(values[dataIndex]);
          dataIndex++;
        } else if (col.columnType === 'delta') {
          // Calculate delta between adjacent data columns
          // dataIndex points to the next data column (newer)
          // dataIndex-1 points to the previous data column (older)
          const newerDataIndex = dataIndex;
          const olderDataIndex = dataIndex - 1;
          
          if (olderDataIndex >= 0 && newerDataIndex < dataValues.length) {
            const newerValue = dataValues[newerDataIndex];
            const olderValue = dataValues[olderDataIndex];
            
        const deltaResult = calculateDeltaDisplay(newerValue, olderValue);
        finalValues.push(deltaResult);
          } else {
            finalValues.push('-');
          }
        }
      }
      
      return {
        name: pgName,
        values: finalValues,
        rawValues: dataValues // Store raw numeric values for total calculations
      };
};

// Main function to fetch actual product groups and sales data from fp_data for each sales rep
const getProductGroupsForSalesRep = async (salesRep, variable, columnOrder) => {
  try {
    // Safety check for columnOrder
    if (!columnOrder || columnOrder.length === 0) {
      return [];
    }
    
    // Step 1: Prepare periods from columnOrder
    const periods = preparePeriods(columnOrder);
    
    // Step 2: Fetch data from API
    const { productGroups, dashboardData } = await fetchDashboardData(salesRep, variable, periods);
    
    // Step 3: Sort product groups with "Others" at the end
    const sortedProductGroups = sortProductGroups(productGroups);
    
    // Step 4: Build extended columns structure
    const extendedColumns = buildExtendedColumns(columnOrder);
    
    // Step 5: Process data for each product group
    const processedResult = sortedProductGroups.map((pgName) => 
      processProductGroupData(pgName, variable, extendedColumns, dashboardData)
    );
    
    return processedResult;
    
  } catch (error) {
    // Error fetching product groups for sales rep
    // Return fallback structure
    return [{
      name: 'No Product Groups Found',
      values: columnOrder ? new Array(columnOrder.length * 2 - 1).fill('-') : []
    }];
  }
};

// Helper function to fetch customer dashboard data from API
const fetchCustomerDashboardData = async (salesRep, periods) => {
  const response = await fetch('/api/fp/customer-dashboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      salesRep,
      periods
    })
  });
  
  if (!response.ok) {
    console.error('Failed to fetch customer dashboard data:', response.status);
    throw new Error(`API request failed with status: ${response.status}`);
  }
  
  const result = await response.json();
  return result.data;
};

// Helper function to aggregate customer monthly data for a column
const aggregateCustomerColumnData = (customerName, col, dashboardData) => {
  try {
    const year = col.year;
    const type = col.type || 'Actual';
    let aggregatedValue = 0;
    
    // Determine which months to aggregate based on column configuration
    let monthsToAggregate = [];
    
    if (col.months && Array.isArray(col.months)) {
      // Custom range - use all months in the range
      monthsToAggregate = col.months;
    } else {
      // Handle quarters and standard periods using helper function
      monthsToAggregate = getMonthsForPeriod(col.month);
    }
    
    // Sum values for all months in the period
    monthsToAggregate.forEach(monthName => {
      const month = getMonthNumber(monthName);
      const key = `${year}-${month}-${type}`;
      const monthValue = dashboardData[customerName]?.[key] || 0;
      
      if (typeof monthValue === 'number') {
        aggregatedValue += monthValue;
      }
    });
    
    return aggregatedValue;
  } catch (error) {
    // Error extracting sales data
    return 0;
  }
};

// Helper function to process data for a single customer
const processCustomerData = (customerName, extendedColumns, dashboardData) => {
  const values = [];
  const dataValues = []; // Store only data values for delta calculation
  
  // First pass: process all data columns
  for (let idx = 0; idx < extendedColumns.length; idx++) {
    const col = extendedColumns[idx];
    
    if (col.columnType === 'data') {
      const value = aggregateCustomerColumnData(customerName, col, dashboardData);
      dataValues.push(value); // Store raw value for delta calculation
      values.push(value);
    }
  }
  
  // Second pass: insert delta calculations
  const finalValues = [];
  let dataIndex = 0;
  
  for (let idx = 0; idx < extendedColumns.length; idx++) {
    const col = extendedColumns[idx];
    
    if (col.columnType === 'data') {
      finalValues.push(values[dataIndex]);
      dataIndex++;
    } else if (col.columnType === 'delta') {
      // Calculate delta between adjacent data columns
      const newerDataIndex = dataIndex;
      const olderDataIndex = dataIndex - 1;
      
      if (olderDataIndex >= 0 && newerDataIndex < dataValues.length) {
        const newerValue = dataValues[newerDataIndex];
        const olderValue = dataValues[olderDataIndex];
        
        const deltaResult = calculateDeltaDisplay(newerValue, olderValue);
        finalValues.push(deltaResult);
      } else {
        finalValues.push('-');
      }
    }
  }

  return {
    name: customerName,
    values: finalValues,
    rawValues: dataValues // Store raw numeric values for total calculations
  };
};

// Helper to normalize customer names for robust matching
const normalizeName = (name) =>
  name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

// Fetch confirmed merges from backend
const fetchConfirmedMerges = async () => {
  try {
    const response = await fetch('/api/confirmed-merges');
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  } catch {
    return [];
  }
};

// Main function to get customers for a sales rep with volume-based sorting
const getCustomersForSalesRep = async (salesRep, columnOrder, basePeriodIndex) => {
  try {
    // Step 1: Prepare periods from column order
    const periods = preparePeriods(columnOrder);
    
    // Step 2: Fetch data from API
    const { customers, dashboardData } = await fetchCustomerDashboardData(salesRep, periods);
    
    // Step 3: Build extended columns structure
    const extendedColumns = buildExtendedColumns(columnOrder);
    
    // Step 4: Fetch confirmed merges
    const confirmedMerges = await fetchConfirmedMerges();
    // Build a normalized map of all merged groups
    const groupMap = [];
    confirmedMerges.forEach((group, idx) => {
      groupMap[idx] = group.map(normalizeName);
    });
    // For each customer from SQL, assign to group if normalized name matches any in group
    const groupToCustomerNames = {};
    const ungrouped = [];
    customers.forEach(name => {
      const norm = normalizeName(name);
      let found = false;
      groupMap.forEach((normNames, idx) => {
        if (normNames.includes(norm)) {
          if (!groupToCustomerNames[idx]) groupToCustomerNames[idx] = [];
          groupToCustomerNames[idx].push(name);
          found = true;
        }
      });
      if (!found) {
        ungrouped.push(name);
      }
    });
    // Step 5: Build merged customer groups
    const groupResults = [];
    const processed = new Set();
    confirmedMerges.forEach((group, idx) => {
      const sqlNames = groupToCustomerNames[idx] || [];
      if (sqlNames.length === 0) return; // No matches in SQL
      let groupValues = null;
      let groupRawValues = null;
      sqlNames.forEach((customerName, i) => {
        const customerData = processCustomerData(customerName, extendedColumns, dashboardData);
        if (i === 0) {
          groupValues = [...customerData.values];
          groupRawValues = [...customerData.rawValues];
        } else {
          groupValues = groupValues.map((v, j) => (typeof v === 'number' && typeof customerData.values[j] === 'number') ? v + customerData.values[j] : v);
          groupRawValues = groupRawValues.map((v, j) => (typeof v === 'number' && typeof customerData.rawValues[j] === 'number') ? v + customerData.rawValues[j] : v);
        }
        processed.add(customerName);
      });
      if (groupValues) {
        groupResults.push({
          name: group[0], // Use first name in group as display name
          group: sqlNames,
          values: groupValues,
          rawValues: groupRawValues,
          isMergedGroup: true
        });
      }
    });
    // Step 6: Add ungrouped customers
    ungrouped.forEach(customerName => {
      const customerData = processCustomerData(customerName, extendedColumns, dashboardData);
      groupResults.push({
        name: customerName,
        values: customerData.values,
        rawValues: customerData.rawValues,
        isMergedGroup: false
      });
    });
    // Step 7: Sort by base period volume (highest to lowest)
    let baseDataColIdx = -1;
    if (basePeriodIndex != null && basePeriodIndex >= 0) {
      let dataColCount = 0;
      for (let i = 0; i < extendedColumns.length; i++) {
        if (extendedColumns[i].columnType === 'data') {
          if (dataColCount === basePeriodIndex) {
            baseDataColIdx = i;
            break;
          }
          dataColCount++;
        }
      }
    }
    if (baseDataColIdx !== -1) {
      groupResults.sort((a, b) => {
        const aValue = a.values[baseDataColIdx] || 0;
        const bValue = b.values[baseDataColIdx] || 0;
        return bValue - aValue; // Sort descending (highest first)
      });
    }
    return groupResults;
  } catch (error) {
    console.error('Error getting customers for sales rep:', error);
    throw error;
  }
};

// Add utility to store and retrieve confirmed merges (simulate backend with localStorage)
const CONFIRMED_MERGES_KEY = 'confirmedCustomerMerges';
function getConfirmedMerges() {
  try {
    const data = localStorage.getItem(CONFIRMED_MERGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
function addConfirmedMerge(group) {
  const confirmed = getConfirmedMerges();
  // Store as sorted array for consistency
  const sortedGroup = [...group].sort();
  if (!confirmed.some(g => JSON.stringify(g) === JSON.stringify(sortedGroup))) {
    confirmed.push(sortedGroup);
    localStorage.setItem(CONFIRMED_MERGES_KEY, JSON.stringify(confirmed));
  }
}

const SalesBySaleRepTable = () => {
  const { columnOrder, dataGenerated } = useFilter();
  const { salesData, loading, error, selectedDivision } = useExcelData();
  const { defaultReps, salesRepGroups, loadSalesRepConfig, salesRepConfigLoaded } = useSalesData();

  // Ensure sales rep config is loaded
  useEffect(() => {
    if (!salesRepConfigLoaded) {
      loadSalesRepConfig();
    }
  }, [salesRepConfigLoaded, loadSalesRepConfig]);

  const toProperCase = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Check if FP division is selected - fp_data table only contains FP division data
  const isFPDivision = selectedDivision && selectedDivision.startsWith('FP');
  if (!isFPDivision) {
    return (
      <div className="sales-rep-table-container">
        <div className="table-empty-state">
          <h3>Sales by Sales Rep - FP Division Only</h3>
          <p>This component displays data from the fp_data database table, which contains only FP (Flexible Packaging) division data.</p>
          <p>Currently selected division: <strong>{selectedDivision}</strong></p>
          <p>Please select <strong>FP</strong> division to view sales representative data.</p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="sales-rep-table-container">
      <div className="table-empty-state">Loading sales rep data...</div>
    </div>
  );
  
  if (error) return (
    <div className="sales-rep-table-container">
      <div className="table-empty-state" style={{ color: '#d84315' }}>{error}</div>
    </div>
  );
  
  if (!defaultReps || defaultReps.length === 0) return (
    <div className="sales-rep-table-container">
      <div className="table-empty-state">No sales reps configured. Please select sales reps in Master Data tab.</div>
    </div>
  );

  if (!dataGenerated) {
    return (
      <div className="sales-rep-table-container">
        <h3 className="table-title">Sales Rep Product Group Table</h3>
        <div className="table-empty-state">
          <p>Please select columns and click the Generate button to view sales rep product group data.</p>
        </div>
      </div>
    );
  }

  // Filter out sales reps that are already part of a group
  const getFilteredReps = () => {
    // If no groups exist, just return all default reps
    if (!salesRepGroups || Object.keys(salesRepGroups).length === 0) {
      return defaultReps || [];
    }

    // Create a set of all sales reps that are members of any group
    const groupMembers = new Set();
    Object.values(salesRepGroups).forEach(members => {
      members.forEach(member => groupMembers.add(member));
    });

    // Get all group names
    const groupNames = Object.keys(salesRepGroups);

    // Return only reps that are not members of any group
    const filteredReps = defaultReps.filter(rep => !groupMembers.has(rep));
    
    // Add all group names to the filtered list
    return [...filteredReps, ...groupNames];
  };

  return (
    <div className="sales-rep-table-container">
      <TabsComponent>
        {getFilteredReps().map(rep => {
          return (
            <Tab key={rep} label={toProperCase(rep)}>
              <SalesRepTabContent rep={rep} />
            </Tab>
          );
        })}
      </TabsComponent>
    </div>
  );
};

// Component to display static product group structure for each tab
const SalesRepTabContent = ({ rep }) => {
  const { columnOrder, basePeriodIndex } = useFilter();
  const [kgsData, setKgsData] = useState([]);
  const [amountData, setAmountData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!rep || !columnOrder || columnOrder.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch product groups for both KGS and Amount, and customer data
        const [kgsResult, amountResult] = await Promise.all([
          getProductGroupsForSalesRep(rep, 'KGS', columnOrder),
          getProductGroupsForSalesRep(rep, 'Amount', columnOrder)
        ]);

        // For customers, use individual customers (no fuzzy grouping here)
        const { customers, dashboardData } = await fetchCustomerDashboardData(rep, preparePeriods(columnOrder));
        const extendedColumns = buildExtendedColumns(columnOrder);
        
        // Process individual customers
        const processedResult = customers.map(customerName => 
          processCustomerData(customerName, extendedColumns, dashboardData)
        );

        // Sort customers by base period volume (highest to lowest)
        if (basePeriodIndex != null && basePeriodIndex >= 0) {
          processedResult.sort((a, b) => {
            const aValue = a.rawValues[basePeriodIndex] || 0;
            const bValue = b.rawValues[basePeriodIndex] || 0;
            return bValue - aValue; // Sort descending (highest first)
          });
        }

        setKgsData(kgsResult);
        setAmountData(amountResult);
        setCustomerData(processedResult);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rep, columnOrder, basePeriodIndex]);
  
  // Build extended columns from columnOrder
  const extendedColumns = [];
  if (columnOrder && columnOrder.length > 0) {
    columnOrder.forEach((col, index) => {
    extendedColumns.push({
      ...col,
      columnType: 'data',
      label: `${col.year}-${col.isCustomRange ? col.displayName : col.month}-${col.type}`
    });
    
      // Add delta column after each data column (except the last one)
      if (index < columnOrder.length - 1) {
        extendedColumns.push({
          columnType: 'delta',
          label: 'Delta'
        });
      }
    });
  }
  
  // Helper functions for styling and formatting
  const getColumnHeaderStyle = (col) => {
    if (col.columnType === 'delta') {
      return { backgroundColor: '#f5f5f5', color: '#666' };
    }
    
    // Map color names to CSS custom properties (same as ColumnConfigGrid)
    if (col.customColor) {
      const primary = getComputedStyle(document.documentElement)
        .getPropertyValue(`--color-${col.customColor}-primary`).trim();
      const text = getComputedStyle(document.documentElement)
        .getPropertyValue(`--color-${col.customColor}-text`).trim();
      
      if (primary && text) {
        return { 
          backgroundColor: primary,
          color: text
        };
      }
    }
    
    // Default to blue if no custom color
    return {
      backgroundColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--color-blue-primary').trim(),
      color: getComputedStyle(document.documentElement)
        .getPropertyValue('--color-blue-text').trim()
    };
  };
  
  const getCellStyle = (isTotal, isDelta) => {
    if (isTotal) {
      return { fontWeight: 'bold', backgroundColor: '#f8f9fa' };
    }
    return {};
  };

  // Check if a column is the base period
  const isBasePeriodColumn = (colIndex) => {
    if (basePeriodIndex === null || basePeriodIndex === undefined) return false;
    
    // Count data columns up to this index
    const dataColumnsBeforeThis = extendedColumns.slice(0, colIndex).filter(col => col.columnType === 'data').length;
    return dataColumnsBeforeThis === basePeriodIndex;
  };

  // Calculate totals for a specific column across all product groups or customers
  const calculateColumnTotal = (data, columnIndex, extendedCols) => {
    // Map columnIndex to rawValues index (skip delta columns)
    const dataColumnIndex = extendedCols.slice(0, columnIndex).filter(col => col.columnType === 'data').length;
    
    const total = data.reduce((total, row) => {
      const arr = row.rawValues || row.values;
      if (!arr || dataColumnIndex >= arr.length) {
        return total;
      }
      const value = arr[dataColumnIndex];
      if (typeof value === 'number' && !isNaN(value)) {
        return total + value;
      }
      return total;
    }, 0);
    return total;
  };

  // Format number for display
  const formatValue = (value, variable) => {
    if (typeof value !== 'number') return value || '-';
    
    if (variable === 'Amount') {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
  };

  const formatTotalValue = (value, variable) => {
    if (variable === 'Amount') {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
  };

  // Calculate delta for total row
  const calculateTotalDelta = (data, fromIndex, toIndex, extendedCols) => {
    const fromTotal = calculateColumnTotal(data, fromIndex, extendedCols);
    const toTotal = calculateColumnTotal(data, toIndex, extendedCols);
    
    if (fromTotal === 0) return { arrow: '', value: '', color: 'black' };
    
    const delta = ((toTotal - fromTotal) / fromTotal) * 100;
    const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '';
    const color = delta > 0 ? '#288cfa' : delta < 0 ? '#dc3545' : 'black';
    
    // Format delta based on range: -99.99% to +99.9% should have decimals, outside should not
    const absDelta = Math.abs(delta);
    let formattedValue;
    
    if (absDelta >= 99.99) {
      // Outside range: no decimals
      formattedValue = Math.round(absDelta) + '%';
    } else {
      // Within range: with decimals
      formattedValue = absDelta.toFixed(1) + '%';
    }
    
    return { arrow, value: formattedValue, color };
  };
  

  
  const hiddenAmountColumnIndices = new Set(); // No columns hidden for now
  
  // Custom header rendering for tables
  const renderAmountHeaderWithBlanks = () => (
    <thead>
      {/* Star Indicator Row */}
      <tr>
        <th className="product-header" style={{ backgroundColor: '#ffffff', border: 'none', padding: '4px' }}></th>
        <th className="spacer-col" style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></th>
        {extendedColumns.map((col, idx) => {
          if (hiddenAmountColumnIndices.has(idx)) {
            return <th key={`star-blank-${idx}`} style={{ backgroundColor: '#ffffff', border: 'none', padding: '4px' }}></th>;
          }
          if (col.columnType === 'delta') {
            return <th key={`star-delta-${idx}`} style={{ backgroundColor: '#ffffff', border: 'none', padding: '4px' }}></th>;
          }
          return (
            <th 
              key={`star-${idx}`} 
              style={{ 
                backgroundColor: '#ffffff', 
                border: 'none', 
                textAlign: 'center', 
                padding: '4px',
                fontSize: '32px',
                color: '#FFD700'
              }}
            >
              {isBasePeriodColumn(idx) ? '★' : ''}
            </th>
          );
        })}
      </tr>
      <tr className="main-header-row">
        <th className="product-header" rowSpan={3}>Product Group</th>
        <th className="spacer-col" rowSpan={3} style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></th>
        {extendedColumns.map((col, idx) => {
          if (hiddenAmountColumnIndices.has(idx)) {
            return <th key={`blank-${idx}`} className="amount-table-blank-cell"></th>;
          }
          if (col.columnType === 'delta') {
            return <th key={`delta-${idx}`} rowSpan={3} style={getColumnHeaderStyle({ columnType: 'delta' })} className="delta-header">Difference</th>;
          }
          return <th key={`year-${idx}`} style={getColumnHeaderStyle(col)} className="period-header">{col.year}</th>;
        })}
      </tr>
      <tr className="main-header-row">
        {extendedColumns.map((col, idx) => {
          if (hiddenAmountColumnIndices.has(idx)) return <th key={`blank2-${idx}`} className="amount-table-blank-cell"></th>;
          if (col.columnType === 'delta') return null;
          return <th key={`month-${idx}`} style={getColumnHeaderStyle(col)} className="period-header">{col.isCustomRange ? col.displayName : col.month}</th>;
        })}
      </tr>
      <tr className="main-header-row">
        {extendedColumns.map((col, idx) => {
          if (hiddenAmountColumnIndices.has(idx)) return <th key={`blank3-${idx}`} className="amount-table-blank-cell"></th>;
          if (col.columnType === 'delta') return null;
          return <th key={`type-${idx}`} style={getColumnHeaderStyle(col)} className="period-header">{col.type}</th>;
        })}
      </tr>
    </thead>
  );
  
  // Check loading state
  if (loading) {
    return (
      <div className="sales-rep-content">
        <div className="sales-rep-title">{rep}</div>
        <div className="table-empty-state">Loading data...</div>
      </div>
    );
  }

  // Check error state
  if (error) {
    return (
      <div className="sales-rep-content">
        <div className="sales-rep-title">{rep}</div>
        <div className="table-empty-state" style={{ color: '#d84315' }}>{error}</div>
      </div>
    );
  }

  // Check if columnOrder is available
  if (!columnOrder || columnOrder.length === 0) {
    return (
      <div className="sales-rep-content">
        <div className="sales-rep-title">{rep}</div>
        <div className="table-empty-state">Please select columns to view data.</div>
      </div>
    );
  }
  
  return (
    <div className="sales-rep-content">
      <div className="sales-rep-title">{rep}</div>
      <div className="sales-rep-subtitle">Sales Kgs Comparison</div>
      <table className="financial-table">
        {renderAmountHeaderWithBlanks()}
        <tbody>
          {kgsData.map(pg => (
            <tr key={pg.name} className="product-header-row">
              <td className="row-label product-header">{pg.name}</td>
              <td className="spacer-col" style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></td>
              {extendedColumns.map((col, idx) => {
                if (hiddenAmountColumnIndices.has(idx)) return <td key={`blank-${idx}`} className="amount-table-blank-cell"></td>;
                const val = pg.values[idx];
                if (col.columnType === 'delta') {
                  if (typeof val === 'object' && val !== null) {
                    // New object format with color and arrow
                    return (
                      <td key={idx} className="metric-cell delta-cell" style={{ color: val.color }}>
                        <span className="delta-arrow">{val.arrow}</span>
                        <span className="delta-value">{val.value}</span>
                      </td>
                    );
                  } else if (typeof val === 'string') {
                    // Legacy string format
                    let deltaClass = '';
                    if (val.includes('▲')) deltaClass = 'delta-up';
                    else if (val.includes('▼')) deltaClass = 'delta-down';
                    return <td key={idx} className={`metric-cell ${deltaClass}`}>{val}</td>;
                  }
                  return <td key={idx} className="metric-cell">{val || '-'}</td>;
                }
                return <td key={idx} className="metric-cell">{formatValue(val, 'KGS')}</td>;
              })}
            </tr>
          ))}
          {/* Total Row for KGS */}
          <tr className="total-row">
            <td className="total-label">Total</td>
            <td className="spacer-col" style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></td>
            {extendedColumns.map((col, idx) => {
              if (hiddenAmountColumnIndices.has(idx)) return <td key={`total-blank-${idx}`} className="amount-table-blank-cell"></td>;
              if (col.columnType === 'delta') {
                // Find the corresponding data columns for delta calculation
                const dataColumns = extendedColumns.filter(c => c.columnType === 'data');
                const deltaIndex = extendedColumns.slice(0, idx).filter(c => c.columnType === 'delta').length;
                if (deltaIndex < dataColumns.length - 1) {
                  const fromIndex = extendedColumns.findIndex(c => c === dataColumns[deltaIndex]);
                  const toIndex = extendedColumns.findIndex(c => c === dataColumns[deltaIndex + 1]);
                  const delta = calculateTotalDelta(kgsData, fromIndex, toIndex, extendedColumns);
                  return (
                    <td key={`total-delta-${idx}`} className="metric-cell delta-cell" style={{ color: delta.color }}>
                      <span className="delta-arrow">{delta.arrow}</span>
                      <span className="delta-value">{delta.value}</span>
                    </td>
                  );
                }
                return <td key={`total-delta-${idx}`} className="metric-cell">-</td>;
              }
              const totalValue = calculateColumnTotal(kgsData, idx, extendedColumns);
              return <td key={`total-${idx}`} className="metric-cell">{formatTotalValue(totalValue, 'KGS')}</td>;
            })}
          </tr>
        </tbody>
      </table>
      <div className="table-separator" />
      <div className="sales-rep-subtitle">Sales Amount Comparison</div>
      <table className="financial-table">
        {renderAmountHeaderWithBlanks()}
        <tbody>
          {amountData.map(pg => (
            <tr key={pg.name} className="product-header-row">
              <td className="row-label product-header">{pg.name}</td>
              <td className="spacer-col" style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></td>
              {extendedColumns.map((col, idx) => {
                if (hiddenAmountColumnIndices.has(idx)) return <td key={`blank-${idx}`} className="amount-table-blank-cell"></td>;
                const val = pg.values[idx];
                if (col.columnType === 'delta') {
                  if (typeof val === 'object' && val !== null) {
                    // New object format with color and arrow
                    return (
                      <td key={idx} className="metric-cell delta-cell" style={{ color: val.color }}>
                        <span className="delta-arrow">{val.arrow}</span>
                        <span className="delta-value">{val.value}</span>
                      </td>
                    );
                  } else if (typeof val === 'string') {
                    // Legacy string format
                    let deltaClass = '';
                    if (val.includes('▲')) deltaClass = 'delta-up';
                    else if (val.includes('▼')) deltaClass = 'delta-down';
                    return <td key={idx} className={`metric-cell ${deltaClass}`}>{val}</td>;
                  }
                  return <td key={idx} className="metric-cell">{val || '-'}</td>;
                }
                return <td key={idx} className="metric-cell">{formatValue(val, 'Amount')}</td>;
              })}
            </tr>
          ))}
          {/* Total Row for Amount */}
          <tr className="total-row">
            <td className="total-label">Total</td>
            <td className="spacer-col" style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></td>
            {extendedColumns.map((col, idx) => {
              if (hiddenAmountColumnIndices.has(idx)) return <td key={`total-blank-${idx}`} className="amount-table-blank-cell"></td>;
              if (col.columnType === 'delta') {
                // Find the corresponding data columns for delta calculation
                const dataColumns = extendedColumns.filter(c => c.columnType === 'data');
                const deltaIndex = extendedColumns.slice(0, idx).filter(c => c.columnType === 'delta').length;
                if (deltaIndex < dataColumns.length - 1) {
                  const fromIndex = extendedColumns.findIndex(c => c === dataColumns[deltaIndex]);
                  const toIndex = extendedColumns.findIndex(c => c === dataColumns[deltaIndex + 1]);
                  const delta = calculateTotalDelta(amountData, fromIndex, toIndex, extendedColumns);
                  return (
                    <td key={`total-delta-${idx}`} className="metric-cell delta-cell" style={{ color: delta.color }}>
                      <span className="delta-arrow">{delta.arrow}</span>
                      <span className="delta-value">{delta.value}</span>
                    </td>
                  );
                }
                return <td key={`total-delta-${idx}`} className="metric-cell">-</td>;
              }
              const totalValue = calculateColumnTotal(amountData, idx, extendedColumns);
              return <td key={`total-${idx}`} className="metric-cell">{formatTotalValue(totalValue, 'Amount')}</td>;
            })}
          </tr>
        </tbody>
      </table>
      <div className="table-separator" />
      <div className="sales-rep-subtitle">Sales by Customer (KGS)</div>
      <table className="financial-table">
        <thead>
          {/* Star Indicator Row */}
          <tr>
            <th className="product-header" style={{ backgroundColor: '#ffffff', border: 'none', padding: '4px' }}></th>
            <th className="spacer-col" style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></th>
            {extendedColumns.map((col, idx) => {
              if (hiddenAmountColumnIndices.has(idx)) {
                return <th key={`star-blank-${idx}`} style={{ backgroundColor: '#ffffff', border: 'none', padding: '4px' }}></th>;
              }
              if (col.columnType === 'delta') {
                return <th key={`star-delta-${idx}`} style={{ backgroundColor: '#ffffff', border: 'none', padding: '4px' }}></th>;
              }
              return (
                <th 
                  key={`star-${idx}`} 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    border: 'none', 
                    textAlign: 'center', 
                    padding: '4px',
                    fontSize: '32px',
                    color: '#FFD700'
                  }}
                >
                  {isBasePeriodColumn(idx) ? '★' : ''}
                </th>
              );
            })}
          </tr>
          <tr className="main-header-row">
            <th className="product-header" rowSpan={3}>Customer</th>
            <th className="spacer-col" rowSpan={3} style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></th>
            {extendedColumns.map((col, idx) => {
              if (hiddenAmountColumnIndices.has(idx)) {
                return <th key={`blank-${idx}`} className="amount-table-blank-cell"></th>;
              }
              if (col.columnType === 'delta') {
                return <th key={`delta-${idx}`} rowSpan={3} style={getColumnHeaderStyle({ columnType: 'delta' })} className="delta-header">Difference</th>;
              }
              return <th key={`year-${idx}`} style={getColumnHeaderStyle(col)} className="period-header">{col.year}</th>;
            })}
          </tr>
          <tr className="main-header-row">
            {extendedColumns.map((col, idx) => {
              if (hiddenAmountColumnIndices.has(idx)) return <th key={`blank2-${idx}`} className="amount-table-blank-cell"></th>;
              if (col.columnType === 'delta') return null;
              return <th key={`month-${idx}`} style={getColumnHeaderStyle(col)} className="period-header">{col.isCustomRange ? col.displayName : col.month}</th>;
            })}
          </tr>
          <tr className="main-header-row">
            {extendedColumns.map((col, idx) => {
              if (hiddenAmountColumnIndices.has(idx)) return <th key={`blank3-${idx}`} className="amount-table-blank-cell"></th>;
              if (col.columnType === 'delta') return null;
              return <th key={`type-${idx}`} style={getColumnHeaderStyle(col)} className="period-header">{col.type}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {customerData.map(customer => (
            <tr key={customer.name} className="product-header-row">
              <td className="row-label product-header">{customer.name}</td>
              <td className="spacer-col" style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></td>
              {extendedColumns.map((col, idx) => {
                if (hiddenAmountColumnIndices.has(idx)) return <td key={`blank-${idx}`} className="amount-table-blank-cell"></td>;
                const val = customer.values[idx];
                if (col.columnType === 'delta') {
                  if (typeof val === 'object' && val !== null) {
                    // New object format with color and arrow
                    return (
                      <td key={idx} className="metric-cell delta-cell" style={{ color: val.color }}>
                        <span className="delta-arrow">{val.arrow}</span>
                        <span className="delta-value">{val.value}</span>
                      </td>
                    );
                  } else if (typeof val === 'string') {
                    // Legacy string format
                    let deltaClass = '';
                    if (val.includes('▲')) deltaClass = 'delta-up';
                    else if (val.includes('▼')) deltaClass = 'delta-down';
                    return <td key={idx} className={`metric-cell ${deltaClass}`}>{val}</td>;
                  }
                  return <td key={idx} className="metric-cell">{val || '-'}</td>;
                }
                return <td key={idx} className="metric-cell">{formatValue(val, 'KGS')}</td>;
              })}
            </tr>
          ))}
          {/* Total Row for Customers */}
          <tr className="total-row">
            <td className="total-label">Total</td>
            <td className="spacer-col" style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></td>
            {extendedColumns.map((col, idx) => {
              if (hiddenAmountColumnIndices.has(idx)) return <td key={`total-blank-${idx}`} className="amount-table-blank-cell"></td>;
              if (col.columnType === 'delta') {
                // Find the corresponding data columns for delta calculation
                const dataColumns = extendedColumns.filter(c => c.columnType === 'data');
                const deltaIndex = extendedColumns.slice(0, idx).filter(c => c.columnType === 'delta').length;
                if (deltaIndex < dataColumns.length - 1) {
                  const fromIndex = extendedColumns.findIndex(c => c === dataColumns[deltaIndex]);
                  const toIndex = extendedColumns.findIndex(c => c === dataColumns[deltaIndex + 1]);
                  const delta = calculateTotalDelta(customerData, fromIndex, toIndex, extendedColumns);
                  return (
                    <td key={`total-delta-${idx}`} className="metric-cell delta-cell" style={{ color: delta.color }}>
                      <span className="delta-arrow">{delta.arrow}</span>
                      <span className="delta-value">{delta.value}</span>
                    </td>
                  );
                }
                return <td key={`total-delta-${idx}`} className="metric-cell">-</td>;
              }
              const totalValue = calculateColumnTotal(customerData, idx, extendedColumns);
              return <td key={`total-${idx}`} className="metric-cell">{formatTotalValue(totalValue, 'KGS')}</td>;
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SalesBySaleRepTable;
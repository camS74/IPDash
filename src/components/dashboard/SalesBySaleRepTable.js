import React, { useEffect, useState } from 'react';
import TabsComponent, { Tab } from './TabsComponent';
import { useFilter } from '../../contexts/FilterContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useSalesData } from '../../contexts/SalesDataContext';
import './SalesBySalesRepTable.css'; // Use dedicated CSS file

const variableOptions = [
  { value: 'Kgs', label: 'Kgs' },
  { value: 'Amount', label: 'Amount' }
];

const SalesBySaleRepTable = () => {
  const [defaultReps, setDefaultReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariable, setSelectedVariable] = useState('Kgs');
  const [salesRepGroups, setSalesRepGroups] = useState({});
  const { columnOrder, dataGenerated } = useFilter();
  const { selectedDivision } = useExcelData();
  const { salesData } = useSalesData();

  // Helper function to convert text to proper case
  const toProperCase = (text) => {
    if (!text) return '';
    return text.toString().replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  useEffect(() => {
    if (!selectedDivision) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/sales-reps-defaults?division=${selectedDivision}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const reps = Array.isArray(result.defaults) ? result.defaults : [];
          setDefaultReps(reps);
          // Store the groups data
          setSalesRepGroups(result.groups || {});
        } else {
          setError('Failed to load sales rep defaults');
        }
      })
      .catch(() => setError('Error loading sales rep data'))
      .finally(() => setLoading(false));
  }, [selectedDivision]);

  // Build extendedColumns (data+delta) as in ProductGroupTable
  const extendedColumns = [];
  columnOrder.forEach((column, index) => {
    extendedColumns.push({ ...column, columnType: 'data' });
    if (index < columnOrder.length - 1) {
      extendedColumns.push({
        columnType: 'delta',
        deltaIndex: index,
        fromColumn: columnOrder[index],
        toColumn: columnOrder[index + 1]
      });
    }
  });

  // Get unique product groups from S&V sheet for a sales rep or group
  const getUniqueProductGroups = (rep) => {
    // Check if this rep is actually a group
    const isGroup = salesRepGroups && Object.keys(salesRepGroups).includes(rep);
    const groupMembers = isGroup ? salesRepGroups[rep] : [];
    
    // Always use the S&V sheet for the division
    let sheetName = '';
    if (selectedDivision === 'FP') sheetName = 'FP-S&V';
    else if (selectedDivision === 'SB') sheetName = 'SB-S&V';
    else if (selectedDivision === 'TF') sheetName = 'TF-S&V';
    else if (selectedDivision === 'HCM') sheetName = 'HCM-S&V';
    else sheetName = selectedDivision + '-S&V';
    
    const sheetData = salesData[sheetName] || [];
    
    // Data starts from row 3 (skip 3 header rows), process all data rows
    const dataRows = sheetData.slice(3); // All data rows
    
    // Filter by sales rep (column A) and ledger type (column E based on selectedVariable)
    const filteredRows = dataRows.filter(row => {
      // Check sales rep match with case-insensitive comparison
      const rowRep = (row[0] || '').trim().toLowerCase();
      const repMatches = isGroup
        ? groupMembers.some(member => rowRep === (member || '').trim().toLowerCase())
        : rowRep === (rep || '').trim().toLowerCase();
      
      // Check ledger type match (column E, index 4) with case-insensitive comparison
      const ledgerMatches = (row[4] || '').toLowerCase() === selectedVariable.toLowerCase();
      
      return repMatches && ledgerMatches;
    });
    
    // Extract unique product groups from column D (index 3) for S&V sheet
    const productGroups = Array.from(new Set(
      filteredRows.map(row => row[3]) // Product Group in column D (index 3)
    )).filter(Boolean);
    
    return productGroups;
  };
  
  // Extract product group data for a given sales rep
  const getProductGroupDataForRep = (rep) => {
    // Check if this rep is actually a group
    const isGroup = salesRepGroups && Object.keys(salesRepGroups).includes(rep);
    const groupMembers = isGroup ? salesRepGroups[rep] : [];
    
    // Use the S&V sheet for the division
    let sheetName = '';
    if (selectedDivision === 'FP') sheetName = 'FP-S&V';
    else if (selectedDivision === 'SB') sheetName = 'SB-S&V';
    else if (selectedDivision === 'TF') sheetName = 'TF-S&V';
    else if (selectedDivision === 'HCM') sheetName = 'HCM-S&V';
    else sheetName = selectedDivision + '-S&V';
    const sheetData = salesData[sheetName] || [];
    
    // Data starts from row 3 (skip 3 header rows), process all data rows
    const dataRows = sheetData.slice(3); // All data rows
    
    // Filtered rows for this rep/group and ledger type
    const filteredRows = dataRows.filter(row => {
      const rowRep = (row[0] || '').trim().toLowerCase();
      const repMatches = isGroup
        ? groupMembers.some(member => rowRep === (member || '').trim().toLowerCase())
        : rowRep === (rep || '').trim().toLowerCase();
      const ledgerMatches = (row[4] || '').toLowerCase() === selectedVariable.toLowerCase();
      return repMatches && ledgerMatches;
    });
    // Get unique product groups for this rep or group
    const productGroups = Array.from(new Set(filteredRows.map(row => row[3]))).filter(Boolean);
    
    // For each product group, sum values for each period/column (pivot logic)
    // Sort product groups alphabetically, but always place 'Others' last
    const sortedProductGroups = productGroups
      .filter(g => g !== 'Others')
      .sort((a, b) => a.localeCompare(b));
    if (productGroups.includes('Others')) sortedProductGroups.push('Others');
    return sortedProductGroups
      .map(group => {
        // First, build the array of period values (data columns only)
        const periodValues = columnOrder.map(col => {
          const sum = sumForPeriod(dataRows, rep, group, selectedVariable, col, isGroup, groupMembers, sheetData);
          if (sum === 0) return '';
          return typeof sum === 'number' ? sum.toLocaleString('en-US', { maximumFractionDigits: 0 }) : sum;
        });
        // Now, build the full values array with deltas in between
        const values = [];
        for (let i = 0; i < periodValues.length; i++) {
          values.push(periodValues[i]);
          if (i < periodValues.length - 1) {
            // Calculate delta from periodValues[i] and periodValues[i+1]
            const left = parseFloat((periodValues[i] || '').toString().replace(/,/g, ''));
            const right = parseFloat((periodValues[i+1] || '').toString().replace(/,/g, ''));
            if (!isNaN(left) && !isNaN(right) && left !== 0) {
              const delta = ((right - left) / left) * 100;
              let deltaStr = '';
              if (Math.abs(delta) >= 100) {
                deltaStr = `${delta > 0 ? '▲' : delta < 0 ? '▼' : ''} ${Math.round(Math.abs(delta))}%`;
              } else {
                deltaStr = `${delta > 0 ? '▲' : delta < 0 ? '▼' : ''} ${Math.abs(delta).toFixed(1)}%`;
              }
              values.push(deltaStr);
            } else {
              values.push('-');
            }
          }
        }
        const hasNonzero = periodValues.some(v => v !== '' && v !== 0 && v !== '0');
        return hasNonzero ? { name: group, values } : null;
      })
      .filter(Boolean);
  };

  // Helper function to find column index for a period in S&V sheet
  const findColumnIndex = (sheetData, column) => {
    if (!sheetData || sheetData.length < 3) return -1;
    
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
    
    // Find matching column by checking header rows
    for (let c = 5; c < sheetData[0].length; c++) { // Start from column F (index 5)
      const cellYear = sheetData[0] && sheetData[0][c];
      const cellMonth = sheetData[1] && sheetData[1][c];
      const cellType = sheetData[2] && sheetData[2][c];
      
      if (
        cellYear == column.year &&
        monthsToInclude.includes(cellMonth) &&
        cellType === column.type
      ) {
        return c; // Return the first matching column index
      }
    }
    
    return -1; // No matching column found
  };

  // Helper to sum values for a period column config (pivot logic)
  const sumForPeriod = (dataRows, rep, group, variable, col, isGroup, groupMembers, sheetData) => {
    
    // Find the correct column index for the period dynamically
    const idx = findColumnIndex(sheetData, col);
    if (idx === -1) return 0; // Handle cases where column is not found
    
    // Sum all rows matching rep, group, variable using S&V sheet structure
    return dataRows.filter(row => {
      // For groups, check if the row's sales rep is in the group members with case-insensitive comparison
      const rowRep = (row[0] || '').trim().toLowerCase();
      const repMatches = isGroup
        ? groupMembers.some(member => rowRep === (member || '').trim().toLowerCase())
        : rowRep === (rep || '').trim().toLowerCase();
      // Use column D (index 3) for product group and column E (index 4) for ledger type with case-insensitive comparison
      return repMatches && row[3] === group && (row[4] || '').toLowerCase() === variable.toLowerCase();
    }).reduce((sum, row) => {
      const val = row[idx];
      if (val !== undefined && val !== null && !isNaN(parseFloat(val))) {
        return sum + parseFloat(val);
      }
      return sum;
    }, 0);
  };

  // Function to determine text color based on background brightness
  const getTextColor = (backgroundColor) => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance using perceived brightness formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  // Get column style based on the column configuration
  const getColumnHeaderStyle = (column) => {
    const baseStyle = {
      fontWeight: 'bold',
      textAlign: 'center'
    };

    // For delta columns, always return white background
    if (!column || column.columnType === 'delta') {
      return {
        ...baseStyle,
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderBottom: '1px solid #ddd'
      };
    }

    // Use the exact same color as defined in the column configuration
    const backgroundColor = column.customColor ? 
      getComputedStyle(document.documentElement)
        .getPropertyValue(`--color-${column.customColor}-primary`).trim() : 
      '#4a90e2';

    return {
      ...baseStyle,
      backgroundColor,
      color: getTextColor(backgroundColor)
    };
  };

  // Get cell style based on whether it's a delta column
  const getCellStyle = (isTotal, isDelta) => {
    if (isDelta) {
      return {
        backgroundColor: '#FFFFFF',
        color: '#000000'
      };
    }
    
    if (isTotal) {
      return {
        backgroundColor: '#4a90e2',
        color: '#FFFFFF' // Since #4a90e2 is dark enough for white text
      };
    }
    
    return {};
  };

  // Get cell background color based on column configuration
  const getCellBackgroundColor = (column) => {
    if (!column) return '#FFFFFF';
    
    if (column.customColor) {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(`--color-${column.customColor}-secondary`).trim();
    }
    
    return '#FFFFFF';
  };

  // Function to format delta value with proper arrow
  const formatDeltaValue = (delta) => {
    if (delta === undefined || delta === null || isNaN(delta)) {
      return '-';
    }
    
    const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '';
    const absValue = Math.abs(delta);
    
    // Format with appropriate decimal places
    const formattedValue = absValue >= 100 ? 
      Math.round(absValue) : 
      absValue.toFixed(1);
    
    return `${arrow} ${formattedValue}%`;
  };

  // Function to get delta class based on value
  const getDeltaClass = (value) => {
    if (typeof value !== 'string') return '';
    if (value.includes('▲')) return 'delta-up';
    if (value.includes('▼')) return 'delta-down';
    return '';
  };

  // Render table header rows with merged delta headers
  const renderTableHeader = () => (
    <thead>
      <tr className="main-header-row">
        <th className="product-header" rowSpan={3}>Product Group</th>
        <th className="spacer-col" rowSpan={3} style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></th>
        {extendedColumns.map((col, idx) => {
          if (col.columnType === 'delta') {
            // Merge 3 rows for delta columns
            return <th key={`delta-${idx}`} rowSpan={3} style={getColumnHeaderStyle({ columnType: 'delta' })} className="delta-header">Difference</th>;
          }
          return <th key={`year-${idx}`} style={getColumnHeaderStyle(col)} className="period-header">{col.year}</th>;
        })}
      </tr>
      <tr className="main-header-row">
        {extendedColumns.map((col, idx) => {
          if (col.columnType === 'delta') return null;
          return <th key={`month-${idx}`} style={getColumnHeaderStyle(col)} className="period-header">
            {col.isCustomRange ? col.displayName : col.month}
          </th>;
        })}
      </tr>
      <tr className="main-header-row">
        {extendedColumns.map((col, idx) => {
          if (col.columnType === 'delta') return null;
          return <th key={`type-${idx}`} style={getColumnHeaderStyle(col)} className="period-header">{col.type}</th>;
        })}
      </tr>
    </thead>
  );

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
  
  if (defaultReps.length === 0) return (
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
      return defaultReps;
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
      <div className="sales-rep-variable-selector">
        <label>Variable:</label>
        <select value={selectedVariable} onChange={e => setSelectedVariable(e.target.value)}>
          {variableOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <TabsComponent>
        {getFilteredReps().map(rep => {
          const productGroupData = getProductGroupDataForRep(rep);
          // Check if this rep is a group
          const isGroup = salesRepGroups && Object.keys(salesRepGroups).includes(rep);
          return (
          <Tab key={rep} label={toProperCase(rep)}>
            <div className="sales-rep-content">
              <div className="sales-rep-title">
                {toProperCase(rep)}
              </div>
              <div className="sales-rep-subtitle">Sales {selectedVariable} Comparison</div>
              <table className="financial-table">
                {renderTableHeader()}
                <tbody>
                    {productGroupData.map(pg => (
                      <tr key={pg.name} className="product-header-row">
                        <td className="row-label product-header">{pg.name}</td>
                        <td className="spacer-col" style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></td>
                        {pg.values.map((val, idx) => {
                          const col = extendedColumns[idx];
                          if (col.columnType === 'delta') {
                            let deltaClass = '';
                            if (typeof val === 'string') {
                              if (val.includes('▲')) deltaClass = 'delta-up';
                              else if (val.includes('▼')) deltaClass = 'delta-down';
                            }
                            return <td key={idx} className={`metric-cell ${deltaClass}`}>{val}</td>;
                          }
                          return <td key={idx} className="metric-cell">{val}</td>;
                        })}
                      </tr>
                    ))}
                    {/* Total row at the end */}
                    <tr className="total-row">
                      <td className="total-label">Total</td>
                      <td className="spacer-col" style={{ width: '10px', minWidth: '10px', maxWidth: '10px', background: 'transparent', border: 'none', padding: 0 }}></td>
                      {(() => {
                        // Build total values for each period
                        const totalPeriodValues = columnOrder.map((col, idx) => {
                          let total = 0;
                          productGroupData.forEach(pg => {
                            const val = pg.values[idx * 2]; // period columns are at even indices
                            if (typeof val === 'string') {
                              const num = parseFloat(val.replace(/,/g, ''));
                              if (!isNaN(num)) total += num;
                            } else if (typeof val === 'number') {
                              total += val;
                            }
                          });
                          return total !== 0 ? total : '';
                        });
                        // Now, build total row with deltas
                        const totalCells = [];
                        for (let i = 0; i < totalPeriodValues.length; i++) {
                          totalCells.push(
                            <td 
                              key={`total-${i}`} 
                              className="metric-cell"
                              style={getCellStyle(true, false)}
                            >
                              {totalPeriodValues[i] !== '' ? totalPeriodValues[i].toLocaleString('en-US', { maximumFractionDigits: 0 }) : ''}
                            </td>
                          );
                          if (i < totalPeriodValues.length - 1) {
                            const left = parseFloat(totalPeriodValues[i] || '0');
                            const right = parseFloat(totalPeriodValues[i+1] || '0');
                            let deltaCell = '-';
                            
                            if (!isNaN(left) && !isNaN(right) && left !== 0) {
                              const delta = ((right - left) / left) * 100;
                              deltaCell = formatDeltaValue(delta);
                            }
                            
                            const deltaClass = getDeltaClass(deltaCell);
                            totalCells.push(
                              <td 
                                key={`total-delta-${i}`} 
                                className={`metric-cell ${deltaClass}`}
                                style={getCellStyle(true, true)}
                              >
                                {deltaCell}
                              </td>
                            );
                          }
                        }
                        return totalCells;
                      })()}
                    </tr>
                </tbody>
              </table>
            </div>
          </Tab>
          );
        })}
      </TabsComponent>
    </div>
  );
};

export default SalesBySaleRepTable;
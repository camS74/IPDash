import React, { useEffect, useState } from 'react';
import TabsComponent, { Tab } from './TabsComponent';
import { useFilter } from '../../contexts/FilterContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useSalesData } from '../../contexts/SalesDataContext';
import './SalesBySalesRepTable.css'; // Use dedicated CSS file

// Color schemes and getColumnHeaderStyle copied from ProductGroupTable.js
const colorSchemes = [
  { name: 'blue', label: 'Blue', primary: '#288cfa', secondary: '#103766', light: '#E3F2FD', isDark: true },
  { name: 'green', label: 'Green', primary: '#2E865F', secondary: '#C6F4D6', light: '#E8F5E9', isDark: true },
  { name: 'yellow', label: 'Yellow', primary: '#FFD700', secondary: '#FFFDE7', light: '#FFFDE7', isDark: false },
  { name: 'orange', label: 'Orange', primary: '#FF6B35', secondary: '#FFE0B2', light: '#FFF3E0', isDark: false },
  { name: 'boldContrast', label: 'Bold Contrast', primary: '#003366', secondary: '#E6EEF5', light: '#E6EEF5', isDark: true }
];

const getColumnHeaderStyle = (column) => {
  if (!column) {
    return {
      backgroundColor: '#288cfa',
      color: '#FFFFFF',
      fontWeight: 'bold',
      textAlign: 'center'
    };
  }
  if (column.customColor) {
    const scheme = colorSchemes.find(s => s.name === column.customColor);
    if (scheme) {
      return {
        backgroundColor: scheme.primary,
        color: scheme.isDark ? '#FFFFFF' : '#000000',
        fontWeight: 'bold',
        textAlign: 'center'
      };
    }
  }
  if (column.month === 'Q1' || column.month === 'Q2' || column.month === 'Q3' || column.month === 'Q4') {
    return {
      backgroundColor: '#FF6B35',
      color: '#000000',
      fontWeight: 'bold',
      textAlign: 'center'
    };
  } else if (column.month === 'January') {
    return {
      backgroundColor: '#FFD700',
      color: '#000000',
      fontWeight: 'bold',
      textAlign: 'center'
    };
  } else if (column.month === 'Year') {
    return {
      backgroundColor: '#288cfa',
      color: '#FFFFFF',
      fontWeight: 'bold',
      textAlign: 'center'
    };
  } else if (column.type === 'Budget') {
    return {
      backgroundColor: '#2E865F',
      color: '#FFFFFF',
      fontWeight: 'bold',
      textAlign: 'center'
    };
  }
  return {
    backgroundColor: '#288cfa',
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center'
  };
};

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

  // Add getCellBackgroundColor function (copied from ProductGroupTable.js)
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

  // Render table header rows with merged delta headers
  const renderTableHeader = () => (
    <thead>
      <tr className="main-header-row">
        <th className="product-header" rowSpan={3}>Product Group</th>
        {extendedColumns.map((col, idx) => {
          if (col.columnType === 'delta') {
            // Merge 3 rows for delta columns
            return <th key={`delta-${idx}`} rowSpan={3}>Difference</th>;
          }
          return <th key={`year-${idx}`}>{col.year}</th>;
        })}
      </tr>
      <tr>
        {extendedColumns.map((col, idx) => {
          if (col.columnType === 'delta') return null;
          return <th key={`month-${idx}`}>{col.isCustomRange ? col.displayName : col.month}</th>;
        })}
      </tr>
      <tr>
        {extendedColumns.map((col, idx) => {
          if (col.columnType === 'delta') return null;
          return <th key={`type-${idx}`}>{col.type}</th>;
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
                      <td className="row-label total-label">Total</td>
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
                            <td key={`total-${i}`} className="metric-cell">{totalPeriodValues[i] !== '' ? totalPeriodValues[i].toLocaleString('en-US', { maximumFractionDigits: 0 }) : ''}</td>
                          );
                          if (i < totalPeriodValues.length - 1) {
                            const left = parseFloat(totalPeriodValues[i] || '');
                            const right = parseFloat(totalPeriodValues[i+1] || '');
                            let deltaCell = '-';
                            if (!isNaN(left) && !isNaN(right) && left !== 0) {
                              const delta = ((right - left) / left) * 100;
                              if (Math.abs(delta) >= 100) {
                                deltaCell = `${delta > 0 ? '▲' : delta < 0 ? '▼' : ''} ${Math.round(Math.abs(delta))}%`;
                              } else {
                                deltaCell = `${delta > 0 ? '▲' : delta < 0 ? '▼' : ''} ${Math.abs(delta).toFixed(1)}%`;
                              }
                            }
                            // Add color class for delta
                            let deltaClass = '';
                            if (typeof deltaCell === 'string') {
                              if (deltaCell.includes('▲')) deltaClass = 'delta-up';
                              else if (deltaCell.includes('▼')) deltaClass = 'delta-down';
                            }
                            totalCells.push(
                              <td key={`total-delta-${i}`} className={`metric-cell ${deltaClass}`}>{deltaCell}</td>
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
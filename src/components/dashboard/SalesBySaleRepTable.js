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

// Helper function to convert month names to numbers
const getMonthNumber = (monthName) => {
  const months = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
  };
  return months[monthName] || '01';
};

// Helper function to generate database column name
const getDatabaseColumnName = (col) => {
  const valueType = col.type.toLowerCase(); // 'actual' or 'budget'
  const year = col.year;
  
  if (col.isCustomRange) {
    // For custom ranges, use the first month or handle specially
    if (col.months && col.months.length > 0) {
      const monthNum = getMonthNumber(col.months[0]);
      return `${valueType}_${year}_${monthNum}`;
    }
    return `${valueType}_${year}_01`; // fallback
  } else if (col.months && col.months.length > 1) {
    // For quarters or multiple months, use the first month
    const monthNum = getMonthNumber(col.months[0]);
    return `${valueType}_${year}_${monthNum}`;
  } else {
    // Single month
    const monthNum = getMonthNumber(col.month);
    return `${valueType}_${year}_${monthNum}`;
  }
};

// Function to fetch actual product groups from fp_database for each sales rep
const getProductGroupsForSalesRep = async (salesRep, variable, columnOrder) => {
  try {
    // Safety check for columnOrder
    if (!columnOrder || columnOrder.length === 0) {
      return [];
    }
    
    // Fetch product groups for this sales rep from fp_database
    const response = await fetch(`/api/fp/product-groups?salesRep=${encodeURIComponent(salesRep)}`);
    let productGroups = [];
    
    if (response.ok) {
      const data = await response.json();
      productGroups = data.data.map(item => item.pgcombine || item.product_group || item);
    } else {
      // Fallback to default product groups if API fails
      productGroups = ['Product Group A', 'Product Group B', 'Product Group C'];
    }
    
    // Build extended columns from columnOrder
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
    
    // Create empty structure for each actual product group
    const result = productGroups.map(pgName => {
      const values = [];
      
      extendedColumns.forEach((col, idx) => {
        if (col.columnType === 'delta') {
          values.push('-');
        } else {
          // Empty data cells - no actual data, just structure
          values.push('-');
        }
      });
      
      return {
        name: pgName,
        values: values
      };
    });
    
    return result;
    
  } catch (error) {
    console.error('Error fetching product groups for sales rep:', error);
    // Return fallback structure
    return [{
      name: 'No Product Groups Found',
      values: columnOrder ? new Array(columnOrder.length * 2 - 1).fill('-') : []
    }];
  }
};

const SalesBySaleRepTable = () => {
  const { columnOrder, dataGenerated } = useFilter();
  const { salesData, loading, error } = useExcelData();
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
  const { columnOrder } = useFilter();
  const [kgsData, setKgsData] = useState([]);
  const [amountData, setAmountData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductGroups = async () => {
      if (!rep || !columnOrder || columnOrder.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch product groups for both Kgs and Amount (same structure, empty data)
        const [kgsResult, amountResult] = await Promise.all([
          getProductGroupsForSalesRep(rep, 'Kgs', columnOrder),
          getProductGroupsForSalesRep(rep, 'Amount', columnOrder)
        ]);
        
        setKgsData(kgsResult);
        setAmountData(amountResult);
      } catch (err) {
        console.error('Error loading product groups:', err);
        setError('Failed to load product groups');
      } finally {
        setLoading(false);
      }
    };

    fetchProductGroups();
  }, [rep, columnOrder]);
  
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
  
  const formatDeltaValue = (delta) => {
    if (delta > 0) {
      return `▲ ${delta.toFixed(1)}%`;
    } else if (delta < 0) {
      return `▼ ${Math.abs(delta).toFixed(1)}%`;
    }
    return '0.0%';
  };
  
  const getDeltaClass = (deltaCell) => {
    if (typeof deltaCell === 'string') {
      if (deltaCell.includes('▲')) return 'delta-up';
      if (deltaCell.includes('▼')) return 'delta-down';
    }
    return '';
  };
  
  const hiddenAmountColumnIndices = new Set(); // No columns hidden for now
  
  // Custom header rendering for tables
  const renderAmountHeaderWithBlanks = () => (
    <thead>
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
        <div className="table-empty-state">Loading product groups...</div>
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
        </tbody>
      </table>
    </div>
  );
};

export default SalesBySaleRepTable;
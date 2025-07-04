import React, { useEffect, useState } from 'react';
import TabsComponent, { Tab } from './TabsComponent';
import { useFilter } from '../../contexts/FilterContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import './SalesBySaleRepTable.css';
import './SalesRepTableCommon.css';
import '../dashboard/ProductGroupTable.css'; // Reuse main table CSS

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
  const { columnOrder, dataGenerated } = useFilter();
  const { selectedDivision, excelData } = useExcelData();

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

  // Extract product group data for a given sales rep
  const getProductGroupDataForRep = (rep) => {
    // Use the correct sheet for the division (e.g., 'FP-Volume')
    let sheetName = '';
    if (selectedDivision === 'FP') sheetName = 'FP-Volume';
    else if (selectedDivision === 'SB') sheetName = 'SB-Volume';
    else if (selectedDivision === 'TF') sheetName = 'TF-Volume';
    else if (selectedDivision === 'HCM') sheetName = 'HCM-Volume';
    else sheetName = selectedDivision + '-Volume';
    const sheetData = excelData[sheetName] || [];
    // DEBUG: Print all available sheet names in excelData
    console.log('[DEBUG] Sheet names in excelData:', Object.keys(excelData));
    // DEBUG: Print first 5 rows of the selected sheet
    console.log(`[DEBUG] First 5 rows of sheet ${sheetName}:`, (sheetData || []).slice(0, 5));
    // Data starts from row 3 (skip 3 header rows)
    const dataRows = sheetData.slice(3);
    // DEBUG: Print all unique sales rep names in the data
    const allSalesReps = Array.from(new Set(dataRows.map(row => row[0])));
    console.log('[DEBUG] All sales reps in data:', allSalesReps);
    // DEBUG: Print all rows for Abraham Mathew, Kgs, 2019 January Actual
    if (rep === 'Abraham Mathew' && selectedVariable === 'Kgs') {
      dataRows.forEach(row => {
        const salesRep = row[0];
        const productGroup = row[1];
        const ledger = row[6];
        const value = row[7]; // 2019 January Actual
        if (salesRep === 'Abraham Mathew' && ledger === 'Kgs') {
          console.log(`[DEBUG] Row: Rep=${salesRep}, Group=${productGroup}, Ledger=${ledger}, Value=${value}`);
        }
      });
    }
    // Find all product groups for this rep and selected variable
    const productGroups = Array.from(new Set(
      dataRows
        .filter(row => row[0] === rep && row[6] === selectedVariable) // Sales Rep in A (0), Ledger in G (6)
        .map(row => row[1]) // Product Group in B (1)
    )).filter(Boolean);
    // For each product group, sum values for each period/column (pivot logic)
    return productGroups
      .map(group => {
        const values = extendedColumns.map(col => {
          if (col.columnType === 'delta') {
            const fromVal = sumForPeriod(dataRows, rep, group, selectedVariable, col.fromColumn);
            const toVal = sumForPeriod(dataRows, rep, group, selectedVariable, col.toColumn);
            if (fromVal === 0 || isNaN(fromVal) || isNaN(toVal)) return '';
            const delta = ((toVal - fromVal) / fromVal) * 100;
            if (isNaN(delta) || !isFinite(delta)) return '';
            return `${delta > 0 ? '▲' : delta < 0 ? '▼' : ''} ${Math.abs(delta).toFixed(1)}%`;
          } else {
            // For normal period columns
            // Find the column index for this period
            const colIdx = col.columnIndex;
            // Sum all matching rows for this rep, group, variable, and period
            const sum = dataRows.reduce((acc, row) => {
              if (
                row[0] === rep &&
                row[1] === group &&
                row[6] === selectedVariable &&
                !isNaN(Number(row[colIdx])) &&
                row[colIdx] !== ''
              ) {
                return acc + Number(row[colIdx]);
              }
              return acc;
            }, 0);
            // DEBUG: Print sum for each product group and period
            if (rep === 'Abraham Mathew' && selectedVariable === 'Kgs') {
              console.log(`[DEBUG] SUM: Rep=${rep}, Group=${group}, Period=${col.headerLabel} => SUM=${sum}`);
            }
            return sum === 0 ? '' : sum;
          }
        });
        const hasNonzero = values.some(v => v !== '' && v !== 0 && v !== '0');
        return hasNonzero ? { name: group, values } : null;
      })
      .filter(Boolean);
  };

  // Helper to sum values for a period column config (pivot logic)
  const sumForPeriod = (dataRows, rep, group, variable, col) => {
    // Find the correct column index for the period (year, month, type)
    // Period columns start from H (index 7)
    const idx = col.columnIndex;
    if (idx === -1) return 0; // Handle cases where columnIndex is not available
    // Sum all rows matching rep, group, variable
    return dataRows.filter(row =>
      row[0] === rep &&
      row[1] === group &&
      row[6] === variable
    ).reduce((sum, row) => {
      const val = row[idx];
      if (val !== undefined && val !== null && !isNaN(parseFloat(val))) {
        return sum + parseFloat(val);
      }
      return sum;
    }, 0);
  };

  // Render table header rows based on extendedColumns (EXACT MATCH to ProductGroupTable)
  const renderTableHeader = () => (
    <thead>
      <tr className="main-header-row">
        <th className="product-header" rowSpan={3} style={{ verticalAlign: 'middle', textAlign: 'center' }}>Product Group</th>
        {extendedColumns.map((col, idx) =>
          col.columnType === 'delta' ? (
            <th
              key={`delta-${idx}`}
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
                <div style={{ fontSize: '12px' }}>Δ</div>
              </div>
            </th>
          ) : (
            <th
              key={`year-${idx}`}
              style={getColumnHeaderStyle(col)}
            >
              {col.year}
            </th>
          )
        )}
      </tr>
      <tr>
        {extendedColumns.map((col, idx) =>
          col.columnType === 'delta' ? null : (
            <th
              key={`month-${idx}`}
              style={getColumnHeaderStyle(col)}
            >
              {col.isCustomRange ? col.displayName : col.month}
            </th>
          )
        ).filter(Boolean)}
      </tr>
      <tr>
        {extendedColumns.map((col, idx) =>
          col.columnType === 'delta' ? null : (
            <th
              key={`type-${idx}`}
              style={getColumnHeaderStyle(col)}
            >
              {col.type}
            </th>
          )
        ).filter(Boolean)}
      </tr>
    </thead>
  );

  if (loading) return <div>Loading sales rep data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (defaultReps.length === 0) return <div>No sales reps configured. Please select sales reps in Master Data tab.</div>;
  if (!dataGenerated) {
    return (
      <div className="table-view">
        <h3>Sales Rep Product Group Table</h3>
        <div className="table-empty-state">
          <p>Please select columns and click the Generate button to view sales rep product group data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-rep-table-container product-group-table-container">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <label style={{ marginRight: 8, fontWeight: 600 }}>Variable:</label>
        <select value={selectedVariable} onChange={e => setSelectedVariable(e.target.value)}>
          {variableOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <TabsComponent>
        {defaultReps.map(rep => {
          const productGroupData = getProductGroupDataForRep(rep);
          return (
          <Tab key={rep} label={toProperCase(rep)}>
            <div className="sales-rep-content">
              <div style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 6 }}>{toProperCase(rep)}</div>
                <div style={{ fontSize: 16, color: '#555', marginBottom: 18 }}>Sales {selectedVariable} Comparison</div>
                <table className="financial-table product-group-table">
                {renderTableHeader()}
                <tbody>
                    {productGroupData.map(pg => (
                      <tr key={pg.name} className="product-header-row">
                        <td className="row-label product-header">{pg.name}</td>
                        {pg.values.map((val, idx) => (
                          <td key={idx} className="metric-cell">{val}</td>
                        ))}
                      </tr>
                    ))}
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
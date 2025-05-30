import React, { useState, useEffect } from 'react';
import { useFilter } from '../../contexts/FilterContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { exportHTMLReport } from '../../utils/htmlExport';
import { computeCellValue as sharedComputeCellValue } from '../../utils/computeCellValue';
import './ColumnConfigGrid.css';

// Color scheme definitions (same as charts)
const colorSchemesObj = {
  blue: '#288cfa',
  green: '#2E865F', 
  yellow: '#FFCC33',
  orange: '#FF9800',
  boldContrast: '#003366',
};

// Color scheme definitions for UI - array format
const colorSchemes = [
  { name: 'blue', label: 'Blue', primary: '#288cfa', secondary: '#103766', isDark: true },
  { name: 'green', label: 'Green', primary: '#2E865F', secondary: '#C6F4D6', isDark: true },
  { name: 'yellow', label: 'Yellow', primary: '#FFCC33', secondary: '#FFFDE7', isDark: false },
  { name: 'orange', label: 'Orange', primary: '#FF9800', secondary: '#FFE0B2', isDark: false },
  { name: 'boldContrast', label: 'Bold Contrast', primary: '#003366', secondary: '#FF0000', isDark: true }
];

const ColumnConfigGrid = ({ exportPdfFunction }) => {
  const { 
    columnOrder, 
    updateColumnOrder, 
    removeColumn, 
    clearAllColumns, 
    generateData, 
    dataGenerated,
    saveAsStandardSelection,
    clearStandardSelection,
    basePeriodIndex,
    setBasePeriod,
    clearBasePeriod,
    chartVisibleColumns,
    toggleChartColumnVisibility,
    isColumnVisibleInChart,
    selectedColumnIndex,
    setSelectedColumn
  } = useFilter();
  
  const { selectedDivision, excelData } = useExcelData();
  
  const [standardSaved, setStandardSaved] = useState(false);
  
  // Handle Clear All with resetting selection
  const handleClearAll = () => {
    clearAllColumns();
    setSelectedColumn(null); // Reset selected column when clearing all
    clearBasePeriod(); // Reset base period when clearing all
  };
  
  // Handle data generation
  const handleGenerate = () => {
    if (columnOrder.length > 0) {
      generateData();
    }
  };
  
  // Move a column left in the order
  const moveLeft = (index) => {
    if (index > 0) {
      const newOrder = [...columnOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      updateColumnOrder(newOrder);
    }
  };
  
  // Move a column right in the order
  const moveRight = (index) => {
    if (index < columnOrder.length - 1) {
      const newOrder = [...columnOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      updateColumnOrder(newOrder);
    }
  };
  
  // Get CSS class for column based on its config
  const getColumnClass = (column) => {
    const baseClass = 'config-column';
    if (column.customColor) {
      return `${baseClass} scheme-${column.customColor}`;
    }
    
    // Default to classic blue if no custom color
    return `${baseClass} scheme-classicBlue`;
  };
  
  // Get background color for column (for inline styling)
  const getColumnStyle = (column, isSelected = false) => {
    // Start with bold font style for all columns
    const baseStyle = { fontWeight: 'bold' };
    
    if (column.customColor) {
      const scheme = colorSchemes.find(s => s.name === column.customColor);
      if (scheme) {
        return { 
          ...baseStyle,
          backgroundColor: scheme.primary, 
          color: scheme.isDark ? '#FFFFFF' : '#000000',
          boxShadow: isSelected ? '0 0 5px 2px rgba(0,0,0,0.3)' : 'none'
        };
      }
    }
    
    // Default to blue if no custom color
    const defaultScheme = colorSchemes[0];
    return { 
      ...baseStyle,
      backgroundColor: defaultScheme.primary, 
      color: defaultScheme.isDark ? '#FFFFFF' : '#000000',
      boxShadow: isSelected ? '0 0 5px 2px rgba(0,0,0,0.3)' : 'none'
    };
  };
  
  // Handle column click to select it
  const handleColumnClick = (index) => {
    setSelectedColumn(index === selectedColumnIndex ? null : index);
  };
  
  // Handle remove column
  const handleRemoveColumn = () => {
    if (selectedColumnIndex !== null) {
      removeColumn(columnOrder[selectedColumnIndex].id);
      setSelectedColumn(null);
    }
  };
  
  // Function to determine text color based on background brightness
  const getTextColor = (colorScheme) => {
    // If we know the color is dark or light through our predefined property
    if (colorScheme && colorSchemes.find(s => s.name === colorScheme)) {
      const scheme = colorSchemes.find(s => s.name === colorScheme);
      return scheme.isDark ? '#FFFFFF' : '#000000';
    }
    
    // Default to white text
    return '#FFFFFF';
  };
  
  // Set custom color for the selected column
  const setColumnColor = (colorScheme) => {
    if (selectedColumnIndex !== null) {
      const newOrder = [...columnOrder];
      newOrder[selectedColumnIndex] = {
        ...newOrder[selectedColumnIndex],
        customColor: colorScheme
      };
      updateColumnOrder(newOrder);
    }
  };
  
  // Handle saving as standard selection
  const handleSaveAsStandard = () => {
    if (saveAsStandardSelection()) {
      setStandardSaved(true);
      // Reset the saved state after 2 seconds
      setTimeout(() => setStandardSaved(false), 2000);
    }
  };

  // Handle clearing standard selection
  const handleClearStandard = () => {
    if (clearStandardSelection()) {
      setStandardSaved(false);
    }
  };
  
  // Handle HTML export
  const handleHTMLExport = async () => {
    if (dataGenerated) {
      try {
        // Get base period information
        const basePeriod = columnOrder[basePeriodIndex];
        let basePeriodText = 'No Base Period Set';
        if (basePeriod) {
          if (basePeriod.isCustomRange) {
            basePeriodText = `${basePeriod.year} ${basePeriod.displayName} ${basePeriod.type}`;
          } else if (basePeriod.month) {
            basePeriodText = `${basePeriod.year} ${basePeriod.month} ${basePeriod.type}`;
          } else {
            basePeriodText = `${basePeriod.year} ${basePeriod.type}`;
          }
        }

        // Extract actual chart data from the DOM/refs
        const chartData = {};
        const visiblePeriods = columnOrder.filter(p => isColumnVisibleInChart(p.id));
        
        // Get the division data for computeCellValue
        const divisionData = excelData[selectedDivision] || [];
        const computeCellValue = (rowIndex, column) =>
          sharedComputeCellValue(divisionData, rowIndex, column);
        
        // Get chart data that would be passed to ChartContainer
        visiblePeriods.forEach(col => {
          let key;
          if (col.isCustomRange) {
            key = `${col.year}-${col.month}-${col.type}`;
          } else {
            key = `${col.year}-${col.month || 'Year'}-${col.type}`;
          }
          
          // Use actual computeCellValue function like ChartContainer
          const sales = computeCellValue(3, col);
          const material = computeCellValue(5, col);
          const salesVol = computeCellValue(7, col);
          const prodVol = computeCellValue(8, col);
          
          chartData[key] = {
            sales,
            materialCost: material,
            salesVolume: salesVol,
            productionVolume: prodVol,
            marginPerKg: salesVol > 0 ? (sales - material) / salesVol : null
          };
        });

        // Prepare actual data for HTML export
        const actualChartData = {
          periodLabels: visiblePeriods.map(p => 
            p.isCustomRange ? `${p.year}-${p.displayName}-${p.type}` : `${p.year}-${p.month || 'Year'}-${p.type}`
          ),
          periodNames: visiblePeriods.map(p => 
            `${p.year} ${p.isCustomRange ? p.displayName : (p.month || '')} ${p.type}`
          ),
          salesData: visiblePeriods.map(p => {
            const key = p.isCustomRange ? `${p.year}-${p.month}-${p.type}` : `${p.year}-${p.month || 'Year'}-${p.type}`;
            return chartData[key]?.sales || 0;
          }),
          barColors: visiblePeriods.map((p, index) => {
            if (p.customColor && colorSchemes.find(s => s.name === p.customColor)) {
              return colorSchemes.find(s => s.name === p.customColor).primary;
            }
            const defaultColors = ['#FFCC33', '#288cfa', '#003366', '#91cc75', '#5470c6'];
            return defaultColors[index % defaultColors.length];
          }),
          marginValue: chartData[Object.keys(chartData)[0]]?.marginPerKg * 10 || 25.3,
          marginPerKg: (chartData[Object.keys(chartData)[0]]?.marginPerKg || 2.85).toFixed(2),
          manufacturingCategories: ['Labour', 'Depreciation', 'Electricity', 'Others Mfg. Overheads'],
          manufacturingSeries: visiblePeriods.map((period, index) => ({
            name: `${period.year} ${period.isCustomRange ? period.displayName : (period.month || '')} ${period.type}`,
            type: 'bar',
            stack: 'total',
            data: [
              computeCellValue(9, period) || 0,   // Labour (row 9)
              computeCellValue(10, period) || 0,  // Depreciation (row 10)
              computeCellValue(12, period) || 0,  // Electricity (row 12)
              computeCellValue(13, period) || 0   // Others Mfg. Overheads (row 13)
            ],
            itemStyle: { 
              color: period.customColor && colorSchemes.find(s => s.name === period.customColor)
                ? colorSchemes.find(s => s.name === period.customColor).primary
                : ['#FFCC33', '#288cfa', '#003366', '#91cc75', '#5470c6'][index % 5]
            },
            label: {
              show: true,
              position: 'inside',
              fontSize: 14,
              fontWeight: 'bold',
              color: period.customColor === 'yellow' ? '#333' : '#fff'
            }
          })),
          expenseCategories: ['Selling Expenses', 'Admin Expenses', 'Finance Cost'],
          expensesSeries: visiblePeriods.map((period, index) => ({
            name: `${period.year} ${period.isCustomRange ? period.displayName : (period.month || '')} ${period.type}`,
            type: 'bar',
            stack: 'total',
            data: [
              computeCellValue(15, period) || 0,  // Selling Expenses (row 15)
              computeCellValue(16, period) || 0,  // Admin Expenses (row 16)
              computeCellValue(17, period) || 0   // Finance Cost (row 17)
            ],
            itemStyle: { 
              color: period.customColor && colorSchemes.find(s => s.name === period.customColor)
                ? colorSchemes.find(s => s.name === period.customColor).primary
                : ['#FFCC33', '#288cfa', '#003366', '#91cc75', '#5470c6'][index % 5]
            },
            label: {
              show: true,
              position: 'inside',
              fontSize: 14,
              fontWeight: 'bold',
              color: period.customColor === 'yellow' ? '#333' : '#fff'
            }
          }))
        };

        // Prepare export data with actual chart data
        const exportData = {
          division: selectedDivision,
          divisionName: selectedDivision,
          basePeriod: basePeriodText,
          periods: visiblePeriods,
          chartVisibleColumns: chartVisibleColumns,
          dataGenerated: dataGenerated,
          actualData: actualChartData
        };

        console.log('Exporting HTML report with actual data:', exportData);
        
        await exportHTMLReport(exportData);
      } catch (error) {
        console.error('Error exporting HTML report:', error);
        alert('Failed to export HTML report. Please try again.');
      }
    }
  };
  
  return (
    <div className="column-config-container">
      <div className="column-config-header">
        <div className="header-title-actions">
          <h3>Column Configuration</h3>
          <div className="header-buttons-container">
            {columnOrder.length > 0 && (
              <>
                <div className="standard-buttons">
                  <button 
                    onClick={handleSaveAsStandard} 
                    className={`standard-btn ${standardSaved ? 'saved' : ''}`}
                    title="Save current selection as standard"
                  >
                    {standardSaved ? 'Saved as Standard!' : 'Save as Standard'}
                  </button>
                  <button 
                    onClick={handleClearStandard} 
                    className="clear-standard-btn"
                    title="Clear standard selection"
                  >
                    Clear Standard
                  </button>
                </div>
                <div className="action-buttons">
                <button onClick={handleGenerate} className="generate-btn" disabled={dataGenerated}>
                  {dataGenerated ? 'Generated' : 'Generate'}
                </button>
                <button onClick={handleClearAll} className="clear-all-btn">
                  Clear All
                </button>
                </div>
              </>
            )}
          </div>
        </div>
        {selectedColumnIndex !== null && (
          <div className="column-actions">
            <button onClick={() => moveLeft(selectedColumnIndex)} disabled={selectedColumnIndex === 0}>
              ← Move Left
            </button>
            <button onClick={() => moveRight(selectedColumnIndex)} disabled={selectedColumnIndex === columnOrder.length - 1}>
              Move Right →
            </button>
            <button onClick={handleRemoveColumn} className="remove-btn">
              Remove
            </button>
            <div className="color-selector">
              <span>Color Scheme:</span>
              <div className="color-options">
                {colorSchemes.map((scheme) => (
                  <div 
                    key={scheme.name} 
                    className="color-option"
                    style={{ backgroundColor: scheme.primary, border: `1px solid ${scheme.secondary}` }}
                    onClick={() => setColumnColor(scheme.name)}
                    title={scheme.label}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="config-grid">
        {columnOrder.length > 0 ? (
          <>
            {/* Base period selector row aligned with columns */}
            <div className="config-row base-period-row">
              {columnOrder.map((column, index) => (
                <div
                  key={`base-period-${index}`}
                  className={`base-period-selector${basePeriodIndex === index ? ' selected' : ''}${basePeriodIndex !== null && basePeriodIndex !== index ? ' faded' : ''}`}
                  onClick={() => setBasePeriod(index)}
                  title={basePeriodIndex === index ? 'Base Period' : 'Set as Base Period'}
                >
                  {basePeriodIndex === index ? '★' : '☆'}
                </div>
              ))}
              <div className="row-description">
                <strong><em>Select a column as the base period for comparisons</em></strong>
              </div>
            </div>
            {/* End base period selector row */}
            {/* Chart visibility row */}
            <div className="config-row chart-visibility-row">
              {columnOrder.map((column, index) => (
                <div
                  key={`chart-visibility-${index}`}
                  className={`chart-visibility-selector${isColumnVisibleInChart(column.id) ? ' visible' : ' hidden'}`}
                  onClick={() => toggleChartColumnVisibility(column.id)}
                  title={isColumnVisibleInChart(column.id) ? 'Visible in Chart (click to hide)' : 'Hidden from Chart (click to show)'}
                >
                  {isColumnVisibleInChart(column.id) ? '✓' : ''}
                </div>
              ))}
              <div className="row-description">
                <strong><em>Select which columns appear in charts</em></strong>
              </div>
            </div>
            {/* End chart visibility row */}
            <div className="config-row year-row">
              {columnOrder.map((column, index) => (
                <div 
                  key={`year-${index}`} 
                  className={`config-column ${selectedColumnIndex === index ? 'selected' : ''}`}
                  style={getColumnStyle(column, selectedColumnIndex === index)}
                  onClick={() => handleColumnClick(index)}
                >
                  {column.year}
                </div>
              ))}
            </div>
            <div className="config-row period-row">
              {columnOrder.map((column, index) => (
                <div 
                  key={`period-${index}`} 
                  className={`config-column ${selectedColumnIndex === index ? 'selected' : ''}`}
                  style={getColumnStyle(column, selectedColumnIndex === index)}
                  onClick={() => handleColumnClick(index)}
                >
                  {column.isCustomRange ? column.displayName : column.month}
                </div>
              ))}
            </div>
            <div className="config-row type-row">
              {columnOrder.map((column, index) => (
                <div 
                  key={`type-${index}`} 
                  className={`config-column ${selectedColumnIndex === index ? 'selected' : ''}`}
                  style={getColumnStyle(column, selectedColumnIndex === index)}
                  onClick={() => handleColumnClick(index)}
                >
                  {column.type}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-columns-message">
            No columns configured. Please select options from above and click "Add Column".
          </div>
        )}
      </div>
      {/* Add Generate Complete Report buttons at the bottom */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: 24, marginBottom: 8 }}>
        <button 
          className="generate-btn" 
          style={{ minWidth: 200, fontSize: 16, padding: '10px 24px' }} 
          onClick={exportPdfFunction}
          disabled={!exportPdfFunction || !dataGenerated}
          title={!dataGenerated ? "Please generate data first" : !exportPdfFunction ? "Charts are loading..." : "Export all charts to PDF"}
        >
          PDF Report
        </button>
        <button 
          className="generate-btn" 
          style={{ 
            minWidth: 200, 
            fontSize: 16, 
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #2E865F, #34a085)',
            border: 'none',
            color: 'white'
          }} 
          onClick={handleHTMLExport}
          disabled={!dataGenerated}
          title={!dataGenerated ? "Please generate data first" : "Export interactive HTML report"}
        >
          HTML Report
        </button>
      </div>
    </div>
  );
};

export default ColumnConfigGrid;

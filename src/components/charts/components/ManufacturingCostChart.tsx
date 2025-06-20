import React, { useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

// Manufacturing cost ledger items and their positions
// These need to match the actual row positions in your table data
const MANUFACTURING_LEDGERS = {
  LABOUR: { label: 'Labour', rowIndex: 9 }, // Updated with correct row index
  DEPRECIATION: { label: 'Depreciation', rowIndex: 10 }, // Updated with correct row index
  ELECTRICITY: { label: 'Electricity', rowIndex: 12 }, // Updated with correct row index  
  OTHER_OVERHEADS: { label: 'Others Mfg. Overheads', rowIndex: 13 }, // Updated with correct row index
  TOTAL_DIRECT_COST: { label: 'Total Actual Direct Cost', rowIndex: 14 }, // Updated with correct row index
};

// Color scheme definitions (MUST MATCH ColumnConfigGrid.js exactly)
const colorSchemes = [
  { name: 'blue', label: 'Blue', primary: '#288cfa', secondary: '#103766', isDark: true },
  { name: 'green', label: 'Green', primary: '#2E865F', secondary: '#C6F4D6', isDark: true },
  { name: 'yellow', label: 'Yellow', primary: '#FFD700', secondary: '#FFFDE7', isDark: false },
  { name: 'orange', label: 'Orange', primary: '#FF6B35', secondary: '#FFE0B2', isDark: false },
  { name: 'boldContrast', label: 'Bold Contrast', primary: '#003366', secondary: '#FF0000', isDark: true }
];

// Default fallback colors in order
const defaultColors = ['#FFD700', '#288cfa', '#003366', '#91cc75', '#5470c6'];

// Get all ledger items except the total
const ledgerItems = Object.values(MANUFACTURING_LEDGERS).filter(item => 
  item !== MANUFACTURING_LEDGERS.TOTAL_DIRECT_COST);

// Add a simple helper to format values in the way that matches your screenshot
const formatAsReadableNumber = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0.00';
  
  // Convert to string with 2 decimal places
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const ManufacturingCostChart = ({ tableData, selectedPeriods, computeCellValue, style }) => {
  // Debug initial props
  useEffect(() => {
    console.group('ManufacturingCostChart - Initial Props');
    console.log('tableData:', tableData);
    console.log('selectedPeriods:', selectedPeriods);
    console.log('computeCellValue function available:', typeof computeCellValue === 'function');
    console.log('Number of selected periods:', selectedPeriods?.length || 0);
    console.log('Style prop:', style);
    console.groupEnd();
  }, [tableData, selectedPeriods, computeCellValue, style]);

  // If no periods selected or no compute function, show empty state
  if (!selectedPeriods || selectedPeriods.length === 0 || typeof computeCellValue !== 'function') {
    console.error('ManufacturingCostChart: Missing required props');
    
    return (
      <div className="modern-margin-gauge-panel" style={{ marginTop: 30, padding: 20, textAlign: 'center' }}>
        <h2 className="modern-gauge-heading">Manufacturing Cost</h2>
        <p>No data available. Please select a period.</p>
      </div>
    );
  }

  // Limit to 5 periods max
  const periodsToUse = selectedPeriods.slice(0, 5);
  console.log('ManufacturingCostChart - periodsToUse:', periodsToUse.length, periodsToUse.map(p => ({
    year: p.year,
    month: p.month,
    type: p.type,
    isCustomRange: p.isCustomRange,
    displayName: p.displayName
  })));

  // DEBUG: Check if we can find the Sales row
  if (periodsToUse.length > 0 && tableData && tableData.length) {
    console.group('Searching for Sales row');
    // Check first few rows to find where Sales data might be
    for (let i = 0; i < Math.min(7, tableData.length); i++) {
      try {
        const rowValue = computeCellValue(i, periodsToUse[0]);
        console.log(`Row ${i} data:`, {
          value: rowValue,
          row: tableData[i]
        });
      } catch (err) {
        console.error(`Error reading row ${i}:`, err);
      }
    }
    console.groupEnd();
  }

  // Extract data for all ledgers across all periods
  const ledgersData = {};
  const periodTotals = {};

  // FIRST: Calculate all period names that will be used
  const allPeriodNames = periodsToUse.map(period => {
    const periodName = `${period.year} ${period.isCustomRange ? period.displayName : (period.month || '')} ${period.type}`;
    
    // Debug custom ranges specifically
    if (period.isCustomRange) {
      console.log('Custom Range Debug:', {
        year: period.year,
        month: period.month,
        displayName: period.displayName,
        months: period.months,
        type: period.type,
        finalPeriodName: periodName
      });
    }
    
    return periodName;
  });
  
  console.log('ManufacturingCostChart - allPeriodNames:', allPeriodNames);

  // Initialize data structure for ALL periods and ledgers
  ledgerItems.forEach(ledger => {
    ledgersData[ledger.label] = { label: ledger.label, values: {} };
    // Initialize ALL periods for this ledger
    allPeriodNames.forEach(periodName => {
      ledgersData[ledger.label].values[periodName] = {
        amount: 0,
        percentOfSales: 0,
        perKg: 0
      };
    });
  });

  // ENSURE ALL PERIODS GET PROCESSED - Initialize all period totals first
  // Initialize all periods in totals
  allPeriodNames.forEach(periodName => {
    periodTotals[periodName] = {
      amount: 0,
      percentOfSales: 0,
      perKg: 0
    };
  });

  // Process each period
  periodsToUse.forEach((period, periodIndex) => {
    try {
      // Create a readable period name 
      const periodName = `${period.year} ${period.isCustomRange ? period.displayName : (period.month || '')} ${period.type}`;
      let periodTotal = 0;

      // Process each ledger for this period
      ledgerItems.forEach(ledger => {
        try {
          // Get the base amount - using the default behavior
          const amount = computeCellValue(ledger.rowIndex, period);
          
          // Get values needed for calculations
          // Row 3 is Sales
          const salesValue = computeCellValue(3, period);
          // Row 7 is Sales Volume (kg)
          const salesVolumeValue = computeCellValue(7, period);
          
          console.log(`Ledger [${ledger.label}] raw values:`, {
            rowValue: amount,
            salesValue,
            salesVolumeValue
          });
          
          // Calculate percent of sales exactly as in TableView.js
          let percentOfSales = 0;
          if (typeof salesValue === 'number' && !isNaN(salesValue) && salesValue !== 0) {
            percentOfSales = (amount / salesValue) * 100;
          }
          
          // Calculate per kg value exactly as in TableView.js
          let perKgValue = 0;
          if (typeof salesVolumeValue === 'number' && !isNaN(salesVolumeValue) && salesVolumeValue !== 0) {
            perKgValue = amount / salesVolumeValue;
          }
          
          console.log(`Calculated values for [${ledger.label}]:`, {
            amount,
            percentOfSales,
            perKgValue
          });

          // Store the values in our data structure
          const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
          const validPercentOfSales = typeof percentOfSales === 'number' && !isNaN(percentOfSales) ? percentOfSales : 0;
          const validPerKg = typeof perKgValue === 'number' && !isNaN(perKgValue) ? perKgValue : 0;
          
          ledgersData[ledger.label].values[periodName] = {
            amount: validAmount,
            percentOfSales: validPercentOfSales,
            perKg: validPerKg
          };
          
          // Add to period totals
          periodTotal += validAmount;
        } catch (err) {
          console.error(`Error extracting data for ${ledger.label} in period ${periodName}:`, err);
          ledgersData[ledger.label].values[periodName] = {
            amount: 0,
            percentOfSales: 0,
            perKg: 0
          };
        }
      });

      // Store the totals for this period
      periodTotals[periodName] = {
        amount: periodTotal,
        percentOfSales: 0,
        perKg: 0
      };

      // Also get the actual totals from the dedicated row
      try {
        const actualTotal = computeCellValue(MANUFACTURING_LEDGERS.TOTAL_DIRECT_COST.rowIndex, period);
        
        // Get values needed for calculations
        // Row 3 is Sales
        const salesValue = computeCellValue(3, period);
        // Row 7 is Sales Volume (kg)
        const salesVolumeValue = computeCellValue(7, period);
        
        // Calculate percent of sales for the total
        let totalPercentOfSales = 0;
        if (typeof salesValue === 'number' && !isNaN(salesValue) && salesValue !== 0) {
          totalPercentOfSales = (actualTotal / salesValue) * 100;
        }
        
        // Calculate per kg value for the total
        let totalPerKgValue = 0;
        if (typeof salesVolumeValue === 'number' && !isNaN(salesVolumeValue) && salesVolumeValue !== 0) {
          totalPerKgValue = actualTotal / salesVolumeValue;
        }
        
        console.log(`Total values for period ${periodName}:`, { 
          actualTotal,
          totalPercentOfSales,
          totalPerKgValue
        });
        
        // Use the actual values if available, otherwise use our calculated ones
        if (typeof actualTotal === 'number' && !isNaN(actualTotal)) {
          periodTotals[periodName].amount = actualTotal;
        }
        periodTotals[periodName].percentOfSales = totalPercentOfSales;
        periodTotals[periodName].perKg = totalPerKgValue;
      } catch (err) {
        console.error(`Error getting totals for period ${periodName}:`, err);
      }
    } catch (err) {
      const errorPeriodName = `${period.year} ${period.isCustomRange ? period.displayName : (period.month || '')} ${period.type}`;
      console.error(`Error processing period ${errorPeriodName}:`, err);
    }
  });

  // Sort ledgers by the average amount across periods (descending)
  const ledgersList = Object.values(ledgersData);
  ledgersList.sort((a, b) => {
    const aAvg = Object.values(a.values).reduce((sum, val) => sum + (val.amount || 0), 0) / Object.values(a.values).length;
    const bAvg = Object.values(b.values).reduce((sum, val) => sum + (val.amount || 0), 0) / Object.values(b.values).length;
    return bAvg - aAvg;
  });

  // Get sorted labels and period names
  const ledgerLabels = ledgersList.map(ledger => ledger.label);
  // Use the pre-calculated period names to ensure all 5 periods appear
  const periodNames = allPeriodNames;
  
  console.log('ManufacturingCostChart - Final periodNames for legend:', periodNames);

  // Prepare series for each period
  const series = periodsToUse.map((period, index) => {
    const periodName = `${period.year} ${period.isCustomRange ? period.displayName : (period.month || '')} ${period.type}`;
    
    console.log(`Creating series for period ${index + 1}/${periodsToUse.length}: ${periodName}`);
    
    // Get color based on period's customColor or fallback to default (same as other components)
    let color;
    if (period.customColor) {
      const scheme = colorSchemes.find(s => s.name === period.customColor);
      if (scheme) {
        color = scheme.primary;
      }
    } else {
      // Default color assignment based on month/type (same as tables)
      if (period.month === 'Q1' || period.month === 'Q2' || period.month === 'Q3' || period.month === 'Q4') {
        color = '#FF6B35'; // Orange (light red)
      } else if (period.month === 'January') {
        color = '#FFD700'; // Yellow
      } else if (period.month === 'Year') {
        color = '#288cfa'; // Blue
      } else if (period.type === 'Budget') {
        color = '#2E865F'; // Green
      } else {
        color = defaultColors[index % defaultColors.length];
      }
    }
    
    // Function to determine if a color is dark (for text contrast)
    const isColorDark = (hexColor) => {
      // Convert hex to RGB
      const r = parseInt(hexColor.substring(1, 3), 16);
      const g = parseInt(hexColor.substring(3, 5), 16);
      const b = parseInt(hexColor.substring(5, 7), 16);
      // Calculate brightness (perceived luminance)
      return (r * 0.299 + g * 0.587 + b * 0.114) < 150;
    };
    
    // Determine text color based on background color
    const textColor = isColorDark(color) ? '#fff' : '#333';
    
    return {
      name: periodName,
      type: 'bar',
      stack: 'total',
      hoverLayerThreshold: Infinity, // Disable hover layer
      label: {
        show: true,
        position: 'inside', // Always position labels inside as shown in the screenshot
        formatter: params => {
          // Show all metrics - amount, % of sales, and per kg
          const data = ledgersList.find(l => l.label === params.name)?.values[periodName];
          if (!data) return '';
          
          // Format values with appropriate precision
          const millionsValue = (data.amount / 1000000).toFixed(2);
          const percentValue = data.percentOfSales.toFixed(1);
          const perKgValue = data.perKg.toFixed(1);
          
          return [
            `${millionsValue}M`,
            '', // Add empty line for spacing
            `${percentValue}%/Sls`,
            '', // Add empty line for spacing
            `${perKgValue}/kg`
          ].join('\n');
        },
        fontSize: 14,
        fontWeight: 'bold',
        color: textColor, // Dynamic text color based on background
        backgroundColor: 'transparent',
        padding: [2, 4],
        borderRadius: 0,
        textBorderWidth: 0,
        shadowBlur: 0,
        lineHeight: 12, // Reduced line height for better control with empty lines
        align: 'center',
        verticalAlign: 'middle'
      },
      emphasis: {
        focus: 'series',
        blurScope: 'coordinateSystem',
        label: {
          fontSize: 11,
          fontWeight: 'bold'
        }
      },
      data: ledgerLabels.map(label => {
        const ledger = ledgersList.find(l => l.label === label);
        return ledger?.values[periodName]?.amount || 0;
      }),
      itemStyle: {
        color: color,
        borderRadius: [0, 2, 2, 0] // Rounded corners on right side only
      },
      barWidth: '80%', // Slightly wider bars
      barGap: '20%', // Reduced gap between bars of different series
      barCategoryGap: '30%' // Gap between bar categories
    };
  });

  // Format amounts in millions consistently
  const formatMillions = value => {
    return `${(value / 1000000).toFixed(2)}M`;
  };

  // Format percentage values
  const formatPercent = value => {
    return `${(Number(value) || 0).toFixed(1)}%/Sls`;
  };

  // Format per kg values
  const formatPerKg = value => {
    return `${(Number(value) || 0).toFixed(1)}/kg`;
  };

  // Format for tooltip values with bold styling
  const formatTooltipValue = value => {
    const millions = (value / 1000000).toFixed(2);
    return `<span style="font-weight:bold;font-size:14px">${millions}M</span>`;
  };

  // Create ECharts option with improved styling
  const option = {
    tooltip: { trigger: 'none', show: false },
    legend: {
      data: periodNames,
      type: 'scroll',
      top: 0,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666'
      },
      pageIconColor: '#888',
      pageTextStyle: {
        color: '#888'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%', 
      top: '40px',
      containLabel: true
    },
    xAxis: {
      show: true, // Show x-axis
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false // Hide axis labels
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#eee',
          type: 'dashed'
        }
      },
      axisPointer: {
        show: false // Disable axis pointer
      }
    },
    yAxis: {
      type: 'category',
      data: ledgerLabels,
      axisLabel: {
        fontWeight: 'bold',
        fontSize: 13,
        color: '#444',
        padding: [0, 20, 0, 0], // Add padding to right side
        formatter: value => {
          // If text is too long, truncate and add ellipsis
          if (value.length > 25) {
            return value.substring(0, 22) + '...';
          }
          // Split "Others Mfg. Overheads" into two lines as requested
          if (value === 'Others Mfg. Overheads') {
            return 'Manufacturing\n\nOverhead';
          }
          return value;
        },
        rich: {
          // Rich text styling for multi-line labels
          a: {
            fontWeight: 'bold',
            fontSize: 13,
            color: '#444',
            lineHeight: 20
          }
        }
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: false
      }
    },
    series: series
  };

  console.log('ManufacturingCostChart - Final chart configuration:', {
    seriesCount: series.length,
    legendDataCount: periodNames.length,
    periodsToUseCount: periodsToUse.length,
    seriesNames: series.map(s => s.name),
    legendData: periodNames
  });

  // Format a summary for each period's total
  const renderTotals = () => {
    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'space-around', 
        marginTop: 20,
        gap: '5px' // Reduced gap from 10px to 5px
      }}>
        {periodsToUse.map((period, index) => {
          const periodName = `${period.year} ${period.isCustomRange ? period.displayName : (period.month || '')} ${period.type}`;
          const totals = periodTotals[periodName] || { amount: 0, percentOfSales: 0, perKg: 0 };
          
          // Format values with proper decimal places
          const formattedMillions = (totals.amount / 1000000).toFixed(2);
          const formattedPercent = totals.percentOfSales.toFixed(1);
          const formattedPerKg = totals.perKg.toFixed(1);
          
          // Get color for period (same logic as above)
          let color;
          if (period.customColor) {
            const scheme = colorSchemes.find(s => s.name === period.customColor);
            if (scheme) {
              color = scheme.primary;
            }
          } else {
            // Default color assignment based on month/type (same as tables)
            if (period.month === 'Q1' || period.month === 'Q2' || period.month === 'Q3' || period.month === 'Q4') {
              color = '#FF6B35'; // Orange (light red)
            } else if (period.month === 'January') {
              color = '#FFD700'; // Yellow
            } else if (period.month === 'Year') {
              color = '#288cfa'; // Blue
            } else if (period.type === 'Budget') {
              color = '#2E865F'; // Green
            } else {
              color = defaultColors[index % defaultColors.length];
            }
          }
          
          // Function to determine if a color is dark (for text contrast)
          const isColorDark = (hexColor) => {
            // Convert hex to RGB
            const r = parseInt(hexColor.substring(1, 3), 16);
            const g = parseInt(hexColor.substring(3, 5), 16);
            const b = parseInt(hexColor.substring(5, 7), 16);
            // Calculate brightness (perceived luminance)
            return (r * 0.299 + g * 0.587 + b * 0.114) < 150;
          };
          
          // Get appropriate text color based on background
          const textColor = isColorDark(color) ? '#fff' : '#333';
          
          return (
            <div key={index} style={{ 
              padding: '12px 15px', 
              borderRadius: '6px',
              backgroundColor: color, // Use exact same color as bars
              border: `1px solid ${color}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
              minWidth: '200px',
              maxWidth: '210px', // Slightly reduced max-width
              flex: '1',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.07)';
            }}>
              {/* No need for color strip at top since the entire card has the color */}
              
              <div style={{ 
                fontSize: 14, 
                color: textColor, // Text color based on background brightness
                fontWeight: 500,
                marginTop: 4
              }}>
                {periodName}
              </div>
              
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: 22,
                color: textColor, // Text color based on background brightness
                marginTop: 8
              }}>
                {formattedMillions}M
              </div>
              
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                fontWeight: 'bold', // Made bold as requested
                color: textColor, // Text color based on background brightness
                marginTop: 8
              }}>
                <div>{formattedPercent}%/Sls</div>
                <div>{formattedPerKg}/kg</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="modern-margin-gauge-panel" style={{ 
      marginTop: 30,
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      padding: style?.padding || '20px', // Allow padding override for PDF export
      width: '95%',
      marginLeft: 'auto',
      marginRight: 'auto',
      boxSizing: 'border-box',
      ...(style || {}) // Apply any style props passed from parent component
    }}>
      <h2 className="modern-gauge-heading" style={{
        textAlign: 'center',
        fontSize: '18px',
        marginBottom: '20px',
        color: '#333',
        fontWeight: '600'
      }}>
        Manufacturing Cost
      </h2>
      
      {ledgerLabels.length > 0 ? (
        <>
          <ReactECharts 
            option={option} 
            style={{ height: 600, width: '100%' }} // Use full panel width
            notMerge={true}
            opts={{ renderer: 'svg' }}
          />
          
          <h3 style={{ 
            textAlign: 'center', 
            marginTop: 24, 
            fontSize: 16,
            fontWeight: '600',
            color: '#444',
            position: 'relative'
          }}>
            Total Actual Direct Cost
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '50px',
              height: '3px',
              backgroundColor: '#2E865F',
              borderRadius: '2px'
            }} />
          </h3>
          
          {renderTotals()}
        </>
      ) : (
        <div style={{ 
          padding: 20, 
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <p>No manufacturing cost data available for the selected periods.</p>
        </div>
      )}
    </div>
  );
};

export default ManufacturingCostChart;
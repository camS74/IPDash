import React, { useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

// Below Gross Profit Expenses ledger items and their positions
// These need to match the actual row positions in your table data
const BELOW_GP_LEDGERS = {
  SELLING_EXPENSES: { label: 'Selling expenses', rowIndex: 31 },
  TRANSPORTATION: { label: 'Transportation', rowIndex: 32 },
  ADMINISTRATION: { label: 'Administration', rowIndex: 40 },
  BANK_INTEREST: { label: 'Bank interest', rowIndex: 42 },
  TOTAL_BELOW_GP_EXPENSES: { label: 'Total Below GP Expenses', rowIndex: 52 },
};

// Color scheme definitions (matching the config grid)
const colorSchemes = {
  blue: '#288cfa',
  green: '#2E865F',
  yellow: '#FFCC33', // Using #FFCC33 instead of #FFEA00 to match other charts
  orange: '#FF9800',
  boldContrast: '#003366',
};

// Default fallback colors in order
const defaultColors = ['#FFCC33', '#288cfa', '#003366', '#91cc75', '#5470c6'];

// Get all ledger items except the total
const ledgerItems = Object.values(BELOW_GP_LEDGERS).filter(item => 
  item !== BELOW_GP_LEDGERS.TOTAL_BELOW_GP_EXPENSES);

// Add a simple helper to format values in the way that matches your screenshot
const formatAsReadableNumber = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0.00';
  
  // Convert to string with 2 decimal places
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const BelowGPExpensesChart = ({ tableData, selectedPeriods, computeCellValue, style }) => {
  // Debug initial props
  useEffect(() => {
    console.group('BelowGPExpensesChart - Initial Props');
    console.log('tableData:', tableData);
    console.log('selectedPeriods:', selectedPeriods);
    console.log('computeCellValue function available:', typeof computeCellValue === 'function');
    console.log('Number of selected periods:', selectedPeriods?.length || 0);
    console.log('Style prop:', style);
    console.groupEnd();
  }, [tableData, selectedPeriods, computeCellValue, style]);

  // If no periods selected or no compute function, show empty state
  if (!selectedPeriods || selectedPeriods.length === 0 || typeof computeCellValue !== 'function') {
    console.error('BelowGPExpensesChart: Missing required props');
    
    return (
      <div className="modern-margin-gauge-panel" style={{ marginTop: 60, padding: 20, textAlign: 'center' }}>
        <h2 className="modern-gauge-heading">Below Gross Profit Expenses</h2>
        <p>No data available. Please select a period.</p>
      </div>
    );
  }

  // Limit to 5 periods max
  const periodsToUse = selectedPeriods.slice(0, 5);
  console.log('Using periods:', periodsToUse);

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

  // Initialize data structure
  ledgerItems.forEach(ledger => {
    ledgersData[ledger.label] = { label: ledger.label, values: {} };
  });

  // Process each period
  periodsToUse.forEach((period, periodIndex) => {
    try {
      // Create a readable period name 
      const periodName = `${period.year} ${period.month || ''} ${period.type}`;
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
        const actualTotal = computeCellValue(BELOW_GP_LEDGERS.TOTAL_BELOW_GP_EXPENSES.rowIndex, period);
        
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
      console.error(`Error processing period ${period.year} ${period.month} ${period.type}:`, err);
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
  const periodNames = periodsToUse.map(period => `${period.year} ${period.month || ''} ${period.type}`);

  // Prepare series for each period
  const series = periodsToUse.map((period, index) => {
    const periodName = `${period.year} ${period.month || ''} ${period.type}`;
    
    // Get color based on period's customColor or fallback to default
    let color;
    if (period.customColor && colorSchemes[period.customColor]) {
      color = colorSchemes[period.customColor];
    } else {
      color = defaultColors[index % defaultColors.length];
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
        position: 'inside',
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
            `${percentValue}%/S`,
            '', // Add empty line for spacing
            `${perKgValue}/kg`
          ].join('\n');
        },
        fontSize: 14,
        fontWeight: 'bold',
        color: textColor,
        backgroundColor: 'transparent',
        padding: [2, 4],
        borderRadius: 0,
        textBorderWidth: 0,
        shadowBlur: 0,
        lineHeight: 12,
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
        borderRadius: [0, 2, 2, 0]
      },
      barWidth: '80%',
      barGap: '20%',
      barCategoryGap: '30%'
    };
  });

  // Format amounts in millions consistently
  const formatMillions = value => {
    return `${(value / 1000000).toFixed(2)}M`;
  };

  // Format percentage values
  const formatPercent = value => {
    return `${(Number(value) || 0).toFixed(1)}% of Sales`;
  };

  // Format per kg values
  const formatPerKg = value => {
    return `${(Number(value) || 0).toFixed(1)} per kg`;
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
        fontSize: 12,
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
      show: true,
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false
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

  // Format a summary for each period's total
  const renderTotals = () => {
    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'nowrap', 
        justifyContent: 'center', 
        alignItems: 'flex-end', 
        gap: '4px', 
        marginTop: 20,
        marginBottom: 0,
        width: '100%',
        overflowX: 'auto',
        padding: '0 16px',
      }}>
        {periodsToUse.map((period, idx) => {
          // Move all variable declarations here for each card
          const periodName = `${period.year} ${period.month || ''} ${period.type}`;
          const totals = periodTotals[periodName] || { amount: 0, percentOfSales: 0, perKg: 0 };
          const formattedMillions = (totals.amount / 1000000).toFixed(2);
          const formattedPercent = totals.percentOfSales.toFixed(1);
          const formattedPerKg = totals.perKg.toFixed(1);
          let color;
          if (period.customColor && colorSchemes[period.customColor]) {
            color = colorSchemes[period.customColor];
          } else {
            color = defaultColors[idx % defaultColors.length];
          }
          const isColorDark = (hexColor: string) => {
            const r = parseInt(hexColor.substring(1, 3), 16);
            const g = parseInt(hexColor.substring(3, 5), 16);
            const b = parseInt(hexColor.substring(5, 7), 16);
            return (r * 0.299 + g * 0.587 + b * 0.114) < 150;
          };
          const textColor = isColorDark(color) ? '#fff' : '#333';
          return (
            <React.Fragment key={period.year + period.month + period.type}>
              {/* Card */}
              <div style={{
              padding: '12px 15px', 
              borderRadius: '6px',
                backgroundColor: color,
              border: `1px solid ${color}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
                minWidth: '180px',
                maxWidth: '180px',
                width: '180px',
              flex: '1',
              textAlign: 'center',
              position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <div style={{ fontSize: 14, color: textColor, fontWeight: 500, marginTop: 4 }}>{periodName}</div>
                <div style={{ fontWeight: 'bold', fontSize: 22, color: textColor, marginTop: 8 }}>
                {formattedMillions}M
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                  fontWeight: 'bold',
                  color: textColor,
                  marginTop: 8,
                  width: '100%'
              }}>
                <div>{formattedPercent}% of Sales</div>
                <div>{formattedPerKg} per kg</div>
              </div>
            </div>
              {/* Variance badge between cards */}
              {idx < periodsToUse.length - 1 && (() => {
                // Calculate variance vs next card
                const nextPeriod = periodsToUse[idx + 1];
                const nextPeriodName = `${nextPeriod.year} ${nextPeriod.month || ''} ${nextPeriod.type}`;
                const nextTotals = periodTotals[nextPeriodName] || { amount: 0 };
                let variance = null;
                if (totals.amount !== 0) {
                  variance = ((nextTotals.amount - totals.amount) / Math.abs(totals.amount)) * 100;
                }
                let badgeColor = '#888', arrow = '–';
                if (variance !== null && !isNaN(variance)) {
                  if (variance > 0) { badgeColor = '#2E865F'; arrow = '▲'; }
                  else if (variance < 0) { badgeColor = '#cf1322'; arrow = '▼'; }
                }
                return (
                  <div style={{
                    alignSelf: 'center',
                    margin: '0 2px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 40,
                    width: 40,
                    height: 60,
                    justifyContent: 'center',
                  }}>
                    {variance === null || isNaN(variance) ? (
                      <span style={{ color: '#888', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>N/A</span>
                    ) : (
                      <>
                        <span style={{ fontSize: 22, fontWeight: 'bold', color: badgeColor, lineHeight: 1 }}>{arrow}</span>
                        <span style={{ fontSize: 18, fontWeight: 'bold', color: badgeColor, lineHeight: 1.1 }}>{Math.abs(variance).toFixed(1)}</span>
                        <span style={{ fontSize: 16, fontWeight: 'bold', color: badgeColor, lineHeight: 1.1 }}>%</span>
                      </>
                    )}
                  </div>
                );
              })()}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="modern-margin-gauge-panel" style={{ 
      marginTop: 60,
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      padding: '20px',
      ...(style || {}) // Apply any style props passed from parent component
    }}>
      <h2 className="modern-gauge-heading" style={{
        textAlign: 'center',
        fontSize: '18px',
        marginBottom: '20px',
        color: '#333',
        fontWeight: '600'
      }}>
        Below Gross Profit Expenses
      </h2>
      
      {ledgerLabels.length > 0 ? (
        <>
          <ReactECharts 
            option={option} 
            style={{ height: 600 }} // Height of 600px for consistency with other charts
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
            Total Below GP Expenses
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
          <p>No expense data available for the selected periods.</p>
        </div>
      )}
    </div>
  );
};

export default BelowGPExpensesChart; 
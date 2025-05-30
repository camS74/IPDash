import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import './BarChart.css';

// Color scheme definitions (should match the config grid)
const colorSchemes = {
  blue: '#288cfa',
  green: '#2E865F',
  yellow: '#FFEA00',
  orange: '#FF9800',
  boldContrast: '#003366',
};
const salesVolumeColor = '#8e44ad'; // purple
const productionVolumeColor = '#ff9800'; // orange

// Debounce function to limit frequency of function calls
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const BarChart = ({ data, periods, basePeriod }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Test display of raw data
  console.log('BarChart received props:', {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    sampleData: data ? Object.entries(data).slice(0, 3) : [],
    periods,
    basePeriod,
    periodsLength: periods?.length,
    firstPeriod: periods?.[0],
    lastPeriod: periods?.[periods?.length - 1]
  });

  // Find base period index and value
  const baseIndex = periods.findIndex(
    p => `${p.year}-${p.month || 'Year'}-${p.type}` === basePeriod
  );
  const baseKey = basePeriod;
  const baseValue = data[baseKey]?.sales || 0;

  // Helper function to create period key that matches ChartContainer logic
  const createPeriodKey = (period) => {
    if (period.isCustomRange) {
      // For custom ranges, use the month field (which contains the CUSTOM_* ID)
      return `${period.year}-${period.month}-${period.type}`;
    } else {
      // For regular periods, use the standard format
      return `${period.year}-${period.month || 'Year'}-${period.type}`;
    }
  };

  // Function to initialize chart
  const initChart = () => {
    if (!chartRef.current || !data || !periods || periods.length === 0) return;

    // Dispose previous instance if it exists
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    try {
      console.log('Initializing chart with container dimensions:', {
        width: chartRef.current.clientWidth,
        height: chartRef.current.clientHeight
      });
      
      const myChart = echarts.init(chartRef.current);
      chartInstance.current = myChart;

        console.log('Rendering chart with data:', { data, periods, basePeriod });
        
        const periodLabels = periods.map(period => {
          if (period.isCustomRange) {
            // For custom ranges, use displayName for clean display
            return `${period.year}-${period.displayName}-${period.type}`;
          } else if (period.month) {
            return `${period.year}-${period.month}-${period.type}`;
          }
          return `${period.year}-${period.type}`;
        });
        
        const seriesData = periods.map(period => {
          // Use the same key format as in ChartContainer
          const periodKey = createPeriodKey(period);
          const value = data[periodKey]?.sales || 0;
          console.log(`Period ${periodKey}: ${value}`);
          return value;
        });

      // Sales Volume (row 7)
      const salesVolumeData = periods.map(period => {
        const periodKey = createPeriodKey(period);
        return data[periodKey]?.salesVolume || 0;
      });

      // Production Volume (row 8)
      const productionVolumeData = periods.map(period => {
        const periodKey = createPeriodKey(period);
        return data[periodKey]?.productionVolume || 0;
        });

        console.log('Chart series data:', seriesData);

      // Calculate % variance for each bar
      const percentVariance = seriesData.map((value, idx) => {
        if (baseValue === 0 || idx === baseIndex) return null;
        const pct = ((value - baseValue) / Math.abs(baseValue)) * 100;
        return pct;
      });

      // Get bar color for each column
      const barColors = periods.map((period, idx) => {
        if (periods[idx].customColor && colorSchemes[periods[idx].customColor]) {
          return colorSchemes[periods[idx].customColor];
        }
        // Default: highlight base period, otherwise green
        const periodKey = createPeriodKey(period);
        if (periodKey === basePeriod) {
          return '#5470c6';
        }
        return '#91cc75';
      });

      // Custom render for % variance and horizontal line
      const renderVariance = {
        type: 'group',
        children: periods.map((_, idx) => {
          if (idx === baseIndex) return { type: 'group', children: [] };
          const x = idx;
          const value = seriesData[idx];
          const pct = percentVariance[idx];
          if (pct === null || pct === undefined) return { type: 'group', children: [] };
          let color = '#888';
          if (pct > 0) color = '#2E865F';
          else if (pct < 0) color = '#dc3545';
          return {
            type: 'group',
            children: [
              // Horizontal line
              {
                type: 'rect',
                shape: { x: -20, y: 0, width: 40, height: 2 },
                style: { fill: color },
                position: [0, 0],
              },
              // % label
              {
                type: 'text',
                style: {
                  text: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`,
                  fill: color,
                  font: 'bold 16px sans-serif',
                  textAlign: 'center',
                  textVerticalAlign: 'bottom',
                },
                position: [0, -6],
              },
            ],
            position: [0, 0],
          };
        }),
      };

        // Set option
        myChart.setOption({
        title: {
          text: 'Sales and Volume',
          subtext: 'Overview\n(AED)',
          left: 'center',
          top: 0,
          textStyle: {
            fontSize: 22,
            fontWeight: 'bold'
            },
          subtextStyle: {
            fontSize: 18,
            lineHeight: 24,
            align: 'center',
            fontWeight: 'normal'
          }
        },
        legend: {
          show: false
    },
    grid: {
            left: '5%',
          right: '0%',
          bottom: 140,
          top: 25,
      containLabel: true
    },
    xAxis: {
      type: 'category',
            data: periodLabels,
          position: 'bottom',
            axisLabel: {
              rotate: 0,
            fontWeight: 'bold',
            fontSize: 18,
            color: '#000',
              formatter: function(value) {
                const parts = value.split('-');
                if (parts.length >= 3) {
                  const year = parts[0];
                  
                  // Check if this is a custom range (contains more than 3 parts due to hyphen in displayName)
                  if (parts.length > 3) {
                    // For custom ranges like "2025-Jan-Apr-Actual"
                    // Reconstruct the displayName and type
                    const displayName = parts.slice(1, -1).join('-'); // "Jan-Apr"
                    const type = parts[parts.length - 1]; // "Actual"
                    return `${year}\n${displayName}\n${type}`;
                  } else {
                    // Regular periods like "2025-Q1-Actual"
                    const month = parts[1];
                    const type = parts[2];
                    if (month === 'Year') {
                      return `${year}\n\n${type}`;
                    } else {
                      return `${year}\n${month}\n${type}`;
                    }
                  }
                }
                return value;
              },
              margin: 30,
            },
            axisLine: {
              lineStyle: {
                color: '#000',
                width: 2
              }
            },
            axisTick: {
              alignWithLabel: true,
              length: 4,
              lineStyle: {
                color: '#ccc'
                }
              }
    },
        yAxis: [
          {
      type: 'value',
            show: false,
            scale: true,
            max: function(value) {
              return value.max * 1.15;
              }
      }
        ],
    series: [
      {
            name: '',
              data: seriesData,
        type: 'bar',
            barMaxWidth: '70%',
            barWidth: '65%',
        itemStyle: {
                color: function(params) {
                return barColors[params.dataIndex];
        }
      },
              label: {
                show: true,
                position: 'top',
              fontWeight: 'bold',
              fontSize: 18,
              color: '#222',
                formatter: function(params) {
                  const value = params.value;
                  if (value >= 1000000) {
                    return (value / 1000000).toFixed(1) + 'M';
                  } else if (value >= 1000) {
                    return (value / 1000).toFixed(1) + 'K';
                  }
                  return value;
                }
            },
            emphasis: {
              focus: 'series'
            },
            z: 2
          },
          // Custom % variance (no line)
          {
            name: '',
            type: 'custom',
            renderItem: function(params, api) {
              const idx = api.value(0);
              if (idx === baseIndex) return null;
              const value = api.value(1);
              const pct = percentVariance[idx];
              if (pct === null || pct === undefined) return null;
              let color = '#888';
              if (pct > 0) color = '#2E865F';
              else if (pct < 0) color = '#dc3545';
              const x = api.coord([idx, value])[0];
              const y = api.coord([idx, value])[1];
              return {
                type: 'text',
                style: {
                  text: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`,
                  fill: color,
                  font: 'bold 16px sans-serif',
                  textAlign: 'center',
                  textVerticalAlign: 'bottom',
                },
                position: [x, y - 36],
              };
            },
            data: periods.map((_, idx) => [idx, seriesData[idx]]),
            z: 3
          },
        ],
        tooltip: {
          show: false, // Completely disable tooltips to prevent white panel
          trigger: 'none'
        },
        animation: false
      });

      // Force resize immediately and after a delay
      myChart.resize();
      setTimeout(() => {
        if (myChart && !myChart.isDisposed()) {
        myChart.resize();
        }
      }, 300);
        
      } catch (error) {
        console.error('Error rendering chart:', error);
        }
  };

  useEffect(() => {
    // Initialize only the main chart
    const timer = setTimeout(() => {
      initChart();
    }, 300);

    // Add window resize listener with debounce
    const handleResize = debounce(() => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    }, 100);
    
    window.addEventListener('resize', handleResize);

    // Force additional resize after component fully mounts
    const resizeTimer = setTimeout(() => {
      handleResize();
    }, 800);

    // Add a mutation observer to detect size changes in parent elements with debounce
    const debouncedResize = debounce(() => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    }, 100);
    
    const observer = new ResizeObserver(debouncedResize);
    
    if (chartRef.current) {
      observer.observe(chartRef.current.parentElement);
    }

    // Cleanup
    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [data, periods, basePeriod]);

  return (
    <div className="bar-chart-container" style={{ 
      position: 'relative', 
      width: '100%', 
      height: '900px', // Restore original height
      minHeight: '700px', // Restore original min-height
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '0px',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch'
    }}>
      {/* Chart area */}
      <div style={{ flex: 1, width: '100%', height: '100%', marginBottom: '-40px' }}>
      {periods && periods.length > 0 ? (
        <div 
          ref={chartRef} 
          className="bar-chart" 
          style={{ 
            width: '100%', 
            height: '100%'
          }} 
        />
      ) : (
        <div className="no-data-message" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: '#666',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          <div>
            <p>No periods visible in chart.</p>
            <p>Use the eye icons in Column Configuration to select which periods to display.</p>
          </div>
        </div>
      )}
      </div>
      
      {/* Volume legend and values */}
      <div style={{ 
        position: 'relative',
        marginTop: '-90px',
        width: '100%',
        height: '130px'
      }}>
        {/* Volume legend on the left */}
        <div style={{
          position: 'absolute',
          left: '30px',
          top: '25px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#8e44ad', borderRadius: '4px' }}></div>
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>Sales Volume</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#2E865F', borderRadius: '4px' }}></div>
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>Sales per Kg</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#ff9800', borderRadius: '4px' }}></div>
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>Production Volume</div>
          </div>
        </div>

        {/* Volume values aligned with bars */}
        <div style={{
          position: 'absolute',
          top: '25px',
          left: '220px',
          right: '0',
          display: 'grid',
          gridTemplateColumns: `repeat(${periods.length}, 1fr)`,
          gap: '0'
        }}>
          {/* Sales Volume row */}
          <div style={{
            gridColumn: '1 / span ' + periods.length,
            display: 'grid',
            gridTemplateColumns: `repeat(${periods.length}, 1fr)`,
            marginBottom: '10px'
          }}>
            {periods.map((period, idx) => {
              const periodKey = createPeriodKey(period);
              const value = data[periodKey]?.salesVolume || 0;
              const mtValue = Math.round(value / 1000);
              return (
                <div key={`salesvol-${idx}`} style={{ 
                  color: '#8e44ad', 
                  fontWeight: 'bold', 
                  textAlign: 'center', 
                  fontSize: 18
                }}>
                  {mtValue.toLocaleString()} MT
                </div>
              );
            })}
          </div>
          
          {/* Sales per Kg row */}
          <div style={{
            gridColumn: '1 / span ' + periods.length,
            display: 'grid',
            gridTemplateColumns: `repeat(${periods.length}, 1fr)`,
            marginBottom: '10px'
          }}>
            {periods.map((period, idx) => {
              const periodKey = createPeriodKey(period);
              const salesValue = data[periodKey]?.sales || 0;
              const salesVolumeValue = data[periodKey]?.salesVolume || 0;
              // Calculate Sales per Kg (divide sales by sales volume)
              let salesPerKg = 0;
              if (salesVolumeValue > 0) {
                salesPerKg = salesValue / salesVolumeValue;
              }
              return (
                <div key={`salespkg-${idx}`} style={{ 
                  color: '#2E865F', 
                  fontWeight: 'bold', 
                  textAlign: 'center', 
                  fontSize: 18
                }}>
                  {salesPerKg.toFixed(2)}
                </div>
              );
            })}
          </div>
          
          {/* Production Volume row */}
          <div style={{
            gridColumn: '1 / span ' + periods.length,
            display: 'grid',
            gridTemplateColumns: `repeat(${periods.length}, 1fr)`,
          }}>
            {periods.map((period, idx) => {
              const periodKey = createPeriodKey(period);
              const value = data[periodKey]?.productionVolume || 0;
              const mtValue = Math.round(value / 1000);
              return (
                <div key={`prodvol-${idx}`} style={{ 
                  color: '#ff9800', 
                  fontWeight: 'bold', 
                  textAlign: 'center', 
                  fontSize: 18
                }}>
                  {mtValue.toLocaleString()} MT
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChart; 
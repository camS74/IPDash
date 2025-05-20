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
        if (period.month) {
          return `${period.year}-${period.month}-${period.type}`;
        }
        return `${period.year}-${period.type}`;
      });
      
      const seriesData = periods.map(period => {
        // Use the same key format as in ChartContainer
        const periodKey = `${period.year}-${period.month || 'Year'}-${period.type}`;
        const value = data[periodKey]?.sales || 0;
        console.log(`Period ${periodKey}: ${value}`);
        return value;
      });

      // Sales Volume (row 7)
      const salesVolumeData = periods.map(period => {
        const periodKey = `${period.year}-${period.month || 'Year'}-${period.type}`;
        return data[periodKey]?.salesVolume || 0;
      });

      // Production Volume (row 8)
      const productionVolumeData = periods.map(period => {
        const periodKey = `${period.year}-${period.month || 'Year'}-${period.type}`;
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
        if (`${period.year}-${period.month || 'Year'}-${period.type}` === basePeriod) {
          return '#5470c6';
        }
        return '#91cc75';
      });

      // Prepare formatted volume labels for each bar (in MT, no decimals)
      const volumeLabels = periods.map((period, idx) => {
        const periodKey = `${period.year}-${period.month || 'Year'}-${period.type}`;
        const salesVolume = data[periodKey]?.salesVolume || 0;
        const productionVolume = data[periodKey]?.productionVolume || 0;
        // Divide by 1000 and format as integer with thousands separator
        const salesVolumeStr = Math.round(salesVolume / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const productionVolumeStr = Math.round(productionVolume / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 });
        return {
          salesVolumeStr,
          productionVolumeStr
        };
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
          text: 'Sales and Volume Overview',
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        legend: {
          show: false
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: 90,
          top: 100,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: periodLabels,
          axisLabel: {
            rotate: 0,
            fontWeight: 'bold',
            fontSize: 18,
            formatter: function(value) {
              const parts = value.split('-');
              if (parts.length >= 3) {
                const year = parts[0];
                const month = parts[1];
                const type = parts[2];
                if (month === 'Year') {
                  return `${year} ${type}`;
                } else {
                  return `${year} ${month} ${type}`;
                }
              }
              return value;
            },
            margin: 30
          }
        },
        yAxis: [
          {
            type: 'value',
            show: false,
            scale: true,
            max: function(value) {
              return value.max * 1.35;
            }
          }
        ],
        series: [
          {
            name: '',
            data: seriesData,
            type: 'bar',
            barMaxWidth: '50%',
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
          // Custom volume values only (no labels)
          {
            name: '',
            type: 'custom',
            renderItem: function(params, api) {
              const idx = api.value(0);
              const x = api.coord([idx, 0])[0];
              const y = api.getHeight() - 55;
              const { salesVolumeStr, productionVolumeStr } = volumeLabels[idx];
              const fontSize = Math.max(14, Math.min(22, Math.floor(api.getWidth() / (periods.length * 6))));
              return {
                type: 'group',
                position: [x, y],
                children: [
                  // Sales Volume value
                  {
                    type: 'text',
                    style: {
                      text: salesVolumeStr + ' MT',
                      fill: '#8e44ad',
                      font: `bold ${fontSize}px sans-serif`,
                      textAlign: 'center',
                      textVerticalAlign: 'top',
                    },
                    position: [0, 0]
                  },
                  // Production Volume value
                  {
                    type: 'text',
                    style: {
                      text: productionVolumeStr + ' MT',
                      fill: '#ff9800',
                      font: `bold ${fontSize}px sans-serif`,
                      textAlign: 'center',
                      textVerticalAlign: 'top',
                    },
                    position: [0, fontSize + 4]
                  }
                ]
              };
            },
            data: periods.map((_, idx) => [idx, 0]),
            z: 10
          }
        ],
        tooltip: {
          show: false
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
    // Initialize chart with a longer delay to ensure DOM is ready
    const timer = setTimeout(initChart, 300);

    // Add window resize listener
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Force additional resize after component fully mounts
    const resizeTimer = setTimeout(() => {
      handleResize();
    }, 800);

    // Add a mutation observer to detect size changes in parent elements
    const observer = new ResizeObserver(() => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    });
    
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
      height: '500px',
      minHeight: '400px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '20px',
      margin: '10px 0'
    }}>
      {/* Sales Volume label - exact positioning */}
      <div
        style={{
          position: 'absolute',
          left: 5,
          bottom: 58,
          width: 140,
          textAlign: 'right',
          zIndex: 20,
          pointerEvents: 'none',
          fontWeight: 'bold',
          color: '#5066d8',
          fontSize: 18,
          lineHeight: '18px',
          whiteSpace: 'nowrap'
        }}
      >
        Sales Volume
      </div>
      
      {/* Production Volume label - exact positioning */}
      <div
        style={{
          position: 'absolute',
          left: 5,
          bottom: 28,
          width: 140,
          textAlign: 'right',
          zIndex: 20,
          pointerEvents: 'none',
          fontWeight: 'bold',
          color: '#ff9800',
          fontSize: 18,
          lineHeight: '18px',
          whiteSpace: 'nowrap'
        }}
      >
        Production Volume
      </div>
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
  );
};

export default BarChart; 
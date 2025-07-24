import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const PerformanceDashboard = ({ reportData }) => {
  const [activeTab, setActiveTab] = useState('yoy-growth');
  const yoyChartRef = useRef(null);
  const budgetChartRef = useRef(null);
  const yoyChartInstance = useRef(null);
  const budgetChartInstance = useRef(null);

  useEffect(() => {
    if (reportData && reportData.productGroups) {
      createYoYGrowthChart();
      createBudgetAchievementChart();
    }

    return () => {
      // Cleanup charts on unmount
      if (yoyChartInstance.current) {
        yoyChartInstance.current.destroy();
      }
      if (budgetChartInstance.current) {
        budgetChartInstance.current.destroy();
      }
    };
  }, [reportData]);

  const createYoYGrowthChart = () => {
    if (!yoyChartRef.current || !reportData.productGroups) return;

    // Destroy existing chart
    if (yoyChartInstance.current) {
      yoyChartInstance.current.destroy();
    }

    const ctx = yoyChartRef.current.getContext('2d');
    
    // Prepare data for YoY Growth chart
    const productGroups = reportData.productGroups.filter(pg => pg.totalKGS > 0);
    const labels = productGroups.map(pg => pg.productGroup);
    const currentData = productGroups.map(pg => pg.totalKGS || 0);
    const previousData = productGroups.map(pg => {
      // Find previous period data
      const prevPeriod = reportData.productGroups.find(p => 
        p.productGroup === pg.productGroup && p.period === (reportData.basePeriod - 1)
      );
      return prevPeriod?.totalKGS || 0;
    });

    // Calculate YoY growth percentages
    const yoyGrowthData = productGroups.map((pg, index) => {
      const current = currentData[index];
      const previous = previousData[index];
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    });

    yoyChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: `${reportData.basePeriod} Volume (kg)`,
          data: currentData,
          backgroundColor: '#3498db',
          borderWidth: 1,
          yAxisID: 'y'
        }, {
          label: `${reportData.basePeriod - 1} Volume (kg)`,
          data: previousData,
          backgroundColor: '#95a5a6',
          borderWidth: 1,
          yAxisID: 'y'
        }, {
          label: 'YoY Growth %',
          data: yoyGrowthData,
          type: 'line',
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          borderWidth: 3,
          fill: false,
          yAxisID: 'y1',
          pointBackgroundColor: '#e74c3c',
          pointBorderColor: '#e74c3c',
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Product Categories'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Volume (kg)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'YoY Growth %'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Year-over-Year Volume Growth Analysis'
          },
          legend: {
            display: true,
            position: 'top'
          },
          datalabels: {
            display: false // Disable for this chart to avoid clutter
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  };

  const createBudgetAchievementChart = () => {
    if (!budgetChartRef.current || !reportData.productGroups) return;

    // Destroy existing chart
    if (budgetChartInstance.current) {
      budgetChartInstance.current.destroy();
    }

    const ctx = budgetChartRef.current.getContext('2d');
    
    // Prepare data for Budget Achievement chart
    const productGroups = reportData.productGroups.filter(pg => pg.totalKGS > 0);
    const labels = productGroups.map(pg => pg.productGroup);
    const actualData = productGroups.map(pg => pg.totalKGS || 0);
    const budgetData = productGroups.map(pg => {
      // Find budget period data
      const budgetPeriod = reportData.productGroups.find(p => 
        p.productGroup === pg.productGroup && p.period === (reportData.basePeriod + 1)
      );
      return budgetPeriod?.totalKGS || 0;
    });

    // Calculate achievement percentages
    const achievementData = productGroups.map((pg, index) => {
      const actual = actualData[index];
      const budget = budgetData[index];
      if (budget === 0) return 0;
      return (actual / budget) * 100;
    });

    budgetChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Budget Achievement %',
          data: achievementData,
          backgroundColor: function(context) {
            const value = context.parsed.y;
            if (value >= 25) return '#2ecc71';
            if (value >= 15) return '#f39c12';
            return '#e74c3c';
          },
          borderWidth: 1
        }, {
          label: '25% Target Line',
          data: new Array(labels.length).fill(25),
          type: 'line',
          borderColor: '#27ae60',
          backgroundColor: 'rgba(39, 174, 96, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Product Categories'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Achievement %'
            },
            max: Math.max(100, Math.max(...achievementData) + 10)
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Budget Achievement by Product Category'
          },
          legend: {
            display: true,
            position: 'top'
          },
          datalabels: {
            align: function(context) {
              const value = context.dataset.data[context.dataIndex];
              return value >= 25 ? 'center' : 'end';
            },
            anchor: function(context) {
              const value = context.dataset.data[context.dataIndex];
              return value >= 25 ? 'center' : 'end';
            },
            formatter: function(value, context) {
              // Only show labels for the bar dataset, not the line
              if (context.datasetIndex === 0) {
                return Math.round(value) + '%';
              } else {
                return null;
              }
            },
            color: function(context) {
              const value = context.dataset.data[context.dataIndex];
              return value >= 25 ? '#fff' : '#333';
            },
            font: {
              weight: 'bold'
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  };

  const openTab = (tabName) => {
    setActiveTab(tabName);
  };

  if (!reportData) {
    return <div>Loading performance dashboard...</div>;
  }

  return (
    <div className="section">
      <h2>2. Performance Dashboard</h2>
      <div className="tab-container">
        <p className="tab-instructions">Click on the tabs below to switch between different performance views</p>
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'yoy-growth' ? 'active' : ''}`}
            onClick={() => openTab('yoy-growth')}
          >
            YoY Growth View
          </button>
          <button 
            className={`tab-button ${activeTab === 'budget-achievement' ? 'active' : ''}`}
            onClick={() => openTab('budget-achievement')}
          >
            Budget Achievement View
          </button>
        </div>
        
        <div 
          id="yoy-growth" 
          className={`tab-content ${activeTab === 'yoy-growth' ? 'active' : ''}`}
        >
          <div className="chart-container">
            <canvas ref={yoyChartRef} id="yoyGrowthChart"></canvas>
          </div>
        </div>
        
        <div 
          id="budget-achievement" 
          className={`tab-content ${activeTab === 'budget-achievement' ? 'active' : ''}`}
        >
          <div className="chart-container">
            <canvas ref={budgetChartRef} id="budgetAchievementChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;

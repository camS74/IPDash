import React from 'react';

const ProductPerformanceTable = ({ reportData }) => {
  if (!reportData || !reportData.productGroups) {
    return <div>No product performance data available.</div>;
  }

  const formatNumber = (num) => {
    return (num || 0).toLocaleString();
  };

  const formatPercentage = (num, showSign = false) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    const sign = showSign && num > 0 ? '+' : '';
    return `${sign}${Math.round(num)}%`;
  };

  const getPercentageClass = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return '';
  };

  // Get current period data
  const currentPeriodGroups = reportData.productGroups.filter(pg => 
    pg.period === reportData.basePeriod && (pg.totalKGS || 0) > 0
  );

  // Calculate YoY and Budget Achievement for each product group
  const enrichedGroups = currentPeriodGroups.map(currentPg => {
    // Find previous period data
    const previousPg = reportData.productGroups.find(pg => 
      pg.productGroup === currentPg.productGroup && pg.period === (reportData.basePeriod - 1)
    );
    
    // Find budget period data
    const budgetPg = reportData.productGroups.find(pg => 
      pg.productGroup === currentPg.productGroup && pg.period === (reportData.basePeriod + 1)
    );

    const currentKgs = currentPg.totalKGS || 0;
    const previousKgs = previousPg?.totalKGS || 0;
    const budgetKgs = budgetPg?.totalKGS || 0;

    // Calculate YoY Growth
    let yoyGrowth = 0;
    if (previousKgs > 0) {
      yoyGrowth = ((currentKgs - previousKgs) / previousKgs) * 100;
    } else if (currentKgs > 0) {
      yoyGrowth = 100; // New product
    }

    // Calculate Budget Achievement
    let budgetAchievement = 0;
    if (budgetKgs > 0) {
      budgetAchievement = (currentKgs / budgetKgs) * 100;
    }

    return {
      ...currentPg,
      previousKgs,
      budgetKgs,
      yoyGrowth,
      budgetAchievement
    };
  });

  // Sort by current volume descending
  enrichedGroups.sort((a, b) => (b.totalKGS || 0) - (a.totalKGS || 0));

  return (
    <div className="section">
      <h2>3. Detailed Performance Analysis</h2>
      <div className="table-container">
        <table className="performance-table">
          <thead>
            <tr>
              <th>Product Category</th>
              <th>{reportData.basePeriod - 1} (kg)</th>
              <th>YoY %</th>
              <th>{reportData.basePeriod} (kg)</th>
              <th>{reportData.basePeriod + 1} Budget (kg)</th>
              <th>Budget Achieved %</th>
            </tr>
          </thead>
          <tbody>
            {enrichedGroups.map((pg, index) => (
              <tr key={index}>
                <td>{pg.productGroup}</td>
                <td>{formatNumber(pg.previousKgs)}</td>
                <td className={getPercentageClass(pg.yoyGrowth)}>
                  {formatPercentage(pg.yoyGrowth, true)}
                </td>
                <td>{formatNumber(pg.totalKGS)}</td>
                <td>{pg.budgetKgs > 0 ? formatNumber(pg.budgetKgs) : '-'}</td>
                <td className={getPercentageClass(pg.budgetAchievement - 25)}>
                  {pg.budgetKgs > 0 ? formatPercentage(pg.budgetAchievement) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductPerformanceTable;

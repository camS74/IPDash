import React from 'react';

const PROFIT_KPIS = [
  { label: 'Net Profit', rowIndex: 54 },
  { label: 'EBITDA', rowIndex: 56 },
];
const cardColors = ['#288cfa', '#2E865F', '#FF9800', '#003366', '#FFCC33'];
const textColors = ['#fff', '#fff', '#fff', '#fff', '#333'];

function calcVariance(current, prev) {
  if (prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

const Profitchart = ({ tableData, selectedPeriods, computeCellValue, style }) => {
  if (!selectedPeriods || selectedPeriods.length === 0 || typeof computeCellValue !== 'function') {
    return (
      <div className="modern-margin-gauge-panel" style={{ marginTop: 60, padding: 20, textAlign: 'center' }}>
        <h2 className="modern-gauge-heading">Profit Trend</h2>
        <p>No data available. Please select a period.</p>
      </div>
    );
  }

  const periodsToUse = selectedPeriods.slice(0, 5);

  const processedData = selectedPeriods.map(period => {
    // Sales row calculation
    const sales = computeCellValue(3, period);

    const profitAfterSG = computeCellValue(18, period);
    const financeCost = computeCellValue(20, period);
    const otherIncome = computeCellValue(19, period);
    const netProfit = profitAfterSG - financeCost + otherIncome;

    return {
      sales,
      profitAfterSG,
      financeCost,
      otherIncome,
      netProfit,
      periodName: `${period.year} ${period.isCustomRange ? period.displayName : (period.month || '')} ${period.type}`.trim(),
      period
    };
  });

  return (
    <div className="modern-margin-gauge-panel" style={{
      marginTop: 60,
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      padding: '20px',
      ...(style || {})
    }}>
      {PROFIT_KPIS.map((kpi, rowIdx) => {
        // Build cards for this KPI
        const cards = periodsToUse.map((period, idx) => {
          const value = computeCellValue(kpi.rowIndex, period);
          const sales = computeCellValue(3, period);
          const salesVolume = computeCellValue(7, period);
          const percentOfSales = (typeof sales === 'number' && sales !== 0) ? (value / sales) * 100 : 0;
          const perKg = (typeof salesVolume === 'number' && salesVolume !== 0) ? value / salesVolume : 0;
          return {
            periodName: `${period.year} ${period.isCustomRange ? period.displayName : (period.month || '')} ${period.type}`.trim(),
            value: typeof value === 'number' && !isNaN(value) ? value : 0,
            percentOfSales: percentOfSales,
            perKg: perKg,
            color: cardColors[idx % cardColors.length],
            textColor: textColors[idx % textColors.length],
          };
        });
        // Calculate variances between cards
        const variances = cards.map((card, idx) => {
          if (idx === 0) return null;
          return calcVariance(card.value, cards[idx - 1].value);
        });
        return (
          <div key={kpi.label} style={{ marginBottom: rowIdx === 0 ? 40 : 0 }}>
            <h2 className="modern-gauge-heading" style={{
              textAlign: 'center',
              fontSize: '18px',
              marginBottom: '20px',
              color: '#333',
              fontWeight: '600'
            }}>{kpi.label} Trend</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'nowrap',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: '4px',
              marginTop: 10,
              marginBottom: 0,
              width: '100%',
              overflowX: 'auto',
              padding: '0 16px',
            }}>
              {cards.map((card, idx) => (
                <React.Fragment key={card.periodName}>
                  {/* Card */}
                  <div style={{
                    padding: '12px 15px',
                    borderRadius: '6px',
                    backgroundColor: card.color,
                    border: `1px solid ${card.color}`,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
                    minWidth: '180px',
                    maxWidth: '180px',
                    width: '180px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    color: card.textColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: '0 0 200px',
                  }}>
                    <div style={{ fontSize: 14, color: card.textColor, fontWeight: 500, marginTop: 4 }}>{card.periodName}</div>
                    <div style={{ fontWeight: 'bold', fontSize: 22, color: card.textColor, marginTop: 8 }}>
                      {card.value ? (card.value / 1000000).toFixed(2) + 'M' : '0.00M'}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: card.textColor,
                      marginTop: 8,
                      width: '100%'
                    }}>
                      <div>{card.percentOfSales.toFixed(1)}%/Sls</div>
                      <div>{card.perKg.toFixed(1)} per kg</div>
                    </div>
                  </div>
                  {/* Variance badge between cards */}
                  {idx < cards.length - 1 && (
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
                      {variances[idx + 1] === null || isNaN(variances[idx + 1]) ? (
                        <span style={{ color: '#888', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>N/A</span>
                      ) : (
                        <>
                          <span style={{
                            fontSize: 22,
                            fontWeight: 'bold',
                            color: variances[idx + 1] > 0 ? '#2E865F' : variances[idx + 1] < 0 ? '#cf1322' : '#888',
                            lineHeight: 1,
                          }}>
                            {variances[idx + 1] > 0 ? '▲' : variances[idx + 1] < 0 ? '▼' : '–'}
                          </span>
                          <span style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: variances[idx + 1] > 0 ? '#2E865F' : variances[idx + 1] < 0 ? '#cf1322' : '#888',
                            lineHeight: 1.1,
                          }}>
                            {Math.abs(variances[idx + 1]).toFixed(1)}
                          </span>
                          <span style={{
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: variances[idx + 1] > 0 ? '#2E865F' : variances[idx + 1] < 0 ? '#cf1322' : '#888',
                            lineHeight: 1.1,
                          }}>
                            %
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Profitchart; 
import React from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useFilter } from '../../contexts/FilterContext';
import { computeCellValue } from '../../utils/computeCellValue';

const divisionNames = {
  'FP': 'Flexible Packaging',
  'SB': 'Shopping Bags',
  'TF': 'Thermoforming Products',
  'HCM': 'Preforms and Closures'
};

const KPIExecutiveSummary = () => {
  const { excelData, selectedDivision } = useExcelData();
  const { columnOrder, basePeriodIndex } = useFilter();
  if (!selectedDivision || !excelData[selectedDivision] || !columnOrder.length || basePeriodIndex == null) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>No data available. Please select a division and base period.</div>;
  }
  const divisionData = excelData[selectedDivision];
  const basePeriod = columnOrder[basePeriodIndex];
  const basePeriodName = basePeriod ? `${basePeriod.year} ${basePeriod.isCustomRange ? basePeriod.displayName : (basePeriod.month || '')} ${basePeriod.type}`.trim() : '';
  const comparisonPeriod = basePeriodIndex > 0 ? columnOrder[basePeriodIndex - 1] : null;
  // Financials
  const get = (row, col) => computeCellValue(divisionData, row, col);
  const sales = get(3, basePeriod);
  const grossProfit = get(4, basePeriod);
  const netProfit = get(54, basePeriod);
  const ebitda = get(56, basePeriod);
  const salesPrev = comparisonPeriod ? get(3, comparisonPeriod) : null;
  const grossProfitPrev = comparisonPeriod ? get(4, comparisonPeriod) : null;
  const netProfitPrev = comparisonPeriod ? get(54, comparisonPeriod) : null;
  const ebitdaPrev = comparisonPeriod ? get(56, comparisonPeriod) : null;
  const grossMargin = sales > 0 ? grossProfit / sales : 0;
  const netMargin = sales > 0 ? netProfit / sales : 0;
  const ebitdaMargin = sales > 0 ? ebitda / sales : 0;
  const growth = (curr, prev) => prev && prev !== 0 ? ((curr - prev) / Math.abs(prev) * 100).toFixed(1) + '%' : '';
  const formatM = v => v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v.toLocaleString();
  const percent = v => (v * 100).toFixed(1) + '%';
  // Product Performance
  const productSheetName = selectedDivision.replace(/-.*$/, '') + '-Product Group';
  const productData = excelData[productSheetName] || [];
  let productSales = [];
  if (productData.length > 0 && basePeriod) {
    for (let row = 3; row < productData.length; row++) {
      const name = productData[row][0];
      let sum = 0;
      for (let c = 4; c < productData[0].length; c++) {
        const year = productData[0][c];
        const month = productData[1][c];
        const type = productData[2][c];
        if (year == basePeriod.year && basePeriod.months.includes(month) && type === basePeriod.type) {
          const v = parseFloat(productData[row][c]);
          if (!isNaN(v)) sum += v;
        }
      }
      if (name && sum > 0) productSales.push({ name, value: sum });
    }
  }
  productSales.sort((a, b) => b.value - a.value);
  const topProduct = productSales[0] ? productSales[0].name : '-';
  const productCount = productSales.length;
  const productDiversity = productCount > 5 ? 'High' : productCount >= 3 ? 'Moderate' : 'Low';
  // Geographic Distribution
  const countrySheetName = selectedDivision.replace(/-.*$/, '') + '-Countries';
  const countryData = excelData[countrySheetName] || [];
  let countrySales = [];
  if (countryData.length > 0 && basePeriod) {
    for (let row = 3; row < countryData.length; row++) {
      const name = countryData[row][0];
      let sum = 0;
      for (let c = 4; c < countryData[0].length; c++) {
        const year = countryData[0][c];
        const month = countryData[1][c];
        const type = countryData[2][c];
        if (year == basePeriod.year && basePeriod.months.includes(month) && type === basePeriod.type) {
          const v = parseFloat(countryData[row][c]);
          if (!isNaN(v)) sum += v;
        }
      }
      if (name && sum > 0) countrySales.push({ name, value: sum });
    }
  }
  const totalCountrySales = countrySales.reduce((a, b) => a + b.value, 0);
  countrySales.forEach(cs => cs.percent = totalCountrySales > 0 ? (cs.value / totalCountrySales * 100) : 0);
  countrySales.sort((a, b) => b.percent - a.percent);
  const topCountries = countrySales.slice(0, 3);
  const top3Concentration = topCountries.reduce((a, b) => a + b.percent, 0).toFixed(1) + '%';
  // Customer Insights
  const customerSheetName = selectedDivision.replace(/-.*$/, '') + '-Customers';
  const customerData = excelData[customerSheetName] || [];
  let customerSales = [];
  if (customerData.length > 0 && basePeriod) {
    for (let row = 3; row < customerData.length; row++) {
      const name = customerData[row][0];
      let sum = 0;
      for (let c = 4; c < customerData[0].length; c++) {
        const year = customerData[0][c];
        const month = customerData[1][c];
        const type = customerData[2][c];
        if (year == basePeriod.year && basePeriod.months.includes(month) && type === basePeriod.type) {
          const v = parseFloat(customerData[row][c]);
          if (!isNaN(v)) sum += v;
        }
      }
      if (name && sum > 0) customerSales.push({ name, value: sum });
    }
  }
  const totalCustomerSales = customerSales.reduce((a, b) => a + b.value, 0);
  customerSales.forEach(cs => cs.percent = totalCustomerSales > 0 ? (cs.value / totalCustomerSales * 100) : 0);
  customerSales.sort((a, b) => b.percent - a.percent);
  const topCustomer = customerSales[0] ? customerSales[0].percent.toFixed(1) + '%' : '-';
  const top3Customer = customerSales.slice(0, 3).reduce((a, b) => a + b.percent, 0).toFixed(1) + '%';
  const top5Customer = customerSales.slice(0, 5).reduce((a, b) => a + b.percent, 0).toFixed(1) + '%';
  const customerDiversity = customerSales.length > 5 ? 'Good' : customerSales.length >= 3 ? 'Moderate' : 'Low';
  // Render
  return (
    <div className="kpi-dashboard" style={{ padding: 24 }}>
      <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 22, marginBottom: 24 }}>
        Executive Summary – {divisionNames[selectedDivision.replace(/-.*$/, '')] || selectedDivision} {basePeriodName}
      </h2>
      {/* Financial Performance */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">💰 Financial Performance</h3>
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-icon">📈</div><div className="kpi-label">Revenue</div><div className="kpi-value">{formatM(sales)}</div><div className="kpi-trend">{growth(sales, salesPrev)}</div></div>
          <div className="kpi-card"><div className="kpi-icon">💵</div><div className="kpi-label">Gross Profit</div><div className="kpi-value">{formatM(grossProfit)}</div><div className="kpi-trend">{percent(grossMargin)}</div></div>
          <div className="kpi-card"><div className="kpi-icon">💎</div><div className="kpi-label">Net Income</div><div className="kpi-value">{formatM(netProfit)}</div><div className="kpi-trend">{percent(netMargin)}</div></div>
          <div className="kpi-card"><div className="kpi-icon">⚡</div><div className="kpi-label">EBITDA</div><div className="kpi-value">{formatM(ebitda)}</div><div className="kpi-trend">{percent(ebitdaMargin)}</div></div>
        </div>
      </div>
      {/* Product Performance */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">📦 Product Performance</h3>
        <div className="kpi-cards">
          <div className="kpi-card large"><div className="kpi-icon">🏆</div><div className="kpi-label">Top Product Group</div><div className="kpi-value">{topProduct}</div><div className="kpi-trend">Leading performer</div></div>
          <div className="kpi-card"><div className="kpi-icon">📈</div><div className="kpi-label">Product Groups</div><div className="kpi-value">{productCount}</div><div className="kpi-trend">active groups</div></div>
          <div className="kpi-card"><div className="kpi-icon">🌟</div><div className="kpi-label">Portfolio Diversity</div><div className="kpi-value">{productDiversity}</div><div className="kpi-trend">diversification</div></div>
        </div>
      </div>
      {/* Geographic Distribution */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">🌍 Geographic Distribution</h3>
        <div className="kpi-cards">
          <div className="kpi-card large"><div className="kpi-icon">🥇</div><div className="kpi-label">Top Market</div><div className="kpi-value">{topCountries[0] ? topCountries[0].name : '-'}</div><div className="kpi-trend">{topCountries[0] ? topCountries[0].percent.toFixed(1) + '%' : '-'}</div></div>
          <div className="kpi-card"><div className="kpi-icon">🥈</div><div className="kpi-label">2nd Market</div><div className="kpi-value">{topCountries[1] ? topCountries[1].name : '-'}</div><div className="kpi-trend">{topCountries[1] ? topCountries[1].percent.toFixed(1) + '%' : '-'}</div></div>
          <div className="kpi-card"><div className="kpi-icon">🥉</div><div className="kpi-label">3rd Market</div><div className="kpi-value">{topCountries[2] ? topCountries[2].name : '-'}</div><div className="kpi-trend">{topCountries[2] ? topCountries[2].percent.toFixed(1) + '%' : '-'}</div></div>
          <div className="kpi-card"><div className="kpi-icon">🎯</div><div className="kpi-label">Top 3 Concentration</div><div className="kpi-value">{top3Concentration}</div><div className="kpi-trend">of total sales</div></div>
        </div>
      </div>
      {/* Customer Insights */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">👥 Customer Insights</h3>
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-icon">⭐</div><div className="kpi-label">Top Customer</div><div className="kpi-value">{topCustomer}</div><div className="kpi-trend">of total sales</div></div>
          <div className="kpi-card"><div className="kpi-icon">🔝</div><div className="kpi-label">Top 3 Customers</div><div className="kpi-value">{top3Customer}</div><div className="kpi-trend">concentration</div></div>
          <div className="kpi-card"><div className="kpi-icon">📊</div><div className="kpi-label">Top 5 Customers</div><div className="kpi-value">{top5Customer}</div><div className="kpi-trend">concentration</div></div>
          <div className="kpi-card"><div className="kpi-icon">🎨</div><div className="kpi-label">Customer Diversity</div><div className="kpi-value">{customerDiversity}</div><div className="kpi-trend">distribution</div></div>
        </div>
      </div>
    </div>
  );
};

export default KPIExecutiveSummary; 
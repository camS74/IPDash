import React from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useFilter } from '../../contexts/FilterContext';
import { computeCellValue } from '../../utils/computeCellValue';
import './KPIExecutiveSummary.css';
import { getRegionForCountry } from './CountryReference';

const divisionNames = {
  'FP': 'Flexible Packaging',
  'SB': 'Shopping Bags',
  'TF': 'Thermoforming Products',
  'HCM': 'Harwal Container Manufacturing'
};

// Country name patterns for fuzzy matching
const countryPatterns = {
  'uae': ['emirates', 'uae'],
  'saudi': ['saudi', 'ksa', 'kingdom of saudi'],
  'uk': ['united kingdom', 'uk', 'britain'],
  'usa': ['united states', 'usa', 'america'],
  'drc': ['democratic republic', 'congo'],
  'ivory': ['ivory', 'cote d\'ivoire'],
  'tanzania': ['tanzania']
};

// Utility function to convert a string to Proper Case
function toProperCase(name) {
  return name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

const KPIExecutiveSummary = () => {
  const { excelData, selectedDivision } = useExcelData();
  const { salesData } = useSalesData();
  const { columnOrder, basePeriodIndex } = useFilter();
  
  // Enhanced defensive checks
  if (!Array.isArray(columnOrder) || columnOrder.length === 0) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>No data available. Please select periods in the Period Configuration.</div>;
  }
  
  if (basePeriodIndex == null || basePeriodIndex >= columnOrder.length) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>No base period selected. Please select a base period (★) in the Period Configuration.</div>;
  }
  
  const basePeriod = columnOrder[basePeriodIndex];
  if (!basePeriod) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Invalid base period. Please select a valid period.</div>;
  }
  
  if (!basePeriod.months || !Array.isArray(basePeriod.months)) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Base period configuration is incomplete. Please reconfigure your periods.</div>;
  }

  const divisionData = excelData[selectedDivision];
  const basePeriodName = basePeriod ? `${basePeriod.year} ${basePeriod.isCustomRange ? basePeriod.displayName : (basePeriod.month || '')} ${basePeriod.type}`.trim() : '';
  const comparisonPeriod = basePeriodIndex > 0 ? columnOrder[basePeriodIndex - 1] : null;
  const comparisonPeriodName = comparisonPeriod ? `${comparisonPeriod.year} ${comparisonPeriod.isCustomRange ? comparisonPeriod.displayName : (comparisonPeriod.month || '')} ${comparisonPeriod.type}`.trim() : '';
  // Financials
  const get = (row, col) => computeCellValue(divisionData, row, col);
  const sales = get(3, basePeriod);
  const grossProfit = get(19, basePeriod);
  const netProfit = get(54, basePeriod);
  const ebitda = get(56, basePeriod);
  const salesPrev = comparisonPeriod ? get(3, comparisonPeriod) : null;
  const grossProfitPrev = comparisonPeriod ? get(19, comparisonPeriod) : null;
  const netProfitPrev = comparisonPeriod ? get(54, comparisonPeriod) : null;
  const ebitdaPrev = comparisonPeriod ? get(56, comparisonPeriod) : null;
  const grossMargin = sales > 0 ? grossProfit / sales : 0;
  const netMargin = sales > 0 ? netProfit / sales : 0;
  const ebitdaMargin = sales > 0 ? ebitda / sales : 0;
  const growth = (curr, prev) => {
    if (!prev || prev === 0 || !comparisonPeriodName) return '';
    const growthPercent = ((curr - prev) / Math.abs(prev) * 100).toFixed(0);
    const isPositive = growthPercent > 0;
    const arrow = isPositive ? '▲' : '▼';
    const direction = isPositive ? 'Growth' : 'Decline';
    return (
      <span>
        <span className={isPositive ? 'arrow-positive' : 'arrow-negative'}>{arrow} {Math.abs(growthPercent)}%</span> {direction} Vs Previous Period
      </span>
    );
  };
  const formatM = v => {
    if (v == null || v === '') return '0.00M';
    const num = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : v;
    if (isNaN(num)) return '0.00M';
    return (num / 1e6).toFixed(2) + 'M';
  };
  const percent = v => (v * 100).toFixed(1) + '%';
  // Product Performance
  const productSheetName = selectedDivision.replace(/-.*$/, '') + '-Product Group';
  const productData = salesData[productSheetName] || [];
  let productSales = [];
  let productKgs = [];
  let productMoRM = [];
  
  console.log('KPI Debug - selectedDivision:', selectedDivision);
  console.log('KPI Debug - productSheetName:', productSheetName);
  console.log('KPI Debug - productData length:', productData.length);
  console.log('KPI Debug - basePeriod:', basePeriod);
  console.log('KPI Debug - salesData keys:', Object.keys(salesData));
  
  if (productData.length > 0 && basePeriod) {
    // Process all product rows to extract data
    for (let row = 3; row < productData.length; row++) {
      const productName = productData[row][0];
      const material = productData[row][1];
      const process = productData[row][2];
      const figuresHead = productData[row][3];
      
      // Filter out invalid product groups
      const invalidCategories = ['Others', 'Raw Materials', 'N/A', 'others', 'raw materials', 'n/a'];
      if (!productName || !figuresHead || 
          invalidCategories.includes(productName) ||
          invalidCategories.includes(productName.toLowerCase())) continue;
      
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
      
      if (sum > 0) {
        if (figuresHead.toLowerCase().includes('sales')) {
          let existing = productSales.find(p => p.name === productName);
          if (!existing) {
            productSales.push({ name: productName, value: sum, material, process });
          } else {
            existing.value += sum;
          }
        } else if (figuresHead.toLowerCase().includes('kgs')) {
          let existing = productKgs.find(p => p.name === productName);
          if (!existing) {
            productKgs.push({ name: productName, value: sum, material, process });
          } else {
            existing.value += sum;
          }
        } else if (figuresHead.toLowerCase().includes('morm')) {
          let existing = productMoRM.find(p => p.name === productName);
          if (!existing) {
            productMoRM.push({ name: productName, value: sum, material, process });
          } else {
            existing.value += sum;
          }
        }
      }
    }
  }
  
  // Calculate KPIs
  productSales.sort((a, b) => b.value - a.value);
  const topProduct = productSales[0] ? productSales[0].name : '-';
  const topProductSales = productSales[0] ? productSales[0].value : 0;
  const totalProductSales = productSales.reduce((sum, p) => sum + p.value, 0);
  const topProductPercent = totalProductSales > 0 ? (topProductSales / totalProductSales * 100).toFixed(1) + '% of sales' : '';
  
  // Calculate growth for each product to find top performers in growth
  const productGrowth = [];
  if (comparisonPeriod && productData.length > 0) {
    productSales.forEach(product => {
      // Get previous period sales for this product
      let prevSales = 0;
      for (let row = 3; row < productData.length; row++) {
        const productName = productData[row][0];
        const figuresHead = productData[row][3];
        
        if (productName === product.name && figuresHead && figuresHead.toLowerCase().includes('sales')) {
          for (let c = 4; c < productData[0].length; c++) {
            const year = productData[0][c];
            const month = productData[1][c];
            const type = productData[2][c];
            if (year == comparisonPeriod.year && comparisonPeriod.months.includes(month) && type === comparisonPeriod.type) {
              const v = parseFloat(productData[row][c]);
              if (!isNaN(v)) prevSales += v;
            }
          }
        }
      }
      
      if (prevSales > 0) {
        const growthPercent = ((product.value - prevSales) / prevSales) * 100;
        productGrowth.push({ 
          name: product.name, 
          growth: growthPercent, 
          currentSales: product.value,
          prevSales: prevSales 
        });
      }
    });
  }
  
  productGrowth.sort((a, b) => b.growth - a.growth);
  
  // Top 3 Product Groups by Sales Value, showing their Growth %
  const top3ProductsBySales = productSales.slice(0, 3);
  
  // For each top product by sales, find their growth % and sales percentage
  const top3ProductsWithGrowth = top3ProductsBySales.map(product => {
    const growthData = productGrowth.find(g => g.name === product.name);
    const growthPercent = growthData ? growthData.growth : 0;
    const salesPercent = totalProductSales > 0 ? (product.value / totalProductSales * 100) : 0;
    return {
      name: product.name,
      sales: product.value,
      salesPercent: salesPercent,
      growth: growthPercent
    };
  });
  
  // Keep sales ranking order - DO NOT sort by growth
  // top3ProductsWithGrowth is already in correct order (by sales %)
  
  // Render as 3 separate lines with bigger emojis
  const topProductGroupDisplay = (
    <div>
      {top3ProductsWithGrowth.map((p, index) => {
        const isPositive = p.growth > 0;
        const arrow = isPositive ? '▲' : '▼';
        const growthWord = isPositive ? 'growth' : 'decline';
        const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        return (
          <div key={index} style={{ 
            marginBottom: '12px', 
            display: 'flex', 
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: index < 2 ? '1px solid rgba(102, 126, 234, 0.1)' : 'none'
          }}>
            <span style={{ 
              fontSize: '1.8em', 
              marginRight: '12px',
              minWidth: '32px',
              textAlign: 'center'
            }}>{rankIcon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '4px',
                fontSize: '1.05em'
              }}>{p.name}</div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '0.9em'
              }}>
                <span>{p.salesPercent.toFixed(1)}% of sales</span>
                <span className={isPositive ? 'arrow-positive' : 'arrow-negative'}>
                  {arrow} {Math.abs(p.growth).toFixed(0)}% {growthWord}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
  
  const totalKgs = productKgs.reduce((sum, p) => sum + p.value, 0);
  const totalMoRM = productMoRM.reduce((sum, p) => sum + p.value, 0);
  const totalSalesForAvg = productSales.reduce((sum, p) => sum + p.value, 0);
  const avgSellingPrice = totalKgs > 0 ? totalSalesForAvg / totalKgs : 0;
  const avgMoRM = totalKgs > 0 ? totalMoRM / totalKgs : 0;
  
  // Calculate previous period values for growth
  const getPreviousPeriodData = (dataType) => {
    if (!comparisonPeriod) return 0;
    
    let total = 0;
    for (let row = 3; row < productData.length; row++) {
      const figuresHead = productData[row][3];
      if (!figuresHead || !figuresHead.toLowerCase().includes(dataType)) continue;
      
      for (let c = 4; c < productData[0].length; c++) {
        const year = productData[0][c];
        const month = productData[1][c];
        const type = productData[2][c];
        if (year == comparisonPeriod.year && comparisonPeriod.months.includes(month) && type === comparisonPeriod.type) {
          const v = parseFloat(productData[row][c]);
          if (!isNaN(v)) total += v;
        }
      }
    }
    return total;
  };
  
  const totalKgsPrev = getPreviousPeriodData('kgs');
  const totalSalesPrev = getPreviousPeriodData('sales');
  const totalMoRMPrev = getPreviousPeriodData('morm');
  const avgSellingPricePrev = totalKgsPrev > 0 ? totalSalesPrev / totalKgsPrev : 0;
  const avgMoRMPrev = totalKgsPrev > 0 ? totalMoRMPrev / totalKgsPrev : 0;
  
  // Calculate Process and Material category breakdowns
  const getProcessCategories = () => {
    const processData = {};
    for (let row = 3; row < productData.length; row++) {
      const productName = productData[row][0];
      const materialCategory = productData[row][1]; // Column B - Material
      const processCategory = productData[row][2]; // Column C - Process  
      const figuresHead = productData[row][3];
      
      // Filter out invalid categories
      const invalidCategories = ['Others', 'Raw Materials', 'N/A', 'others', 'raw materials', 'n/a'];
      if (!productName || !processCategory || 
          invalidCategories.includes(processCategory) ||
          invalidCategories.includes(productName.toLowerCase()) ||
          invalidCategories.includes(processCategory.toLowerCase())) continue;
      
      if (!processData[processCategory]) {
        processData[processCategory] = { kgs: 0, sales: 0, morm: 0 };
      }
      
      // Get current period data for this product
      for (let c = 4; c < productData[0].length; c++) {
        const year = productData[0][c];
        const month = productData[1][c];
        const type = productData[2][c];
        if (year == basePeriod.year && basePeriod.months.includes(month) && type === basePeriod.type) {
          const v = parseFloat(productData[row][c]);
          if (!isNaN(v)) {
            if (figuresHead && figuresHead.toLowerCase().includes('kgs')) {
              processData[processCategory].kgs += v;
            } else if (figuresHead && figuresHead.toLowerCase().includes('sales')) {
              processData[processCategory].sales += v;
            } else if (figuresHead && figuresHead.toLowerCase().includes('morm')) {
              processData[processCategory].morm += v;
            }
          }
        }
      }
    }
    return processData;
  };
  
  const getMaterialCategories = () => {
    const materialData = {};
    for (let row = 3; row < productData.length; row++) {
      const productName = productData[row][0];
      const materialCategory = productData[row][1]; // Column B - Material
      const processCategory = productData[row][2]; // Column C - Process  
      const figuresHead = productData[row][3];
      
      // Filter out invalid categories
      const invalidCategories = ['Others', 'Raw Materials', 'N/A', 'others', 'raw materials', 'n/a'];
      if (!productName || !materialCategory || 
          invalidCategories.includes(materialCategory) ||
          invalidCategories.includes(productName.toLowerCase()) ||
          invalidCategories.includes(materialCategory.toLowerCase())) continue;
      
      if (!materialData[materialCategory]) {
        materialData[materialCategory] = { kgs: 0, sales: 0, morm: 0 };
      }
      
      // Get current period data for this product
      for (let c = 4; c < productData[0].length; c++) {
        const year = productData[0][c];
        const month = productData[1][c];
        const type = productData[2][c];
        if (year == basePeriod.year && basePeriod.months.includes(month) && type === basePeriod.type) {
          const v = parseFloat(productData[row][c]);
          if (!isNaN(v)) {
            if (figuresHead && figuresHead.toLowerCase().includes('kgs')) {
              materialData[materialCategory].kgs += v;
            } else if (figuresHead && figuresHead.toLowerCase().includes('sales')) {
              materialData[materialCategory].sales += v;
            } else if (figuresHead && figuresHead.toLowerCase().includes('morm')) {
              materialData[materialCategory].morm += v;
            }
          }
        }
      }
    }
    return materialData;
  };
  
  const processCategories = getProcessCategories();
  const materialCategories = getMaterialCategories();
  
  // Calculate selling price and MoRM by Process
  const processSellingPrices = Object.entries(processCategories).map(([name, data]) => ({
    name,
    sellingPrice: data.kgs > 0 ? data.sales / data.kgs : 0,
    morm: data.kgs > 0 ? data.morm / data.kgs : 0
  })).filter(p => p.sellingPrice > 0).sort((a, b) => b.sellingPrice - a.sellingPrice);
  
  // Calculate selling price and MoRM by Material
  const materialSellingPrices = Object.entries(materialCategories).map(([name, data]) => ({
    name,
    sellingPrice: data.kgs > 0 ? data.sales / data.kgs : 0,
    morm: data.kgs > 0 ? data.morm / data.kgs : 0
  })).filter(p => p.sellingPrice > 0).sort((a, b) => b.sellingPrice - a.sellingPrice);
  
  const formatKgs = (kgs) => {
    const mt = kgs / 1000; // Convert kg to metric tons
    if (mt >= 1000000) return (mt / 1000000).toFixed(1) + 'M MT';
    if (mt >= 1000) return (mt / 1000).toFixed(1) + 'K MT';
    if (mt >= 1) return mt.toFixed(0) + ' MT';
    return kgs.toLocaleString() + ' kg'; // For very small values, keep kg
  };
  
  const formatPrice = (price) => price.toFixed(2);
  const formatMoRMPerKg = (val) => val.toFixed(2) + '/kg';
  const formatCustomerAvg = (value) => {
    if (value >= 1000000) return Math.round(value / 1000000) + 'M';
    if (value >= 1000) return Math.round(value / 1000) + 'K';
    return Math.round(value).toString();
  };
  
  // Geographic Distribution with Regional Grouping
  const countrySheetName = selectedDivision.replace(/-.*$/, '') + '-Countries';
  const countryData = salesData[countrySheetName] || [];
  let countrySales = [];
  let regionalSales = {
    'UAE': 0,
    'Arabian Peninsula': 0,
    'West Asia': 0,
    'Levant': 0,
    'North Africa': 0,
    'Southern Africa': 0,
    'Europe': 0,
    'Americas': 0,
    'Asia-Pacific': 0,
    'Unassigned': 0
  };
  
  if (countryData.length > 0 && basePeriod) {
    // First extract all countries from the data
    const countries = [];
    for (let row = 3; row < countryData.length; row++) {
      if (countryData[row] && countryData[row][0]) {
        countries.push(countryData[row][0].toString().trim());
      }
    }
    
    // Calculate sales amount for each country in base period only
    for (const countryName of countries) {
      let countrySum = 0;
      
      // Find the row for this country
      const countryRow = countryData.find(row => 
        row && row[0] && row[0].toString().trim() === countryName
      );
      
      if (countryRow) {
        // Find columns matching the base period
        for (let c = 4; c < countryData[0].length; c++) {
          const year = countryData[0][c];
          const month = countryData[1][c];
          const type = countryData[2][c];
          
          if (year == basePeriod.year && 
              basePeriod.months.includes(month) && 
              type === basePeriod.type) {
            
            const value = parseFloat(countryRow[c]);
            if (!isNaN(value)) {
              countrySum += value;
            }
          }
        }
      }
      
      if (countrySum > 0) {
        countrySales.push({ name: countryName, value: countrySum });
        
        // Use getRegionForCountry function for consistent region mapping
        const region = getRegionForCountry(countryName);
        
        if (region && regionalSales[region] !== undefined) {
          regionalSales[region] += countrySum;
        } else if (region) {
          // If region exists but not in our predefined list, add to Unassigned
          regionalSales['Unassigned'] += countrySum;
        }
      }
    }
  }
  
  const totalCountrySales = countrySales.reduce((a, b) => a + b.value, 0);
  
  // Calculate regional percentages
  const regionalPercentages = {};
  Object.keys(regionalSales).forEach(region => {
    regionalPercentages[region] = totalCountrySales > 0 ? (regionalSales[region] / totalCountrySales * 100) : 0;
  });
  
  // Calculate Local vs Export
  const localSales = regionalPercentages['UAE'] || 0;
  const exportSales = 100 - localSales;
  
  // Get regions with meaningful percentages (excluding UAE and < 0.1%)
  const exportRegions = Object.entries(regionalPercentages)
    .filter(([region, percentage]) => region !== 'UAE' && percentage >= 0.1)
    .sort((a, b) => b[1] - a[1]);

  // Calculate percentages relative to export total
  const exportRegionsWithRelativePercentage = exportRegions.map(([region, percentage]) => {
    const relativePercentage = exportSales > 0 ? (percentage / exportSales) * 100 : 0;
    return [region, percentage, relativePercentage];
  });
  
  // Customer Insights
  const customerSheetName = selectedDivision.replace(/-.*$/, '') + '-Customers';
  const customerData = salesData[customerSheetName] || [];
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
  const avgSalesPerCustomer = customerSales.length > 0 ? (totalCustomerSales / customerSales.length) : 0;

  // Render - Updated formatting v2.0 
  return (
    <div className="kpi-dashboard" key="kpi-dashboard-v2">
      <h2>
        Executive Summary – {divisionNames[selectedDivision.replace(/-.*$/, '')] || selectedDivision}
      </h2>
      <div>
        <span>{basePeriodName}</span>
      </div>
      <div>
        <span>(AED)</span>
      </div>
      {/* Financial Performance */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">💰 Financial Performance</h3>
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-icon">📈</div><div className="kpi-label">Revenue</div><div className="kpi-value">{formatM(sales)}</div><div className="kpi-trend">{growth(sales, salesPrev)}</div></div>
          <div className="kpi-card"><div className="kpi-icon">💵</div><div className="kpi-label">Gross Profit</div><div className="kpi-value">{formatM(grossProfit)}</div><div className="kpi-trend">{growth(grossProfit, grossProfitPrev)}</div></div>
          <div className="kpi-card"><div className="kpi-icon">💎</div><div className="kpi-label">Net Income</div><div className="kpi-value">{formatM(netProfit)}</div><div className="kpi-trend">{growth(netProfit, netProfitPrev)}</div></div>
          <div className="kpi-card"><div className="kpi-icon">⚡</div><div className="kpi-label">EBITDA</div><div className="kpi-value">{formatM(ebitda)}</div><div className="kpi-trend">{growth(ebitda, ebitdaPrev)}</div></div>
        </div>
      </div>
      {/* Product Performance */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">📦 Product Performance</h3>
        
        {/* Row 1: Top Revenue Drivers - Full Width */}
        <div className="kpi-cards">
          <div className="kpi-card revenue-drivers" style={{ gridColumn: '1 / -1', minHeight: 'auto' }}>
            <div className="kpi-icon">🏆</div>
            <div className="kpi-label">Top Revenue Drivers</div>
            <div className="kpi-value">{topProductGroupDisplay}</div>
          </div>
        </div>
        
        {/* Row 2: Total Sales Volume + Selling Price + MoRM */}
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-icon">📊</div><div className="kpi-label">Total Sales Volume</div><div className="kpi-value">{formatKgs(totalKgs)}</div><div className="kpi-trend">{growth(totalKgs, totalKgsPrev)}</div></div>
          <div className="kpi-card"><div className="kpi-icon">⚡</div><div className="kpi-label">Selling Price</div><div className="kpi-value">{formatPrice(avgSellingPrice)}/kg</div><div className="kpi-trend">{growth(avgSellingPrice, avgSellingPricePrev)}</div></div>
          <div className="kpi-card"><div className="kpi-icon">🎯</div><div className="kpi-label">MoRM</div><div className="kpi-value">{formatMoRMPerKg(avgMoRM)}</div><div className="kpi-trend">{growth(avgMoRM, avgMoRMPrev)}</div></div>
        </div>
        
        {/* Row 3: Process Categories - Dynamic sizing based on number of categories */}
        <div className="kpi-cards category-cards">
          {Object.entries(processCategories).map(([categoryName, data], index) => {
            const sellingPrice = data.kgs > 0 ? data.sales / data.kgs : 0;
            const morm = data.kgs > 0 ? data.morm / data.kgs : 0;
            
            // Calculate % of Sales
            const totalSales = Object.values(processCategories).reduce((sum, cat) => sum + cat.sales, 0);
            const salesPercentage = totalSales > 0 ? (data.sales / totalSales * 100) : 0;
            
            // Calculate Growth % (placeholder logic - needs previous period data)
            const salesGrowth = salesPercentage > 50 ? 10 : -5; // placeholder based on market share
            const priceGrowth = sellingPrice > 10 ? 5 : -2; // placeholder based on price level
            const mormGrowth = morm > 3 ? 3 : -1; // placeholder based on margin level
            
            const salesArrow = salesGrowth > 0 ? '▲' : '▼';
            const priceArrow = priceGrowth > 0 ? '▲' : '▼';
            const mormArrow = mormGrowth > 0 ? '▲' : '▼';
            const salesColor = salesGrowth > 0 ? '#007bff' : '#dc3545';
            const priceColor = priceGrowth > 0 ? '#007bff' : '#dc3545';
            const mormColor = mormGrowth > 0 ? '#007bff' : '#dc3545';
            
            return (
              <div key={`process-${categoryName}`} className="kpi-card">
                <div className="kpi-label category-highlight">{categoryName.toUpperCase()}</div>
                <div className="kpi-value">
                  <div>
                    % of Sales: {salesPercentage.toFixed(0)}%
                    <span className={salesGrowth > 0 ? 'arrow-positive' : 'arrow-negative'} style={{marginLeft: 8}}>{salesArrow} {Math.abs(salesGrowth)}%</span>
                  </div>
                  <div>
                    AVG Selling Price: {formatPrice(sellingPrice)} AED/Kg
                    <span className={priceGrowth > 0 ? 'arrow-positive' : 'arrow-negative'} style={{marginLeft: 8}}>{priceArrow} {Math.abs(priceGrowth)}%</span>
                  </div>
                  <div>
                    AVG MoRM: {formatPrice(morm)} AED/Kg
                    <span className={mormGrowth > 0 ? 'arrow-positive' : 'arrow-negative'} style={{marginLeft: 8}}>{mormArrow} {Math.abs(mormGrowth)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Row 4: Material Categories - Dynamic sizing based on number of categories */}
        <div className="kpi-cards category-cards">
          {Object.entries(materialCategories).map(([categoryName, data], index) => {
            const sellingPrice = data.kgs > 0 ? data.sales / data.kgs : 0;
            const morm = data.kgs > 0 ? data.morm / data.kgs : 0;
            
            // Calculate % of Sales
            const totalSales = Object.values(materialCategories).reduce((sum, cat) => sum + cat.sales, 0);
            const salesPercentage = totalSales > 0 ? (data.sales / totalSales * 100) : 0;
            
            // Calculate Growth % (placeholder logic)
            const salesGrowth = salesPercentage > 50 ? 10 : -5;
            const priceGrowth = sellingPrice > 10 ? 5 : -2;
            const mormGrowth = morm > 3 ? 3 : -1;
            
            const salesArrow = salesGrowth > 0 ? '▲' : '▼';
            const priceArrow = priceGrowth > 0 ? '▲' : '▼';
            const mormArrow = mormGrowth > 0 ? '▲' : '▼';
            const salesColor = salesGrowth > 0 ? '#007bff' : '#dc3545';
            const priceColor = priceGrowth > 0 ? '#007bff' : '#dc3545';
            const mormColor = mormGrowth > 0 ? '#007bff' : '#dc3545';
            
            return (
              <div key={`material-${categoryName}`} className="kpi-card">
                <div className="kpi-label category-highlight">{categoryName.toUpperCase()}</div>
                <div className="kpi-value">
                  <div>
                    % of Sales: {salesPercentage.toFixed(0)}%
                    <span className={salesGrowth > 0 ? 'arrow-positive' : 'arrow-negative'} style={{marginLeft: 8}}>{salesArrow} {Math.abs(salesGrowth)}%</span>
                  </div>
                  <div>
                    AVG Selling Price: {formatPrice(sellingPrice)} AED/Kg
                    <span className={priceGrowth > 0 ? 'arrow-positive' : 'arrow-negative'} style={{marginLeft: 8}}>{priceArrow} {Math.abs(priceGrowth)}%</span>
                  </div>
                  <div>
                    AVG MoRM: {formatPrice(morm)} AED/Kg
                    <span className={mormGrowth > 0 ? 'arrow-positive' : 'arrow-negative'} style={{marginLeft: 8}}>{mormArrow} {Math.abs(mormGrowth)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Geographic Distribution */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">🌍 Geographic Distribution</h3>
        
        {/* Row 1: Local vs Export - Always centered with 2 equal cards */}
        <div className="kpi-cards">
          <div className="kpi-card large">
            <div className="uae-icon-container">
              {/* Embedded UAE Flag SVG */}
              <svg className="uae-icon" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
                <rect width="900" height="200" fill="#00732f"/>
                <rect width="900" height="200" y="200" fill="#ffffff"/>
                <rect width="900" height="200" y="400" fill="#000000"/>
                <rect width="300" height="600" fill="#ff0000"/>
              </svg>
            </div>
            <div className="kpi-label">UAE</div>
            <div className="kpi-value">{localSales.toFixed(1)}%</div>
            <div className="kpi-trend">of total sales</div>
          </div>
          <div className="kpi-card large">
            <div className="rotating-emoji-container">
              <div className="rotating-emoji">🌍</div>
            </div>
            <div className="kpi-label">Export</div>
            <div className="kpi-value">{exportSales.toFixed(1)}%</div>
            <div className="kpi-trend">of total sales</div>
          </div>
        </div>
        
        {/* Row 2: Export Regions - Dynamic sizing to fill complete width */}
        {exportRegionsWithRelativePercentage.length > 0 && (
          <div className="kpi-cards export-regions">
            {exportRegionsWithRelativePercentage.map(([regionName, absolutePercentage, relativePercentage], index) => {
              // Use different globe emojis for different regions
              const regionGlobes = {
                'Arabian Peninsula': '🌍', // Africa/Europe view (Middle East visible)
                'West Asia': '🌍', // Africa/Europe view (Middle East visible)
                'Southern Africa': '🌍', // Africa/Europe view
                'Levant': '🌍', // Africa/Europe view (Middle East visible)
                'North Africa': '🌍', // Africa/Europe view
                'Europe': '🌍', // Africa/Europe view
                'Americas': '🌎', // Americas view
                'Asia-Pacific': '🌏', // Asia/Australia view
                'Unassigned': '🌐' // Generic globe
              };

              // Calculate gradient color based on percentage - ENHANCED VERSION
              const getGradientColor = (percentage) => {
                // Use distinct colors for different percentage ranges
                if (percentage >= 20) {
                  return '#1e40af'; // Deep blue for high percentages (20%+)
                } else if (percentage >= 15) {
                  return '#3b82f6'; // Medium blue (15-20%)
                } else if (percentage >= 10) {
                  return '#60a5fa'; // Light blue (10-15%)
                } else if (percentage >= 5) {
                  return '#93c5fd'; // Lighter blue (5-10%)
                } else {
                  return '#dbeafe'; // Very light blue (0-5%)
                }
              };

              const gradientColor = getGradientColor(absolutePercentage);
              
              return (
                <div 
                  key={regionName} 
                  className="kpi-card"
                  style={{
                    background: `linear-gradient(135deg, ${gradientColor}, ${gradientColor}cc)`,
                    borderLeft: `4px solid ${gradientColor}`,
                    boxShadow: `0 4px 12px ${gradientColor}44`,
                    color: absolutePercentage >= 10 ? 'white' : '#1a365d' // White text for darker backgrounds
                  }}
                >
                  <div className="region-globe-container">
                    <div className="region-globe">{regionGlobes[regionName] || '🌐'}</div>
                  </div>
                  <div className="kpi-label" style={{ 
                    color: absolutePercentage >= 10 ? 'white' : '#2d3748', 
                    fontWeight: '700' 
                  }}>{regionName}</div>
                  <div className="kpi-value" style={{ 
                    color: absolutePercentage >= 10 ? 'white' : '#1a365d', 
                    fontWeight: '800' 
                  }}>{absolutePercentage.toFixed(1)}%</div>
                  <div className="kpi-trend" style={{ 
                    color: absolutePercentage >= 10 ? '#e2e8f0' : '#4a5568' 
                  }}>{relativePercentage.toFixed(1)}% of export</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Customer Insights */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">👥 Customer Insights</h3>
        <div className="kpi-cards">
          <div className="kpi-card">
            <div className="kpi-icon">⭐</div>
            <div className="kpi-label">Top Customer</div>
            <div className="kpi-value">{topCustomer}
              <div className="customer-names-small">{customerSales[0] ? toProperCase(customerSales[0].name) : '-'}</div>
            </div>
            <div className="kpi-trend">of total sales</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon">🔝</div>
            <div className="kpi-label">Top 3 Customers</div>
            <div className="kpi-value">{top3Customer}
              <div className="customer-names-small">{customerSales.slice(0,3).map(cs => <div key={cs.name}>{toProperCase(cs.name)}</div>)}</div>
            </div>
            <div className="kpi-trend">of total sales</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon">🥇</div>
            <div className="kpi-label">Top 5 Customers</div>
            <div className="kpi-value">{top5Customer}
              <div className="customer-names-small">{customerSales.slice(0,5).map(cs => <div key={cs.name}>{toProperCase(cs.name)}</div>)}</div>
            </div>
            <div className="kpi-trend">of total sales</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon">💰</div>
            <div className="kpi-label">AVG Sales per Customer</div>
            <div className="kpi-value">{formatCustomerAvg(avgSalesPerCustomer)}</div>
            <div className="kpi-trend">average value</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIExecutiveSummary; 
import React from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useSalesData } from '../../contexts/SalesDataContext';
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
  const { salesData } = useSalesData();
  const { columnOrder, basePeriodIndex } = useFilter();
  if (!selectedDivision || !excelData[selectedDivision] || !columnOrder.length || basePeriodIndex == null) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>No data available. Please select a division and base period.</div>;
  }
  const divisionData = excelData[selectedDivision];
  const basePeriod = columnOrder[basePeriodIndex];
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
    const direction = growthPercent >= 0 ? 'Growth' : 'Decline';
    return `${Math.abs(growthPercent)}% ${direction} Vs Previous Period`;
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
  
  // Sort by growth for better presentation (highest growth first)
  const top3ProductsSortedByGrowth = top3ProductsWithGrowth.sort((a, b) => b.growth - a.growth);
  
  const topProductGroupDisplay = top3ProductsSortedByGrowth.map((p, index) => {
    const growthIcon = p.growth >= 15 ? '🚀' : p.growth >= 5 ? '📈' : p.growth >= 0 ? '⬆️' : p.growth >= -5 ? '📉' : '🔻';
    const growthArrow = p.growth >= 0 ? '↗️' : '↘️';
    const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
    const growthColor = p.growth >= 10 ? '🟢' : p.growth >= 0 ? '🔵' : p.growth >= -5 ? '🟡' : '🔴';
    
    return `${rankIcon} ${p.name}\n${p.salesPercent.toFixed(1)}% of sales ${growthArrow} ${Math.abs(p.growth).toFixed(0)}% growth ${growthIcon}`;
  }).join('\n\n') || '-';
  
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
  
  // Regional mapping for geographic distribution
  const regionalMapping = {
    'United Arab Emirates': 'UAE',
    'UAE': 'UAE',
    
    // GCC
    'Saudi Arabia': 'GCC',
    'Kuwait': 'GCC', 
    'Qatar': 'GCC',
    'Bahrain': 'GCC',
    'Oman': 'GCC',
    'KSA': 'GCC',
    
    // Levant
    'Lebanon': 'Levant',
    'Jordan': 'Levant',
    'Syria': 'Levant', 
    'Palestine': 'Levant',
    'Iraq': 'Levant',
    
    // North Africa (MENA)
    'Egypt': 'North Africa',
    'Libya': 'North Africa',
    'Tunisia': 'North Africa',
    'Algeria': 'North Africa',
    'Morocco': 'North Africa',
    'Sudan': 'North Africa',
    
    // Southern Africa
    'South Africa': 'Southern Africa',
    'Botswana': 'Southern Africa',
    'Namibia': 'Southern Africa',
    'Zimbabwe': 'Southern Africa',
    'Kenya': 'Southern Africa',
    'Nigeria': 'Southern Africa',
    
    // Europe
    'Germany': 'Europe',
    'France': 'Europe',
    'Italy': 'Europe',
    'Spain': 'Europe',
    'United Kingdom': 'Europe',
    'Netherlands': 'Europe',
    'Belgium': 'Europe',
    'Poland': 'Europe',
    'Russia': 'Europe',
    'Turkey': 'Europe',
    
    // Americas
    'United States': 'Americas',
    'Canada': 'Americas',
    'Mexico': 'Americas',
    'Brazil': 'Americas',
    'Argentina': 'Americas',
    'Chile': 'Americas',
    'Colombia': 'Americas',
    'USA': 'Americas',
    
    // Asia-Pacific
    'China': 'Asia-Pacific',
    'Japan': 'Asia-Pacific', 
    'South Korea': 'Asia-Pacific',
    'Taiwan': 'Asia-Pacific',
    'India': 'Asia-Pacific',
    'Pakistan': 'Asia-Pacific',
    'Sri Lanka': 'Asia-Pacific',
    'Bangladesh': 'Asia-Pacific',
    'Indonesia': 'Asia-Pacific',
    'Malaysia': 'Asia-Pacific',
    'Thailand': 'Asia-Pacific',
    'Philippines': 'Asia-Pacific',
    'Vietnam': 'Asia-Pacific',
    'Australia': 'Asia-Pacific',
    'New Zealand': 'Asia-Pacific',
    'Singapore': 'Asia-Pacific'
  };
  
  // Geographic Distribution with Regional Grouping
  const countrySheetName = selectedDivision.replace(/-.*$/, '') + '-Countries';
  const countryData = salesData[countrySheetName] || [];
  let countrySales = [];
  let regionalSales = {
    'UAE': 0,
    'GCC': 0,
    'Levant': 0,
    'North Africa': 0,
    'Southern Africa': 0,
    'Europe': 0,
    'Americas': 0,
    'Asia-Pacific': 0
  };
  
  if (countryData.length > 0 && basePeriod) {
    for (let row = 3; row < countryData.length; row++) {
      const countryName = countryData[row][0];
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
      
      if (countryName && sum > 0) {
        countrySales.push({ name: countryName, value: sum });
        
        // Map to regional groups
        const region = regionalMapping[countryName];
        if (region && regionalSales[region] !== undefined) {
          regionalSales[region] += sum;
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
  // Render
  return (
    <div className="kpi-dashboard" style={{ padding: 24 }}>
      <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
        Executive Summary – {divisionNames[selectedDivision.replace(/-.*$/, '')] || selectedDivision}
      </h2>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#444' }}>{basePeriodName}</span>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: 16, color: '#666' }}>(AED)</span>
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
        
        {/* Row 1: Top Performers by Growth + Total Sales Volume */}
        <div className="kpi-cards">
          <div className="kpi-card large"><div className="kpi-icon">🏆</div><div className="kpi-label">Top Performers by Growth</div><div className="kpi-value" style={{whiteSpace: 'pre-line', fontSize: '14px', lineHeight: '1.4'}}>{topProductGroupDisplay}</div><div className="kpi-trend">ranked by growth performance</div></div>
          <div className="kpi-card"><div className="kpi-icon">📊</div><div className="kpi-label">Total Sales Volume</div><div className="kpi-value">{formatKgs(totalKgs)}</div><div className="kpi-trend">{growth(totalKgs, totalKgsPrev)}</div></div>
        </div>
        
        {/* Row 2: Selling Price + MoRM */}
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-icon">⚡</div><div className="kpi-label">Selling Price</div><div className="kpi-value">{formatPrice(avgSellingPrice)}/kg</div><div className="kpi-trend">{growth(avgSellingPrice, avgSellingPricePrev)}</div></div>
          <div className="kpi-card"><div className="kpi-icon">🎯</div><div className="kpi-label">MoRM</div><div className="kpi-value">{formatMoRMPerKg(avgMoRM)}</div><div className="kpi-trend">{growth(avgMoRM, avgMoRMPrev)}</div></div>
        </div>
        
        {/* Row 3: Process Categories */}
        <div className="kpi-cards">
          {Object.entries(processCategories).slice(0, 2).map(([categoryName, data], index) => {
            const sellingPrice = data.kgs > 0 ? data.sales / data.kgs : 0;
            const morm = data.kgs > 0 ? data.morm / data.kgs : 0;
            
            // Calculate % of Sales
            const totalSales = Object.values(processCategories).reduce((sum, cat) => sum + cat.sales, 0);
            const salesPercentage = totalSales > 0 ? (data.sales / totalSales * 100) : 0;
            
            // Calculate Growth % (placeholder logic - needs previous period data)
            const salesGrowth = salesPercentage > 50 ? 10 : -5; // placeholder based on market share
            const priceGrowth = sellingPrice > 10 ? 5 : -2; // placeholder based on price level
            const mormGrowth = morm > 3 ? 3 : -1; // placeholder based on margin level
            
            const salesIcon = salesGrowth >= 0 ? '📈' : '📉';
            const priceIcon = priceGrowth >= 0 ? '📈' : '📉';
            const mormIcon = mormGrowth >= 0 ? '📈' : '📉';
            
            return (
              <div key={`process-${categoryName}`} className="kpi-card">
                <div className="kpi-label">{categoryName.toUpperCase()}</div>
                <div className="kpi-value" style={{whiteSpace: 'pre-line', fontSize: '14px', lineHeight: '1.6'}}>
                  {`% of Sales: ${salesPercentage.toFixed(0)}% ${salesIcon} ${Math.abs(salesGrowth)}%\n\nAVG Selling Price: ${formatPrice(sellingPrice)} AED/Kg ${priceIcon} ${Math.abs(priceGrowth)}%\n\nAVG MoRM: ${formatPrice(morm)} AED/Kg ${mormIcon} ${Math.abs(mormGrowth)}%`}
                </div>
                <div className="kpi-trend">Process Category</div>
              </div>
            );
          })}
        </div>
        
        {/* Row 4: Material Categories */}
        <div className="kpi-cards">
          {Object.entries(materialCategories).slice(0, 2).map(([categoryName, data], index) => {
            const sellingPrice = data.kgs > 0 ? data.sales / data.kgs : 0;
            const morm = data.kgs > 0 ? data.morm / data.kgs : 0;
            const priceGrowth = 3; // placeholder - will need calculation
            const mormGrowth = -1; // placeholder - will need calculation
            const priceIcon = priceGrowth >= 0 ? '📈' : '📉';
            const mormIcon = mormGrowth >= 0 ? '📈' : '📉';
            return (
              <div key={`material-${categoryName}`} className="kpi-card">
                <div className="kpi-label">{categoryName.toUpperCase()}</div>
                <div className="kpi-value" style={{whiteSpace: 'pre-line', fontSize: '16px', lineHeight: '1.8'}}>
                  {`Price: ${formatPrice(sellingPrice)}/kg ${priceIcon} ${Math.abs(priceGrowth)}%\n\nMoRM: ${formatMoRMPerKg(morm)} ${mormIcon} ${Math.abs(mormGrowth)}%`}
                </div>
                <div className="kpi-trend">Material Category</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Geographic Distribution */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">🌍 Geographic Distribution</h3>
        <div className="kpi-cards">
          <div className="kpi-card large"><div className="kpi-icon">🏠</div><div className="kpi-label">Local (UAE)</div><div className="kpi-value">{localSales.toFixed(1)}%</div><div className="kpi-trend">of total sales</div></div>
          <div className="kpi-card large"><div className="kpi-icon">🌐</div><div className="kpi-label">Export</div><div className="kpi-value">{exportSales.toFixed(1)}%</div><div className="kpi-trend">of total sales</div></div>
        </div>
        <div className="kpi-cards">
          {exportRegions.map(([regionName, percentage], index) => {
            const icons = ['🥇', '🥈', '🥉', '🏆', '📊', '📍'];
            return (
              <div key={regionName} className="kpi-card">
                <div className="kpi-icon">{icons[index] || '📊'}</div>
                <div className="kpi-label">{regionName}</div>
                <div className="kpi-value">{percentage.toFixed(1)}%</div>
                <div className="kpi-trend">{regionName}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Customer Insights */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">👥 Customer Insights</h3>
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-icon">⭐</div><div className="kpi-label">Top Customer</div><div className="kpi-value">{topCustomer}</div><div className="kpi-trend">of total sales</div></div>
          <div className="kpi-card"><div className="kpi-icon">🔝</div><div className="kpi-label">Top 3 Customers</div><div className="kpi-value">{top3Customer}</div><div className="kpi-trend">concentration</div></div>
          <div className="kpi-card"><div className="kpi-icon">📊</div><div className="kpi-label">Top 5 Customers</div><div className="kpi-value">{top5Customer}</div><div className="kpi-trend">concentration</div></div>
          <div className="kpi-card"><div className="kpi-icon">💰</div><div className="kpi-label">AVG Sales per Customer</div><div className="kpi-value">{formatCustomerAvg(avgSalesPerCustomer)}</div><div className="kpi-trend">average value</div></div>
        </div>
      </div>
    </div>
  );
};

export default KPIExecutiveSummary; 
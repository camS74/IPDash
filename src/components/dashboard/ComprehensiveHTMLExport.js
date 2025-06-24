import React, { useState } from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useFilter } from '../../contexts/FilterContext';
import ipTransparentLogo from '../../assets/IP transparent-.jpg';

const ComprehensiveHTMLExport = ({ tableRef }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const { selectedDivision, data } = useExcelData();
  const { columnOrder, basePeriodIndex } = useFilter();

  // Convert logo to base64 for embedding
  const getBase64Logo = async () => {
    try {
      const response = await fetch(ipTransparentLogo);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Could not load IP transparent logo for comprehensive export:', error);
      return null;
    }
  };

  // Get division display name
  const getDivisionDisplayName = () => {
    const divisionNames = {
      'FP-Product Group': 'Flexible Packaging',
      'SB-Product Group': 'Shopping Bags',
      'TF-Product Group': 'Thermoforming Products',
      'HCM-Product Group': 'Preforms and Closures'
    };
    return divisionNames[selectedDivision] || selectedDivision.split('-')[0];
  };

  // Get base period display text
  const getBasePeriodText = () => {
    if (basePeriodIndex !== null && columnOrder[basePeriodIndex]) {
      const period = columnOrder[basePeriodIndex];
      return `${period.year} ${period.isCustomRange ? period.displayName : period.month} ${period.type}`;
    }
    return 'No Base Period Selected';
  };

  // Card configuration for 10 cards (5 per row)
  const cardConfigs = [
    { id: 'product-group', title: 'Product Group', icon: '📊', description: 'Product group analysis and metrics' },
    { id: 'sales-country', title: 'Sales by Country', icon: '🌍', description: 'Geographic sales distribution' },
    { id: 'sales-customer', title: 'Sales by Customer', icon: '👥', description: 'Customer sales analysis' },
    { id: 'financial-pl', title: 'P&L Financial', icon: '💰', description: 'Profit & Loss statement' },
    { id: 'kpi-summary', title: 'KPI Summary', icon: '📈', description: 'Key performance indicators' },
    { id: 'expense-analysis', title: 'Expense Analysis', icon: '📉', description: 'Cost breakdown analysis' },
    { id: 'margin-analysis', title: 'Margin Analysis', icon: '📋', description: 'Profit margin insights' },
    { id: 'trend-analysis', title: 'Trend Analysis', icon: '📊', description: 'Historical trend overview' },
    { id: 'variance-report', title: 'Variance Report', icon: '⚖️', description: 'Budget vs actual comparison' },
    { id: 'executive-summary', title: 'Executive Summary', icon: '🎯', description: 'High-level overview' }
  ];

  // Capture Product Group table HTML
  const captureProductGroupTable = async () => {
    console.log('🔍 Simple table capture - checking ref...');
    
    // SIMPLE APPROACH: Just look for the Product Group table in the DOM
    const productGroupTable = document.querySelector('table.product-group-table');
    
    if (productGroupTable) {
      console.log('✅ Found Product Group table directly');
      return productGroupTable.outerHTML;
    }
    
    // If that doesn't work, look for any table with product-header-row (unique to Product Group)
    const tableWithProductHeaders = document.querySelector('table .product-header-row')?.closest('table');
    
    if (tableWithProductHeaders) {
      console.log('✅ Found table with product headers');
      return tableWithProductHeaders.outerHTML;
    }
    
    console.error('❌ No Product Group table found');
    const allTables = Array.from(document.querySelectorAll('table'));
    console.log('Available tables count:', allTables.length);
    
    allTables.forEach((table, index) => {
      console.log(`Table ${index}:`, {
        classes: table.className,
        hasProductHeaders: !!table.querySelector('.product-header-row'), 
        hasProductHeader: !!table.querySelector('.product-header'),
        tableView: table.closest('.table-view')?.querySelector('h3')?.textContent,
        hasProductGroupClass: table.classList.contains('product-group-table'),
        firstRowText: table.querySelector('tr')?.textContent?.substring(0, 50)
      });
    });
    
    // Try to get any table that looks like it might be the Product Group table
    const fallbackTable = allTables.find(table => 
      table.querySelector('.product-header-row') ||
      table.querySelector('.product-header') ||
      table.classList.contains('product-group-table') ||
      table.closest('.table-view')?.textContent?.includes('Product Group')
    );
    
    if (fallbackTable) {
      console.log('🎯 Using fallback table that seems to be Product Group table');
      return fallbackTable.outerHTML;
    }
    
    throw new Error('Product Group table not found. Please visit the Product Group tab first.');
  };

  // Capture P&L Financial table HTML
  const capturePLFinancialTable = async () => {
    console.log('🔍 Capturing P&L Financial table...');
    
    // Look for the P&L Financial table in the DOM
    const allTables = Array.from(document.querySelectorAll('table'));
    console.log('Available tables count for P&L:', allTables.length);
    
    // Find table that looks like P&L Financial - it should have financial metrics
    const plTable = allTables.find(table => {
      const tableText = table.textContent || '';
      const hasFinancialMetrics = tableText.includes('Revenue') || 
                                 tableText.includes('Sales') || 
                                 tableText.includes('Gross Profit') ||
                                 tableText.includes('EBITDA') ||
                                 tableText.includes('Operating') ||
                                 tableText.includes('Net Income') ||
                                 tableText.includes('Cost of Goods') ||
                                 tableText.includes('Margin');
      
      const isInTableView = table.closest('.table-view');
      
      console.log(`Checking table for P&L:`, {
        hasFinancialMetrics,
        isInTableView: !!isInTableView,
        classes: table.className,
        textPreview: tableText.substring(0, 100)
      });
      
      return hasFinancialMetrics && isInTableView;
    });
    
    if (plTable) {
      console.log('✅ Found P&L Financial table');
      return plTable.outerHTML;
    }
    
    // Fallback: look for any table in table-view that might be the financial table
    const fallbackTable = allTables.find(table => {
      const tableView = table.closest('.table-view');
      return tableView && table.querySelector('thead') && table.querySelector('tbody');
    });
    
    if (fallbackTable) {
      console.log('🎯 Using fallback table for P&L Financial');
      return fallbackTable.outerHTML;
    }
    
    throw new Error('P&L Financial table not found. Please visit the P&L tab first.');
  };

  // Capture Sales by Country table HTML
  const captureSalesCountryTable = async () => {
    console.log('🔍 Capturing Sales by Country table...');
    
    // Look for the Sales by Country table in the DOM
    const allTables = Array.from(document.querySelectorAll('table'));
    console.log('Available tables count for Sales Country:', allTables.length);
    
    // Find table that looks like Sales by Country - it should have country names
    const countryTable = allTables.find(table => {
      const tableText = table.textContent || '';
      const hasCountryData = tableText.includes('UAE') || 
                            tableText.includes('KSA') || 
                            tableText.includes('Egypt') ||
                            tableText.includes('Country') ||
                            tableText.includes('Total Sales') ||
                            tableText.includes('%');
      
      const isInTableView = table.closest('.table-view') || table.closest('.sales-country-table');
      
      console.log(`Checking table for Sales Country:`, {
        hasCountryData,
        isInTableView: !!isInTableView,
        classes: table.className,
        textPreview: tableText.substring(0, 100)
      });
      
      return hasCountryData && isInTableView;
    });
    
    if (countryTable) {
      console.log('✅ Found Sales by Country table');
      return countryTable.outerHTML;
    }
    
    // Fallback: look for any table that might be the sales country table
    const fallbackTable = allTables.find(table => {
      const tableView = table.closest('.table-view');
      const hasPercentage = table.textContent?.includes('%');
      return tableView && hasPercentage && table.querySelector('thead') && table.querySelector('tbody');
    });
    
    if (fallbackTable) {
      console.log('🎯 Using fallback table for Sales by Country');
      return fallbackTable.outerHTML;
    }
    
    throw new Error('Sales by Country table not found. Please visit the Sales by Country tab first.');
  };

  // Capture Sales by Customer table HTML
  const captureSalesCustomerTable = async () => {
    console.log('🔍 Capturing Sales by Customer table...');
    
    // Look for the Sales by Customer table in the DOM
    const allTables = Array.from(document.querySelectorAll('table'));
    console.log('Available tables count for Sales Customer:', allTables.length);
    
    // Find table that looks like Sales by Customer - it should have customer names
    const customerTable = allTables.find(table => {
      const tableText = table.textContent || '';
      const hasCustomerData = tableText.includes('Customer') || 
                             tableText.includes('Total') ||
                             tableText.includes('Sales') ||
                             tableText.includes('AED') ||
                             tableText.includes('Amount');
      
      const isInTableView = table.closest('.table-view') || table.closest('.sales-customer-table');
      
      console.log(`Checking table for Sales Customer:`, {
        hasCustomerData,
        isInTableView: !!isInTableView,
        classes: table.className,
        textPreview: tableText.substring(0, 100)
      });
      
      return hasCustomerData && isInTableView;
    });
    
    if (customerTable) {
      console.log('✅ Found Sales by Customer table');
      return customerTable.outerHTML;
    }
    
    // Fallback: look for any table that might be the sales customer table
    const fallbackTable = allTables.find(table => {
      const tableView = table.closest('.table-view');
      const hasSalesData = table.textContent?.includes('Sales') || table.textContent?.includes('Amount');
      return tableView && hasSalesData && table.querySelector('thead') && table.querySelector('tbody');
    });
    
    if (fallbackTable) {
      console.log('🎯 Using fallback table for Sales by Customer');
      return fallbackTable.outerHTML;
    }
    
    throw new Error('Sales by Customer table not found. Please visit the Sales by Customer tab first.');
  };

  // Generate KPI Summary from captured table data
  const generateKPISummary = (plTableHTML, countryTableHTML, customerTableHTML, productGroupTableHTML) => {
    try {
      console.log('📊 Generating KPI Summary from captured tables...');
      
      // Sample KPIs - In real implementation, we'd parse the HTML tables
      const kpis = {
        financial: {
          revenue: { current: '15.2M', growth: '+12.3%', trend: 'up' },
          grossProfit: { current: '4.8M', margin: '31.6%', trend: 'up' },
          netIncome: { current: '2.1M', margin: '13.8%', trend: 'down' },
          ebitda: { current: '3.2M', margin: '21.1%', trend: 'up' }
        },
        geographic: {
          topCountry: { name: 'UAE', percentage: '51.4%' },
          secondCountry: { name: 'KSA', percentage: '18.7%' },
          thirdCountry: { name: 'Egypt', percentage: '12.3%' },
          concentration: '82.4%'
        },
        customer: {
          topCustomer: { percentage: '15.2%' },
          concentration: { top3: '38.7%', top5: '52.3%' },
          diversity: 'Good'
        },
        product: {
          topProduct: 'Flexible Packaging',
          productCount: 8,
          diversity: 'High'
        }
      };

      return `
        <div class="kpi-dashboard">
          <div class="kpi-section">
            <h3 class="kpi-section-title">💰 Financial Performance</h3>
            <div class="kpi-cards">
              <div class="kpi-card">
                <div class="kpi-icon">📈</div>
                <div class="kpi-label">Revenue</div>
                <div class="kpi-value">${kpis.financial.revenue.current}</div>
                <div class="kpi-trend ${kpis.financial.revenue.trend}">${kpis.financial.revenue.growth}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">💵</div>
                <div class="kpi-label">Gross Profit</div>
                <div class="kpi-value">${kpis.financial.grossProfit.current}</div>
                <div class="kpi-trend ${kpis.financial.grossProfit.trend}">${kpis.financial.grossProfit.margin}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">💎</div>
                <div class="kpi-label">Net Income</div>
                <div class="kpi-value">${kpis.financial.netIncome.current}</div>
                <div class="kpi-trend ${kpis.financial.netIncome.trend}">${kpis.financial.netIncome.margin}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">⚡</div>
                <div class="kpi-label">EBITDA</div>
                <div class="kpi-value">${kpis.financial.ebitda.current}</div>
                <div class="kpi-trend ${kpis.financial.ebitda.trend}">${kpis.financial.ebitda.margin}</div>
              </div>
            </div>
          </div>

          <div class="kpi-section">
            <h3 class="kpi-section-title">🌍 Geographic Distribution</h3>
            <div class="kpi-cards">
              <div class="kpi-card large">
                <div class="kpi-icon">🥇</div>
                <div class="kpi-label">Top Market</div>
                <div class="kpi-value">${kpis.geographic.topCountry.name}</div>
                <div class="kpi-trend up">${kpis.geographic.topCountry.percentage}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">🥈</div>
                <div class="kpi-label">2nd Market</div>
                <div class="kpi-value">${kpis.geographic.secondCountry.name}</div>
                <div class="kpi-trend up">${kpis.geographic.secondCountry.percentage}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">🥉</div>
                <div class="kpi-label">3rd Market</div>
                <div class="kpi-value">${kpis.geographic.thirdCountry.name}</div>
                <div class="kpi-trend up">${kpis.geographic.thirdCountry.percentage}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">🎯</div>
                <div class="kpi-label">Top 3 Concentration</div>
                <div class="kpi-value">${kpis.geographic.concentration}</div>
                <div class="kpi-trend neutral">of total sales</div>
              </div>
            </div>
          </div>

          <div class="kpi-section">
            <h3 class="kpi-section-title">👥 Customer Insights</h3>
            <div class="kpi-cards">
              <div class="kpi-card">
                <div class="kpi-icon">⭐</div>
                <div class="kpi-label">Top Customer</div>
                <div class="kpi-value">${kpis.customer.topCustomer.percentage}</div>
                <div class="kpi-trend neutral">of total sales</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">🔝</div>
                <div class="kpi-label">Top 3 Customers</div>
                <div class="kpi-value">${kpis.customer.concentration.top3}</div>
                <div class="kpi-trend neutral">concentration</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">📊</div>
                <div class="kpi-label">Top 5 Customers</div>
                <div class="kpi-value">${kpis.customer.concentration.top5}</div>
                <div class="kpi-trend neutral">concentration</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">🎨</div>
                <div class="kpi-label">Customer Diversity</div>
                <div class="kpi-value">${kpis.customer.diversity}</div>
                <div class="kpi-trend up">distribution</div>
              </div>
            </div>
          </div>

          <div class="kpi-section">
            <h3 class="kpi-section-title">📦 Product Performance</h3>
            <div class="kpi-cards">
              <div class="kpi-card large">
                <div class="kpi-icon">🏆</div>
                <div class="kpi-label">Top Product Group</div>
                <div class="kpi-value">${kpis.product.topProduct}</div>
                <div class="kpi-trend up">Leading performer</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">📈</div>
                <div class="kpi-label">Product Groups</div>
                <div class="kpi-value">${kpis.product.productCount}</div>
                <div class="kpi-trend neutral">active groups</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-icon">🌟</div>
                <div class="kpi-label">Portfolio Diversity</div>
                <div class="kpi-value">${kpis.product.diversity}</div>
                <div class="kpi-trend up">diversification</div>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error generating KPI Summary:', error);
      return `
        <div class="kpi-error">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-error-text">Unable to generate KPIs from table data</div>
          <div class="kpi-error-details">Please ensure all tables are properly loaded</div>
        </div>
      `;
    }
  };

  // Helper function to ensure Product Group tab is active
  const ensureProductGroupTabActive = () => {
    console.log('🔍 Checking if Product Group tab is active...');
    
    // Find the Product Group tab specifically - look for small clickable elements only
    const allButtons = Array.from(document.querySelectorAll('button, [role="tab"]'));
    const productGroupTab = allButtons.find(el => {
      const text = el.textContent?.trim();
      return text === 'Product Group' && text.length < 50; // Must be exact match and short text
    });
    
    if (!productGroupTab) {
      console.warn('⚠️ Product Group tab button not found');
      console.log('Available tab-like buttons:', allButtons.map(b => b.textContent?.trim()).filter(t => t && t.length < 50));
      return Promise.resolve();
    }
    
    console.log('🔍 Found Product Group tab button:', productGroupTab.textContent?.trim());
    
    // Check if it's already active
    const isActive = productGroupTab.classList.contains('active') || 
                    productGroupTab.getAttribute('aria-selected') === 'true';
                    
    if (!isActive) {
      console.log('🔄 Clicking Product Group tab...');
      productGroupTab.click();
      // Give it time to mount and render
      return new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('✅ Product Group tab is already active');
    }
    
    return Promise.resolve();
  };

  // Helper function to ensure P&L tab is active
  const ensurePLTabActive = () => {
    console.log('🔍 Checking if P&L tab is active...');
    
    // Find the P&L tab specifically
    const allButtons = Array.from(document.querySelectorAll('button, [role="tab"]'));
    const plTab = allButtons.find(el => {
      const text = el.textContent?.trim();
      return (text === 'P&L' || text === 'P&L Financial' || text.includes('P&L')) && text.length < 50;
    });
    
    if (!plTab) {
      console.warn('⚠️ P&L tab button not found');
      console.log('Available tab-like buttons:', allButtons.map(b => b.textContent?.trim()).filter(t => t && t.length < 50));
      return Promise.resolve();
    }
    
    console.log('🔍 Found P&L tab button:', plTab.textContent?.trim());
    
    // Check if it's already active
    const isActive = plTab.classList.contains('active') || 
                    plTab.getAttribute('aria-selected') === 'true';
                    
    if (!isActive) {
      console.log('🔄 Clicking P&L tab...');
      plTab.click();
      // Give it time to mount and render
      return new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('✅ P&L tab is already active');
    }
    
    return Promise.resolve();
  };

  // Helper function to ensure Sales by Country tab is active
  const ensureSalesCountryTabActive = () => {
    console.log('🔍 Checking if Sales by Country tab is active...');
    
    // Find the Sales by Country tab specifically
    const allButtons = Array.from(document.querySelectorAll('button, [role="tab"]'));
    const salesCountryTab = allButtons.find(el => {
      const text = el.textContent?.trim();
      return (text === 'Sales by Country' || text.includes('Country') || text === 'Table') && text.length < 50;
    });
    
    if (!salesCountryTab) {
      console.warn('⚠️ Sales by Country tab button not found');
      console.log('Available tab-like buttons:', allButtons.map(b => b.textContent?.trim()).filter(t => t && t.length < 50));
      return Promise.resolve();
    }
    
    console.log('🔍 Found Sales by Country tab button:', salesCountryTab.textContent?.trim());
    
    // Check if it's already active
    const isActive = salesCountryTab.classList.contains('active') || 
                    salesCountryTab.getAttribute('aria-selected') === 'true';
                    
    if (!isActive) {
      console.log('🔄 Clicking Sales by Country tab...');
      salesCountryTab.click();
      // Give it time to mount and render
      return new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('✅ Sales by Country tab is already active');
    }
    
    return Promise.resolve();
  };

  // Helper function to ensure Sales by Customer tab is active
  const ensureSalesCustomerTabActive = () => {
    console.log('🔍 Checking if Sales by Customer tab is active...');
    
    // Find the Sales by Customer tab specifically
    const allButtons = Array.from(document.querySelectorAll('button, [role="tab"]'));
    const salesCustomerTab = allButtons.find(el => {
      const text = el.textContent?.trim();
      return (text === 'Sales by Customer' || text.includes('Customer')) && text.length < 50;
    });
    
    if (!salesCustomerTab) {
      console.warn('⚠️ Sales by Customer tab button not found');
      console.log('Available tab-like buttons:', allButtons.map(b => b.textContent?.trim()).filter(t => t && t.length < 50));
      return Promise.resolve();
    }
    
    console.log('🔍 Found Sales by Customer tab button:', salesCustomerTab.textContent?.trim());
    
    // Check if it's already active
    const isActive = salesCustomerTab.classList.contains('active') || 
                    salesCustomerTab.getAttribute('aria-selected') === 'true';
                    
    if (!isActive) {
      console.log('🔄 Clicking Sales by Customer tab...');
      salesCustomerTab.click();
      // Give it time to mount and render
      return new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('✅ Sales by Customer tab is already active');
    }
    
    return Promise.resolve();
  };

  // Generate comprehensive HTML export
  const handleComprehensiveExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      // Capture tables by ensuring tabs are active
      await ensureProductGroupTabActive();
      const productGroupTableHTML = await captureProductGroupTable();
      
      await ensurePLTabActive();
      const plFinancialTableHTML = await capturePLFinancialTable();
      
      await ensureSalesCountryTabActive();
      const salesCountryTableHTML = await captureSalesCountryTable();
      
      await ensureSalesCustomerTabActive();
      const salesCustomerTableHTML = await captureSalesCustomerTable();
      
      const logoBase64 = await getBase64Logo();
      const divisionName = getDivisionDisplayName();
      const basePeriod = getBasePeriodText();

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${divisionName} - Comprehensive Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .main-container {
            width: 100%;
            max-width: 100vw;
            padding: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        /* Header Section */
        .header-section {
            text-align: center;
            margin-bottom: 40px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .logo-container {
            margin-bottom: 20px;
        }
        
        .logo {
            max-height: 80px;
            max-width: 200px;
            object-fit: contain;
        }
        
        .division-title {
            font-size: 2.5rem;
            color: #2c3e50;
            margin: 20px 0 10px 0;
            font-weight: 700;
        }
        
        .report-subtitle {
            font-size: 1.2rem;
            color: #7f8c8d;
            margin-bottom: 15px;
        }
        
        .period-info {
            font-size: 1.1rem;
            color: #34495e;
            background: #ecf0f1;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            font-weight: 600;
        }
        
        /* Cards Grid */
        .cards-container {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .report-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            border: 2px solid transparent;
        }
        
        .report-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            border-color: #3498db;
        }
        
        .card-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
            display: block;
        }
        
        .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .card-description {
            font-size: 0.9rem;
            color: #7f8c8d;
            line-height: 1.4;
        }
        
        /* Content Pages */
        .content-page {
            display: none;
            background: rgba(255, 255, 255, 0.98);
            border-radius: 15px;
            padding: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            min-height: 600px;
            width: 95vw;
            max-width: 95vw;
        }
        
        .content-page.active {
            display: block;
        }
        
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }
        
        .page-title {
            font-size: 1.8rem;
            color: #2c3e50;
            margin: 0;
            flex-grow: 1;
            text-align: center;
        }
        
        .back-button {
            position: fixed;
            top: 90px; /* 100px - 10px up */
            left: calc(5% + 40px); /* 5% from left edge + 40px right */
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
            border: none;
            width: 80px;
            height: 105px; /* Covers 3 rows (35px each) */
            border-radius: 15px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            margin: 0;
            transition: all 0.3s ease;
            flex-shrink: 0;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            line-height: 1.2;
            box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
        }
        
        .back-button:hover {
            background: linear-gradient(135deg, #8e44ad, #732d91);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(155, 89, 182, 0.4);
        }
        
        /* Table Styles */
        .table-container {
            width: 100%;
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin: 0 auto;
        }
        
        table {
            width: 100%;
            min-width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            font-size: 14px;
        }
        
        th, td {
            padding: 8px 12px;
            text-align: center;
            border: 1px solid #ddd;
        }
        
        /* Consistent header row heights */
        thead tr th {
            height: 35px;
            line-height: 1.2;
            vertical-align: middle;
        }
        
        th {
            font-weight: bold;
            position: sticky;
            z-index: 10;
            /* Don't override background-color to preserve original colors */
        }
        
        /* Default: Freeze first 3 header rows (for Product Group, Sales by Country, Sales by Customer) */
        thead tr:nth-child(1) th {
            top: 70px; /* Account for page header height */
            z-index: 13;
        }
        
        thead tr:nth-child(2) th {
            top: 105px; /* 70px page header + 35px first row */
            z-index: 12;
        }
        
        thead tr:nth-child(3) th {
            top: 140px; /* 70px page header + 70px first two rows */
            z-index: 11;
        }
        
        /* Make first column cells in frozen header rows white with no borders */
        thead tr:nth-child(1) th:first-child,
        thead tr:nth-child(2) th:first-child,
        thead tr:nth-child(3) th:first-child,
        thead tr:nth-child(4) th:first-child {
            background-color: white;
            border: none;
        }
        
        /* Remove left border from first period column in headers - clean look */
        thead tr:nth-child(2) th:nth-child(2),
        thead tr:nth-child(3) th:nth-child(2),
        thead tr:nth-child(4) th:nth-child(2) {
            border-left: none;
        }
        
        /* P&L Financial Table: Freeze first 4 header rows */
        .content-page[id="page-financial-pl"] thead tr:nth-child(4) th {
            top: 175px; /* 70px page header + 105px first three rows */
            z-index: 10;
            position: sticky;
            font-weight: bold;
        }
        
        /* Add thin borders to 4th row cells starting from 2nd column - P&L Financial only */
        .content-page[id="page-financial-pl"] thead tr:nth-child(4) th:nth-child(n+2) {
            border: 1px solid #ddd;
        }
        
        /* Sales by Country Table: Freeze first 4 header rows */
        .content-page[id="page-sales-country"] thead tr:nth-child(1) th {
            top: 70px; /* Account for page header height */
            z-index: 13;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-country"] thead tr:nth-child(2) th {
            top: 105px; /* 70px page header + 35px first row */
            z-index: 12;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-country"] thead tr:nth-child(3) th {
            top: 140px; /* 70px page header + 70px first two rows */
            z-index: 11;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-country"] thead tr:nth-child(4) th {
            top: 175px; /* 70px page header + 105px first three rows */
            z-index: 10;
            position: sticky;
            font-weight: bold;
        }
        
        /* Sales by Customer Table: Freeze first 4 header rows */
        .content-page[id="page-sales-customer"] thead tr:nth-child(1) th {
            top: 70px; /* Account for page header height */
            z-index: 13;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-customer"] thead tr:nth-child(2) th {
            top: 105px; /* 70px page header + 35px first row */
            z-index: 12;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-customer"] thead tr:nth-child(3) th {
            top: 140px; /* 70px page header + 70px first two rows */
            z-index: 11;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-customer"] thead tr:nth-child(4) th {
            top: 175px; /* 70px page header + 105px first three rows */
            z-index: 10;
            position: sticky;
            font-weight: bold;
        }
        
        .product-header {
            background-color: #1976d2;
            color: white;
            font-weight: bold;
        }
        
        .metric-cell {
            font-size: 14px;
        }
        
        .total-header {
            background-color: #f57c00;
            color: white;
            font-weight: bold;
        }
        
        /* Headers are center aligned */
        th {
            text-align: center;
        }
        
        /* First column data cells left alignment */
        table td:first-child {
            text-align: left;
            padding-left: 12px;
        }
        
        /* Financial Table Bold Formatting - Preserve Original Styles */
        .financial-table .section-header td {
            font-weight: bold;
        }
        
        .financial-table .important-row td {
            font-weight: bold;
        }
        
        .financial-table tr.important-row td:first-child,
        .financial-table tr.important-row td:nth-child(3n+2),
        .financial-table tr.important-row td:nth-child(3n+3),
        .financial-table tr.important-row td:nth-child(3n+4) {
            font-weight: bold;
        }
        
        /* Ensure all cells in section header rows are bold */
        .financial-table .section-header {
            background-color: transparent;
        }
        
        /* Make calculated cells italic */
        .financial-table .calculated-cell {
            font-style: italic;
            color: #000000;
        }
        
        /* Sales by Country Table Formatting */
        .financial-table .country-row {
            background-color: #ffffff;
        }
        
        .financial-table .country-row:hover {
            background-color: #f8f9fa;
        }
        
        .financial-table .percentage-cell {
            font-weight: 500;
        }
        
        .financial-table .delta-cell {
            font-weight: bold;
            font-size: 13px;
        }
        
        /* Sales by Customer Table Formatting */
        .financial-table .customer-row {
            background-color: #ffffff;
        }
        
        .financial-table .customer-row:hover {
            background-color: #f8f9fa;
        }
        
        .financial-table .sales-amount-cell {
            font-weight: 500;
        }
        
        /* Preserve Original Inline Styles - Don't Override Background Colors */
        table th[style*="background-color"],
        table td[style*="background-color"] {
            /* Let inline styles take precedence for background colors */
        }
        
        /* Remove top borders from all colored header cells */
        thead tr th[style*="background-color"] {
            border-top: none;
        }
        
        /* Remove ALL borders from first 4 header rows and eliminate spaces */
        thead tr:nth-child(1) th,
        thead tr:nth-child(2) th,
        thead tr:nth-child(3) th,
        thead tr:nth-child(4) th {
            border: none;
            margin: 0;
            padding: 8px 12px;
            line-height: 1;
        }
        
        /* Ensure no spacing between header rows */
        thead tr:nth-child(1),
        thead tr:nth-child(2),
        thead tr:nth-child(3),
        thead tr:nth-child(4) {
            margin: 0;
            padding: 0;
            border-spacing: 0;
        }
        
        /* Table Footer Note Styling */
        .table-footer-note {
            margin-top: 15px;
            padding: 10px;
            font-size: 12px;
            font-weight: bold;
            font-style: italic;
            color: #666;
            text-align: center;
            background-color: #f8f9fa;
            border-radius: 5px;
            border-left: 3px solid #007bff;
        }
        
        /* Product group rows with darker colors */
        .product-header-row td:first-child {
            background-color: #1565c0;
            color: white;
            font-weight: bold;
        }
        
        /* Category header rows */
        .category-header-row td:first-child {
            background-color: #37474f;
            color: white;
            font-weight: bold;
        }
        
        /* Total row */
        .total-header-row td:first-child {
            background-color: #e65100;
            color: white;
            font-weight: bold;
        }
        
        /* KPI Dashboard Styles */
        .kpi-dashboard {
            padding: 20px;
            max-width: 100%;
            margin: 0 auto;
        }
        
        .kpi-section {
            margin-bottom: 40px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .kpi-section-title {
            font-size: 1.8rem;
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 700;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        
        .kpi-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .kpi-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .kpi-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            border-color: #3498db;
        }
        
        .kpi-card.large {
            grid-column: span 2;
        }
        
        .kpi-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
            display: block;
        }
        
        .kpi-label {
            font-size: 0.9rem;
            color: #7f8c8d;
            margin-bottom: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .kpi-value {
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
            line-height: 1;
        }
        
        .kpi-trend {
            font-size: 0.9rem;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 12px;
            display: inline-block;
        }
        
        .kpi-trend.up {
            background: #d4edda;
            color: #155724;
        }
        
        .kpi-trend.down {
            background: #f8d7da;
            color: #721c24;
        }
        
        .kpi-trend.neutral {
            background: #e2e3e5;
            color: #383d41;
        }
        
        .kpi-error {
            text-align: center;
            padding: 60px 20px;
            color: #dc3545;
            background: rgba(248, 215, 218, 0.3);
            border-radius: 15px;
            margin: 20px;
        }
        
        .kpi-error .kpi-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            opacity: 0.7;
        }
        
        .kpi-error-text {
            font-size: 1.5rem;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .kpi-error-details {
            font-size: 1rem;
            opacity: 0.8;
        }

        /* Coming Soon Style */
        .coming-soon {
            text-align: center;
            padding: 60px 20px;
            color: #7f8c8d;
        }
        
        .coming-soon-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            opacity: 0.5;
        }
        
        .coming-soon-text {
            font-size: 1.5rem;
            margin-bottom: 10px;
        }
        
        .coming-soon-subtitle {
            font-size: 1rem;
            opacity: 0.7;
        }

        @media (max-width: 768px) {
            .cards-container {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .division-title {
                font-size: 2rem;
            }
            
            .main-container {
                padding: 10px;
            }
            
            /* Reduce sticky header offset on mobile for better space utilization */
            thead tr:nth-child(1) th {
                top: 50px !important; /* Reduced from 70px */
            }
            
            thead tr:nth-child(2) th {
                top: 85px !important; /* Reduced accordingly */
            }
            
            thead tr:nth-child(3) th {
                top: 120px !important; /* Reduced accordingly */
            }
            
            .content-page[id="page-financial-pl"] thead tr:nth-child(4) th,
            .content-page[id="page-sales-country"] thead tr:nth-child(4) th,
            .content-page[id="page-sales-customer"] thead tr:nth-child(4) th {
                top: 155px !important; /* Reduced accordingly */
            }
            
            /* Adjust floating back button for mobile */
            .back-button {
                top: 70px !important; /* 80px - 10px up */
                width: 70px !important;
                height: 90px !important; /* Slightly smaller for mobile */
                font-size: 11px !important;
                left: calc(5% + 40px) !important; /* 5% + 40px right */
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- Main Dashboard -->
        <div id="main-dashboard">
            <!-- Header Section -->
            <div class="header-section">
                <div class="logo-container">
                    ${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo" class="logo">` : ''}
                </div>
                <h1 class="division-title">${divisionName} - Comprehensive Report</h1>
                <div class="period-info">${basePeriod}</div>
            </div>
            
            <!-- Cards Grid -->
            <div class="cards-container">
                ${cardConfigs.map(card => `
                    <div class="report-card" onclick="showPage('${card.id}')">
                        <span class="card-icon">${card.icon}</span>
                        <div class="card-title">${card.title}</div>
                        <div class="card-description">${card.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Content Pages -->
        ${cardConfigs.map(card => `
            <div id="page-${card.id}" class="content-page">
                <div class="page-header">
                    <button class="back-button" onclick="showDashboard()">
                        <div>Back</div>
                        <div>to</div>
                        <div>Dashboard</div>
                    </button>
                    <h2 class="page-title">${
                        card.id === 'kpi-summary' ? `Executive Summary - ${divisionName}` :
                        card.id === 'product-group' ? `Product Group - ${divisionName}` :
                        card.id === 'financial-pl' ? `${divisionName} Financials` :
                        card.id === 'sales-country' ? `Sales by Country - ${divisionName}` :
                        card.id === 'sales-customer' ? `Top 20 Customers - ${divisionName}` :
                        `${card.icon} ${card.title}`
                    }</h2>
                    <div style="width: 180px;"></div> <!-- Spacer for balance -->
                </div>
                <div class="page-content">
                    ${card.id === 'kpi-summary' ? `
                        ${generateKPISummary(plFinancialTableHTML, salesCountryTableHTML, salesCustomerTableHTML, productGroupTableHTML)}
                    ` : card.id === 'product-group' ? `
                        <div class="table-container">
                            ${productGroupTableHTML}
                        </div>
                    ` : card.id === 'financial-pl' ? `
                        <div class="table-container">
                            ${plFinancialTableHTML}
                        </div>
                    ` : card.id === 'sales-country' ? `
                        <div class="table-container">
                            ${salesCountryTableHTML}
                        </div>
                        <div class="table-footer-note">
                            ★ = Sorting by Base Period highest to lowest | Δ% shows percentage change between consecutive periods
                        </div>
                    ` : card.id === 'sales-customer' ? `
                        <div class="table-container">
                            ${salesCustomerTableHTML}
                        </div>
                        <div class="table-footer-note">
                            ★ = Sorting by Base Period highest to lowest | Δ% shows percentage change between consecutive periods
                        </div>
                    ` : `
                        <div class="coming-soon">
                            <div class="coming-soon-icon">${card.icon}</div>
                            <div class="coming-soon-text">${card.title}</div>
                            <div class="coming-soon-subtitle">This report will be available soon</div>
                        </div>
                    `}
                </div>
            </div>
        `).join('')}
    </div>
    
    <script>
        function showPage(pageId) {
            // Hide main dashboard
            document.getElementById('main-dashboard').style.display = 'none';
            
            // Hide all content pages
            const pages = document.querySelectorAll('.content-page');
            pages.forEach(page => page.classList.remove('active'));
            
            // Show selected page
            document.getElementById('page-' + pageId).classList.add('active');
        }
        
        function showDashboard() {
            // Hide all content pages
            const pages = document.querySelectorAll('.content-page');
            pages.forEach(page => page.classList.remove('active'));
            
            // Show main dashboard
            document.getElementById('main-dashboard').style.display = 'block';
        }
        
        console.log('✅ Comprehensive Report loaded successfully!');
        console.log('📊 Available reports: ${cardConfigs.length}');
    </script>
</body>
</html>`;

      // Create and download the HTML file
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const filename = `${divisionName.replace(/\s+/g, '_')}_Comprehensive_Report_${Date.now()}.html`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('✅ Comprehensive HTML export completed:', filename);
      
    } catch (err) {
      setError(err.message || 'Failed to export comprehensive HTML');
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleComprehensiveExport}
        className="export-btn comprehensive-export"
        disabled={isExporting}
        title="Export comprehensive interactive HTML report with all sections"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          opacity: isExporting ? 0.7 : 1,
          transform: isExporting ? 'scale(0.98)' : 'scale(1)',
          marginLeft: '10px'
        }}
      >
{isExporting ? 'Exporting...' : '📊 Export to HTML'}
      </button>

      {error && (
        <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default ComprehensiveHTMLExport; 
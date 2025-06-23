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

  // Generate comprehensive HTML export
  const handleComprehensiveExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      // Ensure Product Group tab is active first
      await ensureProductGroupTabActive();
      
      const productGroupTableHTML = await captureProductGroupTable();
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
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9rem;
            margin: 0;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        
        .back-button:hover {
            background: #2980b9;
            transform: translateY(-2px);
        }
        
        /* Table Styles */
        .table-container {
            width: 100%;
            max-width: 100%;
            height: 95vh;
            max-height: 95vh;
            overflow: auto;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin: 0 auto;
        }
        
        table {
            width: 100%;
            min-width: 100%;
            border-collapse: collapse;
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
            background-color: #f8f9fa;
            font-weight: bold;
            position: sticky;
            z-index: 10;
        }
        
        /* Freeze first 3 header rows */
        thead tr:nth-child(1) th {
            top: 0;
            z-index: 13;
        }
        
        thead tr:nth-child(2) th {
            top: 35px; /* Height of first row */
            z-index: 12;
        }
        
        thead tr:nth-child(3) th {
            top: 70px; /* Height of first + second row */
            z-index: 11;
        }
        
        .product-header {
            background-color: #1976d2 !important;
            color: white !important;
            font-weight: bold;
        }
        
        .metric-cell {
            font-size: 14px;
        }
        
        .total-header {
            background-color: #f57c00 !important;
            color: white !important;
            font-weight: bold;
        }
        
        /* Headers are center aligned */
        th {
            text-align: center !important;
        }
        
        /* First column data cells left alignment */
        table td:first-child {
            text-align: left !important;
            padding-left: 12px;
        }
        
        /* Product group rows with darker colors */
        .product-header-row td:first-child {
            background-color: #1565c0 !important;
            color: white !important;
            font-weight: bold;
        }
        
        /* Category header rows */
        .category-header-row td:first-child {
            background-color: #37474f !important;
            color: white !important;
            font-weight: bold;
        }
        
        /* Total row */
        .total-header-row td:first-child {
            background-color: #e65100 !important;
            color: white !important;
            font-weight: bold;
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
                    <button class="back-button" onclick="showDashboard()">← Back to Dashboard</button>
                    <h2 class="page-title">${card.id === 'product-group' ? `${divisionName} - Product Group` : `${card.icon} ${card.title}`}</h2>
                    <div style="width: 180px;"></div> <!-- Spacer for balance -->
                </div>
                <div class="page-content">
                    ${card.id === 'product-group' ? `
                        <div class="table-container">
                            ${productGroupTableHTML}
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
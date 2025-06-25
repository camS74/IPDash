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

  // Card configuration: KPI Summary first, then Charts, then Tables
  const cardConfigs = [
    // KPI Summary - First Row
    { id: 'kpi-summary', title: 'KPI Summary', icon: '📈', description: 'Key performance indicators' },
    
    // Charts - Second Row
    { id: 'sales-volume-analysis', title: 'Sales & Volume Analysis', icon: '📊', description: 'Sales and volume trends visualization' },
    { id: 'margin-analysis', title: 'Margin Analysis', icon: '📋', description: 'Profit margin insights' },
    { id: 'manufacturing-cost', title: 'Manufacturing Cost', icon: '🏭', description: 'Direct cost analysis' },
    { id: 'below-gp-expenses', title: 'Below GP Expenses', icon: '📊', description: 'Operating expenses breakdown' },
    { id: 'cost-profitability-trend', title: 'Cost & Profitability Trend', icon: '📈', description: 'Profitability trend analysis' },
    
    // Tables - Third Row (P&L Financial first)
    { id: 'financial-pl', title: 'P&L Financial', icon: '💰', description: 'Profit & Loss statement' },
    { id: 'product-group', title: 'Product Group', icon: '📊', description: 'Product group analysis and metrics' },
    { id: 'sales-country', title: 'Sales by Country', icon: '🌍', description: 'Geographic sales distribution' },
    { id: 'sales-customer', title: 'Sales by Customer', icon: '👥', description: 'Customer sales analysis' }
  ];

  // Capture Product Group table HTML
  const captureProductGroupTable = async () => {
    console.log('🔍 Enhanced table capture - checking for Product Group table...');
    
    // Wait a bit more for table to fully render
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // APPROACH 1: Look for Product Group table by class
    const productGroupTable = document.querySelector('table.product-group-table');
    
    if (productGroupTable) {
      console.log('✅ Found Product Group table directly by class');
      return productGroupTable.outerHTML;
    }
    
    // APPROACH 2: Look for table with product-header-row (unique to Product Group)
    const tableWithProductHeaders = document.querySelector('table .product-header-row')?.closest('table');
    
    if (tableWithProductHeaders) {
      console.log('✅ Found table with product headers');
      return tableWithProductHeaders.outerHTML;
    }
    
    // APPROACH 3: Look for table containing product group specific text
    const allTables = Array.from(document.querySelectorAll('table'));
    console.log('Available tables count:', allTables.length);
    
    const productGroupTableByContent = allTables.find(table => {
      const tableText = table.textContent || '';
      const hasProductGroupContent = tableText.includes('Total Product Group') ||
                                    tableText.includes('Product Group') ||
                                    tableText.includes('Process Categories') ||
                                    tableText.includes('Material Categories') ||
                                    tableText.includes('PE Films') ||
                                    tableText.includes('Laminates') ||
                                    tableText.includes('Shrink');
      
      const hasTableStructure = table.querySelector('thead') && table.querySelector('tbody');
      
      console.log(`Checking table for Product Group content:`, {
        hasProductGroupContent,
        hasTableStructure,
        textPreview: tableText.substring(0, 100)
      });
      
      return hasProductGroupContent && hasTableStructure;
    });
    
    if (productGroupTableByContent) {
      console.log('✅ Found Product Group table by content analysis');
      return productGroupTableByContent.outerHTML;
    }
    
    console.error('❌ No Product Group table found after enhanced search');
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

  // Helper function to capture element as base64 image (same as htmlExport.js)
  const captureElementAsBase64 = async (element, options = {}) => {
    try {
      // Import html2canvas dynamically 
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(element, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        removeContainer: true,
        ignoreElements: (element) => {
          // Ignore elements that might cause artifacts
          return element.classList?.contains('pdf-export-button') || 
                 element.style?.boxShadow?.includes('inset');
        },
        ...options
      });
      
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.warn('Canvas capture resulted in empty image');
        return null;
      }
      
      return canvas.toDataURL('image/jpeg', 0.95);
    } catch (error) {
      console.error('Error capturing element:', error);
      return null;
    }
  };

  // Capture Sales & Volume Chart (Bar Chart) - Following htmlExport.js approach
  const captureSalesVolumeChart = async () => {
    console.log('🔍 Capturing Sales & Volume Chart using htmlExport.js approach...');
    
    try {
      // Find the main chart container - following exact same logic as htmlExport.js
      const mainContainer = document.querySelector('[style*="display: flex"][style*="flex-direction: column"][style*="padding: 16"]');
      
      if (!mainContainer) {
        console.warn('Main chart container not found');
        // Fallback: look for the specific bar chart container
        const fallbackContainer = document.querySelector('.modern-margin-gauge-panel');
        if (fallbackContainer) {
          console.log('Using fallback container');
          const chartImage = await captureElementAsBase64(fallbackContainer, {
            scale: 5.0,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            removeContainer: true,
            width: fallbackContainer.offsetWidth,
            height: fallbackContainer.offsetHeight,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
          });
          
          if (chartImage) {
            return `<div class="chart-container">
                      <img src="${chartImage}" alt="Sales & Volume Chart" style="width: 100%; height: auto; max-width: 100%;">
                    </div>`;
          }
        }
        throw new Error('Chart container not found');
      }

      // Get the first child (Sales and Volume Analysis chart) - same as htmlExport.js
      const children = Array.from(mainContainer.children).filter(child => {
        const rect = child.getBoundingClientRect();
        const hasStyle = child.style.marginTop;
        const isNotAI = !child.textContent.toLowerCase().includes('ai') && 
                        !child.innerHTML.toLowerCase().includes('writeup');
        return rect.width > 300 && rect.height > 200 && hasStyle && isNotAI;
      });

      if (children.length === 0) {
        throw new Error('No valid chart containers found');
      }

      const salesVolumeContainer = children[0]; // First chart = Sales & Volume Analysis
      
      // Hide the internal chart title before capture
      const titleElements = salesVolumeContainer.querySelectorAll('span');
      const originalTitleDisplays = [];
      
      titleElements.forEach((element, index) => {
        const textContent = element.textContent?.trim().toLowerCase();
        const style = element.style;
        
        // Target the specific title spans: "Sales and Volume" (fontSize: 28) and "(AED)" (fontSize: 18)
        if ((textContent === 'sales and volume' && style.fontSize === '28px') ||
            (textContent === '(aed)' && style.fontSize === '18px')) {
          originalTitleDisplays[index] = element.style.display;
          element.style.display = 'none';
          console.log('🚫 Hiding chart title element:', textContent);
        }
      });
      
      // Hide tooltips and resize charts - same as htmlExport.js
      const echartsElements = salesVolumeContainer.querySelectorAll('.echarts-for-react');
      echartsElements.forEach(echartsEl => {
        if (typeof echartsEl.getEchartsInstance === 'function') {
          const inst = echartsEl.getEchartsInstance();
          if (inst) {
            inst.dispatchAction({ type: 'hideTip' });
            inst.resize();
          }
        }
      });

      // Wait for chart to settle
      await new Promise(r => setTimeout(r, 500));

      // Capture with exact same settings as htmlExport.js
      const salesVolumeImage = await captureElementAsBase64(salesVolumeContainer, {
        scale: 5.0,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        width: salesVolumeContainer.offsetWidth,
        height: salesVolumeContainer.offsetHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });

      // Restore chart title visibility
      titleElements.forEach((element, index) => {
        if (originalTitleDisplays[index] !== undefined) {
          element.style.display = originalTitleDisplays[index];
          console.log('✅ Restored chart title element visibility');
        }
      });

      if (salesVolumeImage) {
        console.log('✅ Successfully captured Sales & Volume chart');
        return `<div class="chart-container">
                  <img src="${salesVolumeImage}" alt="Sales & Volume Chart" style="width: 100%; height: auto; max-width: 100%;">
                </div>`;
      } else {
        throw new Error('Failed to capture chart image');
      }

    } catch (error) {
      console.error('Error capturing Sales & Volume chart:', error);
      throw new Error(`Sales & Volume Chart capture failed: ${error.message}`);
    }
  };

  // Capture Margin over Material Chart (Gauge Chart) - Following htmlExport.js approach
  const captureMarginAnalysisChart = async () => {
    console.log('🔍 Capturing Margin over Material Chart using htmlExport.js approach...');
    
    try {
      // Find the main chart container - following exact same logic as htmlExport.js
      const mainContainer = document.querySelector('[style*="display: flex"][style*="flex-direction: column"][style*="padding: 16"]');
      
      if (!mainContainer) {
        console.warn('Main chart container not found');
        // Fallback: look for the specific margin gauge container
        const fallbackContainer = document.querySelector('.modern-margin-gauge-panel');
        if (fallbackContainer) {
          console.log('Using fallback container for margin chart');
          const chartImage = await captureElementAsBase64(fallbackContainer, {
            scale: 5.0,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            removeContainer: true,
            width: fallbackContainer.offsetWidth,
            height: fallbackContainer.offsetHeight,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
          });
          
          if (chartImage) {
            return `<div class="chart-container">
                      <img src="${chartImage}" alt="Margin over Material Chart" style="width: 100%; height: auto; max-width: 100%;">
                    </div>`;
          }
        }
        throw new Error('Margin chart container not found');
      }

      // Get the second child (Margin over Material chart) - same as htmlExport.js
      const children = Array.from(mainContainer.children).filter(child => {
        const rect = child.getBoundingClientRect();
        const hasStyle = child.style.marginTop;
        const isNotAI = !child.textContent.toLowerCase().includes('ai') && 
                        !child.innerHTML.toLowerCase().includes('writeup');
        return rect.width > 300 && rect.height > 200 && hasStyle && isNotAI;
      });

      if (children.length < 2) {
        throw new Error('Margin chart container not found - need at least 2 chart containers');
      }

      const marginContainer = children[1]; // Second chart = Margin over Material
      
      // Hide the internal chart title before capture
      const titleElements = marginContainer.querySelectorAll('h2.modern-gauge-heading');
      const originalTitleDisplays = [];
      
      titleElements.forEach((element, index) => {
        const textContent = element.textContent?.trim().toLowerCase();
        
        // Target the specific title: "Margin over Material"
        if (textContent === 'margin over material') {
          originalTitleDisplays[index] = element.style.display;
          element.style.display = 'none';
          console.log('🚫 Hiding margin chart title element:', textContent);
        }
      });
      
      // Hide tooltips and resize charts - same as htmlExport.js
      const echartsElements = marginContainer.querySelectorAll('.echarts-for-react');
      echartsElements.forEach(echartsEl => {
        if (typeof echartsEl.getEchartsInstance === 'function') {
          const inst = echartsEl.getEchartsInstance();
          if (inst) {
            inst.dispatchAction({ type: 'hideTip' });
            inst.resize();
          }
        }
      });

      // Wait for chart to settle
      await new Promise(r => setTimeout(r, 500));

      // Capture with exact same settings as htmlExport.js
      const marginImage = await captureElementAsBase64(marginContainer, {
        scale: 5.0,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        width: marginContainer.offsetWidth,
        height: marginContainer.offsetHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });

      // Restore chart title visibility
      titleElements.forEach((element, index) => {
        if (originalTitleDisplays[index] !== undefined) {
          element.style.display = originalTitleDisplays[index];
          console.log('✅ Restored margin chart title element visibility');
        }
      });

      if (marginImage) {
        console.log('✅ Successfully captured Margin over Material chart');
        return `<div class="chart-container">
                  <img src="${marginImage}" alt="Margin over Material Chart" style="width: 100%; height: auto; max-width: 100%;">
                </div>`;
      } else {
        throw new Error('Failed to capture margin chart image');
      }

    } catch (error) {
      console.error('Error capturing Margin over Material chart:', error);
      throw new Error(`Margin over Material Chart capture failed: ${error.message}`);
    }
  };

  // Capture Manufacturing Cost Chart - Following htmlExport.js approach  
  const captureManufacturingCostChart = async () => {
    console.log('🔍 Capturing Manufacturing Cost Chart using htmlExport.js approach...');
    
    try {
      // Find the main chart container - following exact same logic as htmlExport.js
      const mainContainer = document.querySelector('[style*="display: flex"][style*="flex-direction: column"][style*="padding: 16"]');
      
      if (!mainContainer) {
        console.warn('Main chart container not found');
        // Fallback: look for the specific manufacturing cost container
        const fallbackContainer = document.querySelector('.modern-margin-gauge-panel');
        if (fallbackContainer) {
          console.log('Using fallback container for manufacturing cost chart');
          const chartImage = await captureElementAsBase64(fallbackContainer, {
            scale: 5.0, // Increased to 5.0 for ultra-high resolution
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            removeContainer: true,
            width: fallbackContainer.offsetWidth,
            height: fallbackContainer.offsetHeight,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
          });
          
          if (chartImage) {
            return `<div class="chart-container">
                      <img src="${chartImage}" alt="Manufacturing Cost Chart" style="width: 100%; height: auto; max-width: 100%;">
                    </div>`;
          }
        }
        throw new Error('Manufacturing Cost chart container not found');
      }

      // Get the third child (Manufacturing Cost chart)
      const children = Array.from(mainContainer.children).filter(child => {
        const rect = child.getBoundingClientRect();
        const hasStyle = child.style.marginTop;
        const isNotAI = !child.textContent.toLowerCase().includes('ai') && 
                        !child.innerHTML.toLowerCase().includes('writeup');
        return rect.width > 300 && rect.height > 200 && hasStyle && isNotAI;
      });

      if (children.length < 3) {
        throw new Error('Manufacturing Cost chart container not found - need at least 3 chart containers');
      }

      const manufacturingContainer = children[2]; // Third chart = Manufacturing Cost
      
      // Hide the internal chart title before capture
      const titleElements = manufacturingContainer.querySelectorAll('h2.modern-gauge-heading');
      const originalTitleDisplays = [];
      
      titleElements.forEach((element, index) => {
        const textContent = element.textContent?.trim().toLowerCase();
        
        // Target the specific title: "Manufacturing Cost"
        if (textContent === 'manufacturing cost') {
          originalTitleDisplays[index] = element.style.display;
          element.style.display = 'none';
          console.log('🚫 Hiding manufacturing cost chart title element:', textContent);
        }
      });
      
      // Hide tooltips and resize charts - same as htmlExport.js
      const echartsElements = manufacturingContainer.querySelectorAll('.echarts-for-react');
      echartsElements.forEach(echartsEl => {
        if (typeof echartsEl.getEchartsInstance === 'function') {
          const inst = echartsEl.getEchartsInstance();
          if (inst) {
            inst.dispatchAction({ type: 'hideTip' });
            inst.resize();
          }
        }
      });

      // Wait longer for chart to settle and render properly
      await new Promise(r => setTimeout(r, 1000));

      // Capture with higher resolution settings
      const manufacturingImage = await captureElementAsBase64(manufacturingContainer, {
        scale: 5.0, // Increased to 5.0 for ultra-high resolution
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        width: manufacturingContainer.offsetWidth,
        height: manufacturingContainer.offsetHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });

      // Restore chart title visibility
      titleElements.forEach((element, index) => {
        if (originalTitleDisplays[index] !== undefined) {
          element.style.display = originalTitleDisplays[index];
          console.log('✅ Restored manufacturing cost chart title element visibility');
        }
      });

      if (manufacturingImage) {
        console.log('✅ Successfully captured Manufacturing Cost chart');
        return `<div class="chart-container">
                  <img src="${manufacturingImage}" alt="Manufacturing Cost Chart" style="width: 100%; height: auto; max-width: 100%;">
                </div>`;
      } else {
        throw new Error('Failed to capture manufacturing cost chart image');
      }

    } catch (error) {
      console.error('Error capturing Manufacturing Cost chart:', error);
      throw new Error(`Manufacturing Cost Chart capture failed: ${error.message}`);
    }
  };

  // Capture Below GP Expenses Chart (Index 3) - Following htmlExport.js approach
  const captureBelowGPExpensesChart = async () => {
    console.log('🔍 Capturing Below GP Expenses Chart...');
    try {
      const mainContainer = document.querySelector('[style*="display: flex"][style*="flex-direction: column"][style*="padding: 16"]');
      if (!mainContainer) throw new Error('Main chart container not found');

      const children = Array.from(mainContainer.children).filter(child => {
        const rect = child.getBoundingClientRect();
        const hasStyle = child.style.marginTop;
        const isNotAI = !child.textContent.toLowerCase().includes('ai') && !child.innerHTML.toLowerCase().includes('writeup');
        return rect.width > 300 && rect.height > 200 && hasStyle && isNotAI;
      });

      if (children.length < 4) throw new Error('Below GP Expenses chart not found - need at least 4 containers');
      const container = children[3]; // Fourth chart

      // Hide internal title
      const titleElements = container.querySelectorAll('h2.modern-gauge-heading');
      const originalDisplays = [];
      titleElements.forEach((el, idx) => {
        if (el.textContent?.trim().toLowerCase() === 'below gross profit expenses') {
          originalDisplays[idx] = el.style.display;
          el.style.display = 'none';
        }
      });

      // Hide tooltips and resize charts
      const echartsElements = container.querySelectorAll('.echarts-for-react');
      echartsElements.forEach(echartsEl => {
        if (typeof echartsEl.getEchartsInstance === 'function') {
          const inst = echartsEl.getEchartsInstance();
          if (inst) {
            inst.dispatchAction({ type: 'hideTip' });
            inst.resize();
          }
        }
      });

      // Wait longer for chart to settle and render properly
      await new Promise(r => setTimeout(r, 1000));
      
      const image = await captureElementAsBase64(container, {
        scale: 5.0, // Increased to 5.0 for ultra-high resolution
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        width: container.offsetWidth,
        height: container.offsetHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });

      // Restore titles
      titleElements.forEach((el, idx) => {
        if (originalDisplays[idx] !== undefined) el.style.display = originalDisplays[idx];
      });

      if (image) {
        console.log('✅ Below GP Expenses chart captured');
        return `<div class="chart-container"><img src="${image}" alt="Below GP Expenses Chart" style="width: 100%; height: auto; max-width: 100%;"></div>`;
      } else {
        throw new Error('Failed to capture image');
      }
    } catch (error) {
      console.error('Below GP Expenses capture error:', error);
      throw new Error(`Below GP Expenses capture failed: ${error.message}`);
    }
  };

  // Capture Cost & Profitability Trend Chart (Index 4) - Following htmlExport.js approach
  const captureCostProfitabilityTrendChart = async () => {
    console.log('🔍 Capturing Cost & Profitability Trend Chart...');
    try {
      const mainContainer = document.querySelector('[style*="display: flex"][style*="flex-direction: column"][style*="padding: 16"]');
      if (!mainContainer) throw new Error('Main chart container not found');

      const children = Array.from(mainContainer.children).filter(child => {
        const rect = child.getBoundingClientRect();
        const hasStyle = child.style.marginTop;
        const isNotAI = !child.textContent.toLowerCase().includes('ai') && !child.innerHTML.toLowerCase().includes('writeup');
        return rect.width > 300 && rect.height > 200 && hasStyle && isNotAI;
      });

      if (children.length < 5) throw new Error('Cost & Profitability chart not found - need at least 5 containers');
      const container = children[4]; // Fifth chart (combinedTrendsRef contains both ExpencesChart + Profitchart)

      // Hide internal titles for both ExpencesChart and Profitchart
      const titleElements = container.querySelectorAll('h2.modern-gauge-heading');
      const originalDisplays = [];
      titleElements.forEach((el, idx) => {
        const text = el.textContent?.trim().toLowerCase();
        if (text?.includes('trend') || text?.includes('expense') || text?.includes('profit')) {
          originalDisplays[idx] = el.style.display;
          el.style.display = 'none';
        }
      });

      await new Promise(r => setTimeout(r, 500));
      const image = await captureElementAsBase64(container, {
        scale: 5.0,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        width: container.offsetWidth,
        height: container.offsetHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });

      // Restore titles
      titleElements.forEach((el, idx) => {
        if (originalDisplays[idx] !== undefined) el.style.display = originalDisplays[idx];
      });

      if (image) {
        console.log('✅ Cost & Profitability Trend chart captured');
        return `<div class="chart-container"><img src="${image}" alt="Cost & Profitability Trend Chart" style="width: 100%; height: auto; max-width: 100%;"></div>`;
      } else {
        throw new Error('Failed to capture image');
      }
    } catch (error) {
      console.error('Cost & Profitability Trend capture error:', error);
      throw new Error(`Cost & Profitability Trend capture failed: ${error.message}`);
    }
  };

  // Generate KPI Summary from captured table data
  // Capture live KPI data from the current active KPIExecutiveSummary component
  const captureLiveKPIData = () => {
    // SKIP LIVE DATA CAPTURE - ALWAYS USE FALLBACK
    console.log('🔧 Skipping live data capture - using fallback structure');
    return null;
  };

  const generateOutstandingKPISummary = (liveKpiData, selectedDivision, basePeriodName) => {
    // If we have live data, use it; otherwise use fallback static data
    const kpiData = liveKpiData || {
      '💰 Financial Performance': [
        { icon: '📈', label: 'Revenue', value: '12.5M', trend: '8% Growth Vs Previous Period', isLarge: false },
        { icon: '💵', label: 'Gross Profit', value: '3.2M', trend: '12% Growth Vs Previous Period', isLarge: false },
        { icon: '💎', label: 'Net Income', value: '1.8M', trend: '15% Growth Vs Previous Period', isLarge: false },
        { icon: '⚡', label: 'EBITDA', value: '2.1M', trend: '10% Growth Vs Previous Period', isLarge: false }
      ],
      '📦 Product Performance': [
        // Row 1: Top Performers by Growth + Total Sales Volume
        { icon: '🏆', label: 'Top Performers by Growth', value: '🥇 Laminates\n23.0% of sales ↗️ 89% growth 🚀\n\n🥈 Shrink Sleeves\n14.9% of sales ↗️ 3% growth 📈\n\n🥉 Shrink Film Printed\n26.8% of sales ↗️ 6% growth 📈', trend: 'ranked by growth performance', isLarge: true, row: 1 },
        { icon: '📊', label: 'Total Sales Volume', value: '3.8K MT', trend: '14% Growth Vs Previous Period', isLarge: false, row: 1 },
        
        // Row 2: Selling Price + MoRM  
        { icon: '⚡', label: 'SELLING PRICE', value: '11.42/kg', trend: '2% Decline Vs Previous Period', isLarge: false, row: 2 },
        { icon: '🎯', label: 'MORM', value: '4.20/kg', trend: '-2% Decline Vs Previous Period', isLarge: false, row: 2 },
        
        // Row 3: Process Categories
        { icon: '', label: 'PRINTED', value: '% of Sales: 80% 📈 10%\n\nAVG Selling Price: 11.50 AED/Kg 📈 5%\n\nAVG MoRM: 5.00 AED/Kg 📈 3%', trend: 'Process Category', isLarge: false, row: 3 },
        { icon: '', label: 'UNPRINTED', value: '% of Sales: 20% 📉 5%\n\nAVG Selling Price: 4.20 AED/Kg 📉 2%\n\nAVG MoRM: 1.50 AED/Kg 📉 1%', trend: 'Process Category', isLarge: false, row: 3 },
        
        // Row 4: Material Categories  
        { icon: '', label: 'PE', value: '% of Sales: 80% 📈 10%\n\nAVG Selling Price: 11.50 AED/Kg 📈 5%\n\nAVG MoRM: 5.00 AED/Kg 📈 3%', trend: 'Material Category', isLarge: false, row: 4 },
        { icon: '', label: 'NON-PE', value: '% of Sales: 20% 📉 5%\n\nAVG Selling Price: 4.20 AED/Kg 📉 2%\n\nAVG MoRM: 1.50 AED/Kg 📉 1%', trend: 'Material Category', isLarge: false, row: 4 }
      ],
      '🌍 Geographic Distribution': [
        { icon: '🏠', label: 'Local (UAE)', value: '45.0%', trend: 'of total sales', isLarge: true },
        { icon: '🌐', label: 'Export', value: '55.0%', trend: 'of total sales', isLarge: true },
        { icon: '🥇', label: 'GCC', value: '25.0%', trend: 'GCC', isLarge: false },
        { icon: '🥈', label: 'Asia-Pacific', value: '15.0%', trend: 'Asia-Pacific', isLarge: false }
      ],
      '👥 Customer Insights': [
        { icon: '⭐', label: 'Top Customer', value: '15.2%', trend: 'of total sales', isLarge: false },
        { icon: '🔝', label: 'Top 3 Customers', value: '35.8%', trend: 'concentration', isLarge: false },
        { icon: '📊', label: 'Top 5 Customers', value: '52.1%', trend: 'concentration', isLarge: false },
        { icon: '💰', label: 'AVG Sales per Customer', value: '250K', trend: 'average value', isLarge: false }
      ]
    };

    const divisionNames = {
      'FP': 'Flexible Packaging',
      'SB': 'Shopping Bags', 
      'TF': 'Thermoforming Products',
      'HCM': 'Preforms and Closures'
    };
    
    const divisionName = divisionNames[selectedDivision?.replace(/-.*$/, '')] || selectedDivision;

      return `
      <style>
        .outstanding-kpi-dashboard {
          background: white;
          min-height: 100vh;
          padding: 40px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          position: relative;
          overflow: hidden;
        }
        
        .outstanding-kpi-dashboard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(120, 119, 198, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .outstanding-back-button {
          position: absolute;
          top: 20px;
          left: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;
          z-index: 10;
        }
        
        .outstanding-back-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .outstanding-kpi-header {
          text-align: center;
          margin-bottom: 50px;
          position: relative;
          z-index: 1;
        }
        
        .outstanding-kpi-title {
          font-size: 3.5em;
          font-weight: 800;
          color: #2c3e50;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          letter-spacing: -1px;
        }
        
        .outstanding-kpi-period {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 8px 20px;
          border-radius: 25px;
          color: white;
          font-weight: 500;
          margin-top: 15px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .outstanding-kpi-section {
          margin-bottom: 45px;
          position: relative;
          z-index: 1;
        }
        
        .outstanding-kpi-section-title {
          font-size: 2em;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 25px 0;
          text-align: center;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        
        .outstanding-kpi-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto 20px auto;
        }
        
        /* Row-specific styling for Product Performance */
        .outstanding-kpi-row-1 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto 20px auto;
        }
        
        .outstanding-kpi-row-2 {
          display: flex;
          justify-content: center;
          gap: 30px;
          max-width: 1000px;
          margin: 0 auto 20px auto;
        }
        
        .outstanding-kpi-row-2 .outstanding-kpi-card {
          flex: 0 0 400px;
          min-width: 350px;
        }
        
        .outstanding-kpi-row-3,
        .outstanding-kpi-row-4 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          max-width: 1000px;
          margin: 0 auto 20px auto;
        }
        
        .outstanding-kpi-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.1),
            0 10px 20px rgba(0,0,0,0.05),
            inset 0 1px 0 rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        
        .outstanding-kpi-card.large {
          grid-column: span 2;
        }
        
        .outstanding-kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
        }
        
        .outstanding-kpi-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 30px 60px rgba(0,0,0,0.15),
            0 15px 30px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.9);
        }
        
        .outstanding-kpi-icon {
          font-size: 3em;
          margin-bottom: 15px;
          display: block;
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
          flex-shrink: 0;
        }
        
        .outstanding-kpi-label {
          font-size: 1.1em;
          font-weight: 600;
          color: #444;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
          flex-shrink: 0;
        }
        
        .outstanding-kpi-value {
          font-size: 2.5em;
          font-weight: 800;
          color: #2d3748;
          margin-bottom: 15px;
          line-height: 1.1;
          word-wrap: break-word;
          white-space: pre-line;
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .outstanding-kpi-card.large .outstanding-kpi-value {
          font-size: 1.4em;
          line-height: 1.4;
          white-space: pre-line;
        }
        
        .outstanding-kpi-trend {
          font-size: 0.95em;
          color: #718096;
          text-align: center;
          font-weight: 500;
          padding: 8px 12px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 12px;
          margin: 10px 0 0 0;
        }
        
        .outstanding-kpi-trend.growth {
          background: rgba(72, 187, 120, 0.1);
          color: #38a169;
        }
        
        .outstanding-kpi-trend.decline {
          background: rgba(245, 101, 101, 0.1);
          color: #e53e3e;
        }
        
        @media (max-width: 768px) {
          .outstanding-kpi-dashboard {
            padding: 20px;
          }
          
          .outstanding-kpi-title {
            font-size: 2.5em;
          }
          
          .outstanding-kpi-cards {
            grid-template-columns: 1fr;
          }
          
          .outstanding-kpi-card.large {
            grid-column: span 1;
          }
        }
        
        .outstanding-watermark {
          position: absolute;
          bottom: 30px;
          right: 30px;
          color: rgba(0,0,0,0.4);
          font-size: 0.9em;
          font-weight: 300;
        }
      </style>
      
      <div class="outstanding-kpi-dashboard">
        <div class="outstanding-back-button" onclick="showDashboard()">
          ← Back to Dashboard
              </div>
        <div class="outstanding-kpi-header">
          <h1 class="outstanding-kpi-title">Executive Dashboard</h1>
          <div class="outstanding-kpi-period">${basePeriodName || 'Current Period'}</div>
          <div style="margin-top: 10px; font-weight: bold; font-style: italic; font-size: 1.1em; color: #666;">(AED)</div>
          </div>

        ${Object.entries(kpiData).map(([sectionTitle, cards]) => {
          // Special handling for Product Performance - group by rows
          if (sectionTitle === '📦 Product Performance') {
            const rowGroups = {};
            cards.forEach(card => {
              const rowNum = card.row || 1;
              if (!rowGroups[rowNum]) rowGroups[rowNum] = [];
              rowGroups[rowNum].push(card);
            });
            
            console.log('🔧 DEBUG: Processing Product Performance with rows:', rowGroups);
            return `
              <div class="outstanding-kpi-section">
                <h2 class="outstanding-kpi-section-title">${sectionTitle}</h2>
                                 ${Object.entries(rowGroups).map(([rowNum, rowCards]) => {
                   console.log(`🔧 DEBUG: Rendering row ${rowNum} with cards:`, rowCards);
                   return `
                   <div class="outstanding-kpi-row-${rowNum}">
                     ${rowCards.map(card => {
                       const trendClass = card.trend.includes('Growth') ? 'growth' : 
                                        card.trend.includes('Decline') ? 'decline' : '';
                       return `
                         <div class="outstanding-kpi-card">
                           <div class="outstanding-kpi-icon">${card.icon}</div>
                           <div class="outstanding-kpi-label">${card.label}</div>
                           <div class="outstanding-kpi-value">${card.value}</div>
                           <div class="outstanding-kpi-trend ${trendClass}">${card.trend}</div>
                         </div>
                       `;
                     }).join('')}
                   </div>`;
                 }).join('')}
              </div>
            `;
          } else {
            // Regular rendering for other sections
            return `
              <div class="outstanding-kpi-section">
                <h2 class="outstanding-kpi-section-title">${sectionTitle}</h2>
                <div class="outstanding-kpi-cards">
                  ${cards.map(card => {
                    const trendClass = card.trend.includes('Growth') ? 'growth' : 
                                     card.trend.includes('Decline') ? 'decline' : '';
                    return `
                      <div class="outstanding-kpi-card ${card.isLarge ? 'large' : ''}">
                        <div class="outstanding-kpi-icon">${card.icon}</div>
                        <div class="outstanding-kpi-label">${card.label}</div>
                        <div class="outstanding-kpi-value">${card.value}</div>
                        <div class="outstanding-kpi-trend ${trendClass}">${card.trend}</div>
              </div>
                    `;
                  }).join('')}
            </div>
          </div>
            `;
          }
        }).join('')}
        
        <div class="outstanding-watermark">
          Intelligence Packaging • Executive Summary
          </div>
        </div>
      `;
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

  // Helper function to ensure Charts tab is active
  const ensureChartsTabActive = () => {
    console.log('🔍 Checking if Charts tab is active...');
    
    // Find the Charts tab specifically
    const allButtons = Array.from(document.querySelectorAll('button, [role="tab"]'));
    const chartsTab = allButtons.find(el => {
      const text = el.textContent?.trim();
      return (text === 'Charts' || text.includes('Chart')) && text.length < 50;
    });
    
    if (!chartsTab) {
      console.warn('⚠️ Charts tab button not found');
      console.log('Available tab-like buttons:', allButtons.map(b => b.textContent?.trim()).filter(t => t && t.length < 50));
      return Promise.resolve();
    }
    
    console.log('🔍 Found Charts tab button:', chartsTab.textContent?.trim());
    
    // Check if it's already active
    const isActive = chartsTab.classList.contains('active') || 
                    chartsTab.getAttribute('aria-selected') === 'true';
                    
    if (!isActive) {
      console.log('🔄 Clicking Charts tab...');
      chartsTab.click();
      // Give it time to mount and render
      return new Promise(resolve => setTimeout(resolve, 2000)); // Longer wait for charts
    } else {
      console.log('✅ Charts tab is already active');
    }
    
    return Promise.resolve();
  };

  // Helper function to ensure KPI tab is active
  const ensureKPITabActive = () => {
    console.log('🔍 Checking if KPI tab is active...');
    
    // Find the KPI tab specifically
    const allButtons = Array.from(document.querySelectorAll('button, [role="tab"]'));
    const kpiTab = allButtons.find(el => {
      const text = el.textContent?.trim();
      return (text === 'KPI' || text === 'Executive Summary' || text.includes('KPI')) && text.length < 50;
    });
    
    if (!kpiTab) {
      console.warn('⚠️ KPI tab button not found');
      console.log('Available tab-like buttons:', allButtons.map(b => b.textContent?.trim()).filter(t => t && t.length < 50));
      return Promise.resolve();
    }
    
    console.log('🔍 Found KPI tab button:', kpiTab.textContent?.trim());
    
    // Check if it's already active
    const isActive = kpiTab.classList.contains('active') || 
                    kpiTab.getAttribute('aria-selected') === 'true';
                    
    if (!isActive) {
      console.log('🔄 Clicking KPI tab...');
      kpiTab.click();
      // Give it time to mount and render
      return new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('✅ KPI tab is already active');
    }
    
    return Promise.resolve();
  };

  // Generate comprehensive HTML export
  const handleComprehensiveExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      // 🎯 FIRST: Capture live KPI data while the user's selection is active
      console.log('🔥 Step 1: Capturing live KPI data...');
      await ensureKPITabActive();
      // const liveKpiData = captureLiveKPIData();
    const liveKpiData = null; // Force use of fallback data
      console.log('✅ Live KPI data captured:', liveKpiData);
      
      // Capture tables by ensuring tabs are active
      await ensureProductGroupTabActive();
      // Add extra wait for Product Group table to fully render with calculations
      await new Promise(resolve => setTimeout(resolve, 2000));
      const productGroupTableHTML = await captureProductGroupTable();
      
      await ensurePLTabActive();
      const plFinancialTableHTML = await capturePLFinancialTable();
      
      await ensureSalesCountryTabActive();
      const salesCountryTableHTML = await captureSalesCountryTable();
      
      await ensureSalesCustomerTabActive();
      const salesCustomerTableHTML = await captureSalesCustomerTable();
      
      // Capture charts
      await ensureChartsTabActive();
      const salesVolumeChartHTML = await captureSalesVolumeChart();
      const marginAnalysisChartHTML = await captureMarginAnalysisChart();
      const manufacturingCostChartHTML = await captureManufacturingCostChart();
      const belowGPExpensesChartHTML = await captureBelowGPExpensesChart();
      const costProfitabilityTrendChartHTML = await captureCostProfitabilityTrendChart();
      
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
            display: flex;
            flex-direction: column;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .card-row {
            display: grid;
            gap: 20px;
        }
        
        .card-row.kpi-row {
            grid-template-columns: 1fr;
            justify-items: center;
        }
        
        .card-row.charts-row {
            grid-template-columns: repeat(5, 1fr);
        }
        
        .card-row.tables-row {
            grid-template-columns: repeat(4, 1fr);
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
        
        .page-title-container {
            flex-grow: 1;
            text-align: center;
        }
        
        .page-title {
            font-size: 1.8rem;
            color: #2c3e50;
            margin: 0;
            line-height: 1.2;
        }
        
        .page-subtitle {
            font-size: 1.2rem;
            color: #7f8c8d;
            margin-top: 5px;
            font-weight: normal;
            font-style: italic;
        }
        
        .back-button {
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
            border: none;
            width: 120px;
            height: 40px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            margin: 0;
            transition: all 0.3s ease;
            flex-shrink: 0;
            z-index: 1000;
            display: flex;
            flex-direction: row;
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
        
        /* Sticky Back Button Container for Table Pages */
        .sticky-back-container {
            position: sticky;
            top: 0;
            background: white;
            padding: 15px 20px;
            border-bottom: 1px solid #e0e0e0;
            z-index: 1001;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Table Title Container */
        .table-title-container {
            padding: 20px 20px 10px 20px;
            text-align: center;
        }
        
        .table-title-container .page-title {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #333;
        }
        
        /* Chart Title Container */
        .chart-title-container {
            padding: 20px 20px 10px 20px;
            text-align: center;
        }
        
        .chart-title-container .page-title {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #333;
        }
        
        .chart-title-container .page-subtitle {
            margin: 5px 0 0 0;
            font-size: 16px;
            color: #666;
            font-weight: normal;
            font-style: italic;
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
            top: 70px; /* Account for sticky back button container height */
            z-index: 13;
        }
        
        thead tr:nth-child(2) th {
            top: 105px; /* 70px sticky back + 35px first row */
            z-index: 12;
        }
        
        thead tr:nth-child(3) th {
            top: 140px; /* 70px sticky back + 70px first two rows */
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
            top: 175px; /* 70px sticky back + 105px first three rows */
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
            top: 70px; /* Account for sticky back button container height */
            z-index: 13;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-country"] thead tr:nth-child(2) th {
            top: 105px; /* 70px sticky back + 35px first row */
            z-index: 12;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-country"] thead tr:nth-child(3) th {
            top: 140px; /* 70px sticky back + 70px first two rows */
            z-index: 11;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-country"] thead tr:nth-child(4) th {
            top: 175px; /* 70px sticky back + 105px first three rows */
            z-index: 10;
            position: sticky;
            font-weight: bold;
        }
        
        /* Sales by Customer Table: Freeze first 4 header rows */
        .content-page[id="page-sales-customer"] thead tr:nth-child(1) th {
            top: 70px; /* Account for sticky back button container height */
            z-index: 13;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-customer"] thead tr:nth-child(2) th {
            top: 105px; /* 70px sticky back + 35px first row */
            z-index: 12;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-customer"] thead tr:nth-child(3) th {
            top: 140px; /* 70px sticky back + 70px first two rows */
            z-index: 11;
            position: sticky;
            font-weight: bold;
        }
        
        .content-page[id="page-sales-customer"] thead tr:nth-child(4) th {
            top: 175px; /* 70px sticky back + 105px first three rows */
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
        
        /* Chart Container Styling */
        .chart-full-container {
            width: 100%;
            height: 95vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
        }
        
        .chart-container {
            width: 100%;
            height: 100%;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Specific styling for margin analysis chart centering */
        .chart-container .modern-margin-gauge-panel {
            width: 100% !important;
            max-width: 90vw !important;
            margin: 0 auto !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
        }
        
        .chart-container .modern-gauge-heading {
            text-align: center !important;
            width: 100% !important;
            margin-bottom: 30px !important;
        }
        
        .chart-container .modern-gauge-container {
            width: 100% !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 15px !important;
            margin: 0 auto !important;
            padding: 0 !important;
        }
        
        .chart-container .modern-gauge-card {
            flex: 0 0 auto !important;
            max-width: 200px !important;
        }
        
        .chart-container img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        /* Chart image styling */
        .chart-container img {
            display: block;
            margin: 0 auto;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Text overlays styling */
        .chart-text-overlays {
            background: rgba(248, 249, 250, 0.95);
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
        }
        
        .text-row {
            margin-bottom: 8px;
        }
        
        .text-row:last-child {
            margin-bottom: 0;
        }
        
        /* For fallback ECharts container */
        .chart-container .echarts-for-react {
            width: 100% !important;
            height: 70vh !important;
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
            
            /* Adjust back button for mobile */
            .back-button {
                width: 100px !important;
                height: 35px !important;
                font-size: 12px !important;
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
                <!-- KPI Summary Row -->
                <div class="card-row kpi-row">
                    ${cardConfigs.filter(card => card.id === 'kpi-summary').map(card => `
                        <div class="report-card" onclick="showPage('${card.id}')">
                            <span class="card-icon">${card.icon}</span>
                            <div class="card-title">${card.title}</div>
                            <div class="card-description">${card.description}</div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Charts Row -->
                <div class="card-row charts-row">
                    ${cardConfigs.filter(card => ['sales-volume-analysis', 'margin-analysis', 'manufacturing-cost', 'below-gp-expenses', 'cost-profitability-trend'].includes(card.id)).map(card => `
                        <div class="report-card" onclick="showPage('${card.id}')">
                            <span class="card-icon">${card.icon}</span>
                            <div class="card-title">${card.title}</div>
                            <div class="card-description">${card.description}</div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Tables Row -->
                <div class="card-row tables-row">
                    ${cardConfigs.filter(card => ['financial-pl', 'product-group', 'sales-country', 'sales-customer'].includes(card.id)).map(card => `
                        <div class="report-card" onclick="showPage('${card.id}')">
                            <span class="card-icon">${card.icon}</span>
                            <div class="card-title">${card.title}</div>
                            <div class="card-description">${card.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Content Pages -->
        ${cardConfigs.map(card => `
            <div id="page-${card.id}" class="content-page">
                <!-- Sticky Back Button (for table and chart pages) -->
                ${['product-group', 'financial-pl', 'sales-country', 'sales-customer', 'sales-volume-analysis', 'margin-analysis', 'manufacturing-cost', 'below-gp-expenses', 'cost-profitability-trend'].includes(card.id) ? `
                    <div class="sticky-back-container">
                        <button class="back-button" onclick="showDashboard()">
                            ← Back to Dashboard
                        </button>
                    </div>
                ` : card.id === 'kpi-summary' ? `
                    <!-- No header for KPI summary - it has its own beautiful header -->
                ` : `
                <div class="page-header">
                    <button class="back-button" onclick="showDashboard()">
                        ← Back to Dashboard
                    </button>
                    <div class="page-title-container">
                        <h2 class="page-title">${
                            card.id === 'product-group' ? `Product Group - ${divisionName}` :
                                card.id === 'financial-pl' ? `P&L-${divisionName}` :
                            card.id === 'sales-country' ? `Sales by Country - ${divisionName}` :
                            card.id === 'sales-customer' ? `Top 20 Customers - ${divisionName}` :
                            card.id === 'sales-volume-analysis' ? `Sales & Volume Analysis - ${divisionName}` :
                            card.id === 'margin-analysis' ? `Margin over Material - ${divisionName}` :
                            card.id === 'manufacturing-cost' ? `Manufacturing Cost - ${divisionName}` :
                            card.id === 'below-gp-expenses' ? `Below GP Expenses - ${divisionName}` :
                            card.id === 'cost-profitability-trend' ? `Cost & Profitability Trend - ${divisionName}` :
                            `${card.icon} ${card.title}`
                        }</h2>
                        ${card.id === 'sales-volume-analysis' ? '<div class="page-subtitle">(AED)</div>' : ''}
                        ${card.id === 'margin-analysis' ? '<div class="page-subtitle">(AED & AED/Kg)</div>' : ''}
                        ${card.id === 'manufacturing-cost' ? '<div class="page-subtitle">(AED)</div>' : ''}
                        ${card.id === 'below-gp-expenses' ? '<div class="page-subtitle">(AED)</div>' : ''}
                        ${card.id === 'cost-profitability-trend' ? '<div class="page-subtitle">(AED)</div>' : ''}
                    </div>
                    <div style="width: 180px;"></div> <!-- Spacer for balance -->
                </div>
                `}
                <div class="page-content">
                    ${card.id === 'kpi-summary' ? `
                        ${generateOutstandingKPISummary(liveKpiData, selectedDivision, basePeriod)}
                    ` : card.id === 'product-group' ? `
                        <div class="table-title-container">
                            <h2 class="page-title">Product Group - ${divisionName}</h2>
                        </div>
                        <div class="table-container">
                            ${productGroupTableHTML}
                        </div>
                    ` : card.id === 'financial-pl' ? `
                        <div class="table-title-container">
                            <h2 class="page-title">P&L-${divisionName}</h2>
                        </div>
                        <div class="table-container">
                            ${plFinancialTableHTML}
                        </div>
                    ` : card.id === 'sales-country' ? `
                        <div class="table-title-container">
                            <h2 class="page-title">Sales by Country - ${divisionName}</h2>
                        </div>
                        <div class="table-container">
                            ${salesCountryTableHTML}
                        </div>
                        <div class="table-footer-note">
                            ★ = Sorting by Base Period highest to lowest | Δ% shows percentage change between consecutive periods
                        </div>
                    ` : card.id === 'sales-customer' ? `
                        <div class="table-title-container">
                            <h2 class="page-title">Top 20 Customers - ${divisionName}</h2>
                        </div>
                        <div class="table-container">
                            ${salesCustomerTableHTML}
                        </div>
                        <div class="table-footer-note">
                            ★ = Sorting by Base Period highest to lowest | Δ% shows percentage change between consecutive periods
                        </div>
                    ` : card.id === 'sales-volume-analysis' ? `
                        <div class="chart-title-container">
                            <h2 class="page-title">Sales & Volume Analysis - ${divisionName}</h2>
                            <div class="page-subtitle">(AED)</div>
                        </div>
                        <div class="chart-full-container">
                            ${salesVolumeChartHTML}
                        </div>
                    ` : card.id === 'margin-analysis' ? `
                        <div class="chart-title-container">
                            <h2 class="page-title">Margin over Material - ${divisionName}</h2>
                            <div class="page-subtitle">(AED & AED/Kg)</div>
                        </div>
                        <div class="chart-full-container">
                            ${marginAnalysisChartHTML}
                        </div>
                    ` : card.id === 'manufacturing-cost' ? `
                        <div class="chart-title-container">
                            <h2 class="page-title">Manufacturing Cost - ${divisionName}</h2>
                            <div class="page-subtitle">(AED)</div>
                        </div>
                        <div class="chart-full-container">
                            ${manufacturingCostChartHTML}
                        </div>
                    ` : card.id === 'below-gp-expenses' ? `
                        <div class="chart-title-container">
                            <h2 class="page-title">Below GP Expenses - ${divisionName}</h2>
                            <div class="page-subtitle">(AED)</div>
                        </div>
                        <div class="chart-full-container">
                            ${belowGPExpensesChartHTML}
                        </div>
                    ` : card.id === 'cost-profitability-trend' ? `
                        <div class="chart-title-container">
                            <h2 class="page-title">Cost & Profitability Trend - ${divisionName}</h2>
                            <div class="page-subtitle">(AED)</div>
                        </div>
                        <div class="chart-full-container">
                            ${costProfitabilityTrendChartHTML}
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
        function scrollAllToTop() {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            ['.main-container', '.content-page', '.page-content', '.table-container'].forEach(function(selector) {
                document.querySelectorAll(selector).forEach(function(el) { el.scrollTop = 0; });
            });
            // Scroll the header/title into view as a last resort
            var header = document.querySelector('.page-header');
            if (header) header.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
        window.onload = scrollAllToTop;
        function showPage(pageId) {
            document.getElementById('main-dashboard').style.display = 'none';
            const pages = document.querySelectorAll('.content-page');
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById('page-' + pageId).classList.add('active');
            scrollAllToTop();
        }
        function showDashboard() {
            const pages = document.querySelectorAll('.content-page');
            pages.forEach(page => page.classList.remove('active'));
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
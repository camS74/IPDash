// HTML Export V2 - Clean Design Inspired by IP Logo Colors
// Simple, professional export without effects

import html2canvas from 'html2canvas';
import ipTransparentLogo from '../assets/IP transparent-.jpg';

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
    console.warn('Could not load IP transparent logo for HTML export V2:', error);
    return null;
  }
};

// Capture element as base64 image
const captureElementAsBase64 = async (element, options = {}) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      removeContainer: true,
      ignoreElements: (element) => {
        return element.classList?.contains('export-button') || 
               element.classList?.contains('html-export-controls');
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

// Clean CSS for V2 - inspired by IP logo colors, no effects
const getCleanCSS = () => `
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Arial', sans-serif;
    background-color: #f8f9fa;
    color: #2c3e50;
    line-height: 1.6;
  }

  .report-container {
    max-width: 1200px;
    margin: 0 auto;
    background: #ffffff;
    min-height: 100vh;
  }

  .header {
    background-color: #34495e;
    color: #ffffff;
    padding: 30px 40px;
    text-align: center;
    border-bottom: 4px solid #2980b9;
  }

  .logo-container {
    margin-bottom: 20px;
  }

  .logo {
    max-height: 80px;
    max-width: 200px;
    object-fit: contain;
  }

  .header h1 {
    font-size: 28px;
    font-weight: 600;
    margin: 15px 0 5px 0;
    color: #ecf0f1;
  }

  .header p {
    font-size: 16px;
    color: #bdc3c7;
    margin: 0;
  }

  .navigation {
    background-color: #ecf0f1;
    padding: 0;
    border-bottom: 2px solid #bdc3c7;
  }

  .nav-tabs {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    flex-wrap: wrap;
  }

  .nav-tab {
    background-color: #95a5a6;
    color: #2c3e50;
    padding: 15px 25px;
    cursor: pointer;
    border-right: 1px solid #7f8c8d;
    font-weight: 500;
    font-size: 14px;
    min-width: 120px;
    text-align: center;
  }

  .nav-tab.active {
    background-color: #2980b9;
    color: #ffffff;
  }

  .nav-tab:hover {
    background-color: #2980b9;
    color: #ffffff;
  }

  .content-section {
    display: none;
    padding: 30px 40px;
    min-height: 600px;
  }

  .content-section.active {
    display: block;
  }

  .section-title {
    font-size: 24px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #3498db;
  }

  .chart-image, .table-image {
    max-width: 100%;
    height: auto;
    border: 1px solid #bdc3c7;
    border-radius: 4px;
    margin: 20px 0;
    display: block;
  }

  .table-wrapper {
    overflow-x: auto;
    margin: 20px 0;
  }

  .info-box {
    background-color: #e8f4fd;
    border-left: 4px solid #3498db;
    padding: 15px 20px;
    margin: 20px 0;
    color: #2c3e50;
  }

  .footer {
    background-color: #34495e;
    color: #ecf0f1;
    text-align: center;
    padding: 20px 40px;
    font-size: 14px;
    border-top: 4px solid #2980b9;
  }

  /* Print styles */
  @media print {
    .navigation {
      display: none;
    }
    .content-section {
      display: block !important;
      page-break-after: always;
    }
    .content-section:last-child {
      page-break-after: auto;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header {
      padding: 20px;
    }
    .content-section {
      padding: 20px;
    }
    .nav-tabs {
      flex-direction: column;
    }
    .nav-tab {
      border-right: none;
      border-bottom: 1px solid #7f8c8d;
    }
  }
</style>
`;

// Simple navigation script without effects
const getNavigationScript = (sections) => `
<script>
  // Simple tab navigation
  function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Remove active from all tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    // Mark tab as active
    const activeTab = document.querySelector('[onclick="showSection(\\''+sectionId+'\\')"]');
    if (activeTab) {
      activeTab.classList.add('active');
    }
  }
  
  // Initialize first tab as active
  document.addEventListener('DOMContentLoaded', function() {
    const firstSection = '${sections[0]?.id || 'charts'}';
    showSection(firstSection);
  });
</script>
`;

// Capture charts and tables
const captureChartsAndTablesV2 = async () => {
  try {
    console.log('🚀 Starting HTML Export V2 capture...');
    
    const capturedData = {
      charts: [],
      tables: [],
      timestamp: new Date().toLocaleString(),
      division: 'Unknown'
    };

    // Get division info
    const divisionSelector = document.querySelector('.division-selector select');
    if (divisionSelector) {
      capturedData.division = divisionSelector.value || 'Unknown';
    }

    // Capture Charts
    const chartView = document.querySelector('[data-tab="Charts"] .chart-view');
    if (chartView) {
      console.log('📊 Capturing charts...');
      const chartImage = await captureElementAsBase64(chartView);
      if (chartImage) {
        capturedData.charts.push({
          title: 'Financial Analysis Charts',
          image: chartImage
        });
      }
    }

    // Capture P&L Table
    const plTable = document.querySelector('[data-tab="P&L"] .table-view');
    if (plTable) {
      console.log('📋 Capturing P&L table...');
      const tableImage = await captureElementAsBase64(plTable);
      if (tableImage) {
        capturedData.tables.push({
          title: 'P&L Financial Table',
          image: tableImage
        });
      }
    }

    // Capture Product Group Table
    const productGroupTable = document.querySelector('[data-tab="Product Group"] .table-view');
    if (productGroupTable) {
      console.log('📊 Capturing Product Group table...');
      const tableImage = await captureElementAsBase64(productGroupTable);
      if (tableImage) {
        capturedData.tables.push({
          title: 'Product Group Analysis',
          image: tableImage
        });
      }
    }

    // Capture Sales by Country Table
    const salesCountryTable = document.querySelector('[data-tab="Sales by Country"] .table-view');
    if (salesCountryTable) {
      console.log('🌍 Capturing Sales by Country table...');
      const tableImage = await captureElementAsBase64(salesCountryTable);
      if (tableImage) {
        capturedData.tables.push({
          title: 'Sales by Country Analysis',
          image: tableImage
        });
      }
    }

    console.log('✅ Capture completed:', capturedData);
    return capturedData;

  } catch (error) {
    console.error('❌ Error in capture process:', error);
    throw error;
  }
};

// Generate HTML report V2
const generateHTMLReportV2 = async (capturedData, logoBase64) => {
  const sections = [
    ...(capturedData.charts.length > 0 ? [{ id: 'charts', title: 'Charts', type: 'charts' }] : []),
    ...(capturedData.tables.length > 0 ? [{ id: 'tables', title: 'Tables', type: 'tables' }] : [])
  ];

  const generateSections = () => {
    let sectionsHTML = '';

    // Charts section
    if (capturedData.charts.length > 0) {
      sectionsHTML += `
        <div id="charts" class="content-section">
          <h2 class="section-title">📊 Financial Analysis Charts</h2>
          <div class="info-box">
            Generated on: ${capturedData.timestamp} | Division: ${capturedData.division}
          </div>
          ${capturedData.charts.map(chart => `
            <div class="chart-container">
              <h3>${chart.title}</h3>
              <img src="${chart.image}" alt="${chart.title}" class="chart-image">
            </div>
          `).join('')}
        </div>
      `;
    }

    // Tables section
    if (capturedData.tables.length > 0) {
      sectionsHTML += `
        <div id="tables" class="content-section">
          <h2 class="section-title">📋 Financial Data Tables</h2>
          <div class="info-box">
            Generated on: ${capturedData.timestamp} | Division: ${capturedData.division}
          </div>
          ${capturedData.tables.map(table => `
            <div class="table-container">
              <h3>${table.title}</h3>
              <div class="table-wrapper">
                <img src="${table.image}" alt="${table.title}" class="table-image">
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    return sectionsHTML;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${capturedData.division} - Financial Report V2</title>
    ${getCleanCSS()}
</head>
<body>
    <div class="report-container">
        <header class="header">
            <div class="logo-container">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo" class="logo">` : ''}
            </div>
            <h1>${capturedData.division} Financial Report</h1>
            <p>Comprehensive Analysis - Generated ${capturedData.timestamp}</p>
        </header>

        ${sections.length > 1 ? `
        <nav class="navigation">
            <ul class="nav-tabs">
                ${sections.map(section => `
                    <li class="nav-tab" onclick="showSection('${section.id}')">${section.title}</li>
                `).join('')}
            </ul>
        </nav>
        ` : ''}

        <main>
            ${generateSections()}
        </main>

        <footer class="footer">
            <p>&copy; ${new Date().getFullYear()} Interplast. All rights reserved. | Report generated on ${capturedData.timestamp}</p>
        </footer>
    </div>

    ${sections.length > 1 ? getNavigationScript(sections) : ''}
</body>
</html>
  `;
};

// Main export function
export const exportHTMLReportV2 = async () => {
  try {
    console.log('🚀 Starting HTML Export V2...');
    
    // Get logo
    const logoBase64 = await getBase64Logo();
    
    // Capture data
    const capturedData = await captureChartsAndTablesV2();
    
    if (capturedData.charts.length === 0 && capturedData.tables.length === 0) {
      throw new Error('No charts or tables found to export');
    }
    
    // Generate HTML
    const html = await generateHTMLReportV2(capturedData, logoBase64);
    
    // Download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${capturedData.division}-Financial-Report-V2_${Date.now()}.html`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ HTML Export V2 completed successfully!');
    return { success: true, filename: link.download };
    
  } catch (error) {
    console.error('❌ HTML Export V2 failed:', error);
    throw error;
  }
};

export default exportHTMLReportV2; 
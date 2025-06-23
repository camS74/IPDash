import React, { useState } from 'react';
import jsPDF from 'jspdf';
import './HTMLExport.css';

const ProductGroupHTMLExport = ({ tableRef, selectedDivision }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // New test function for HTML export with frozen headers
  const handleTestHTMLExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const tableContainer = tableRef.current;
      if (!tableContainer) throw new Error('Table container not found');

      console.log('Exporting actual HTML table with frozen headers...');
      
      // Get the actual table HTML instead of image
      const table = tableContainer.querySelector('table');
      if (!table) throw new Error('Table element not found');
      
      const tableHTML = table.outerHTML;
      console.log('Table HTML extracted, length:', tableHTML.length);
      
      // Get computed styles from current stylesheets - filter for table-related styles only
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .filter(rule => {
                const ruleText = rule.cssText.toLowerCase();
                return ruleText.includes('table') || 
                       ruleText.includes('td') || 
                       ruleText.includes('th') || 
                       ruleText.includes('tr') || 
                       ruleText.includes('product-header') ||
                       ruleText.includes('category-header') ||
                       ruleText.includes('total-header') ||
                       ruleText.includes('.table-') ||
                       ruleText.includes('thead') ||
                       ruleText.includes('tbody');
              })
              .map(rule => rule.cssText)
              .join('\n');
          } catch (e) {
            console.warn('Could not access stylesheet:', e);
            return '';
          }
        })
        .join('\n');
      
      console.log('Table-related styles extracted, length:', styles.length);
      
             // Create HTML with frozen headers and scrollable content
       const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Group Table - ${selectedDivision.split('-')[0]}</title>
    <style>
      /* Include existing styles */
      ${styles}
      
      /* Override and add specific styles for frozen headers */
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: #ffffff;
        min-height: 100vh;
        padding: 0;
        margin: 0;
      }
      
      .container {
        width: 100vw;
        margin: 0;
        background: white;
        overflow: hidden;
        height: 100vh;
        display: flex;
        flex-direction: column;
      }
      
      .page-header {
        background: #003366;
        color: white;
        padding: 12px 20px;
        text-align: center;
        position: sticky;
        top: 0;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .page-header h1 {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 4px 0;
      }
      
      .page-header p {
        font-size: 12px;
        opacity: 0.9;
        margin: 0;
      }
      
      .table-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: auto;
        background: white;
        position: relative;
      }
      
      /* Frozen headers for table */
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      
      /* Freeze ALL 3 header rows seamlessly stacked */
      
      /* Ensure consistent row heights for calculations */
      table tr {
        height: auto !important;
        line-height: 1.2 !important;
      }
      
      /* First header row (Year row) - stays at top */
      table thead tr:first-child,
      table thead tr:first-child th,
      table thead tr:first-child td {
        position: sticky !important;
        top: 0 !important;
        z-index: 1003 !important;
        margin: 0 !important;
        padding: 8px !important;
        border-spacing: 0 !important;
      }
      
      /* Second header row (Month row) - directly below first */
      table thead tr:nth-child(2),
      table thead tr:nth-child(2) th,
      table thead tr:nth-child(2) td {
        position: sticky !important;
        top: var(--first-row-height, 42px) !important;
        z-index: 1002 !important;
        margin: 0 !important;
        padding: 8px !important;
        border-spacing: 0 !important;
      }
      
      /* Third header row (Type row) - directly below second */
      table thead tr:nth-child(3),
      table thead tr:nth-child(3) th,
      table thead tr:nth-child(3) td {
        position: sticky !important;
        top: var(--first-two-rows-height, 84px) !important;
        z-index: 1001 !important;
        margin: 0 !important;
        padding: 8px !important;
        border-spacing: 0 !important;
      }
      
      /* ONLY freeze specific product group headers - not data rows */
      tr[style*="background-color: rgb(173, 216, 230)"],
      tr[class*="product-header"]:not([class*="data"]):not([class*="row"]) {
        position: sticky !important;
        top: var(--header-height, 126px) !important;
        z-index: 999 !important;
      }
      
      /* Remove sticky from any data rows to prevent accidental freezing */
      tr[class*="data"],
      tr:not([class*="header"]):not([class*="total"]):not([class*="category"]) td:first-child {
        position: static !important;
      }
      
      /* Custom scrollbar */
      .table-container::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      
      .table-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 6px;
      }
      
      .table-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 6px;
      }
      
      .table-container::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
      
      .table-container::-webkit-scrollbar-corner {
        background: #f1f1f1;
      }
      
      /* Scroll indicator */
      .scroll-indicator {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #003366;
        color: white;
        padding: 10px 15px;
        border-radius: 25px;
        font-size: 12px;
        box-shadow: 0 4px 15px rgba(0,51,102,0.3);
        opacity: 0.8;
        pointer-events: none;
      }
    </style>
</head>
<body>
    <div class="container">
        <div class="page-header">
            <h1>Product Group Table - ${selectedDivision.split('-')[0]}</h1>
        </div>
        
        <div class="table-container">
            ${tableHTML}
        </div>
    </div>
    
    <script>
      // Calculate actual header heights dynamically to prevent gaps
      function setupStickyHeaders() {
        const table = document.querySelector('table');
        if (!table) return;
        
        const headerRows = table.querySelectorAll('thead tr');
        if (headerRows.length >= 3) {
          // Get actual heights of header rows
          const firstRowHeight = headerRows[0].offsetHeight;
          const secondRowHeight = headerRows[1].offsetHeight;
          const thirdRowHeight = headerRows[2].offsetHeight;
          
          // Update CSS variables with precise measurements
          document.documentElement.style.setProperty('--first-row-height', firstRowHeight + 'px');
          document.documentElement.style.setProperty('--first-two-rows-height', (firstRowHeight + secondRowHeight) + 'px');
          document.documentElement.style.setProperty('--header-height', (firstRowHeight + secondRowHeight + thirdRowHeight) + 'px');
          
          console.log('📏 Header heights calculated:', {
            first: firstRowHeight + 'px',
            second: secondRowHeight + 'px', 
            third: thirdRowHeight + 'px',
            stackedTotal: (firstRowHeight + secondRowHeight + thirdRowHeight) + 'px'
          });
          
          // Force reapply styles after measurement
          setTimeout(() => {
            headerRows.forEach(row => {
              row.style.transform = 'translateZ(0)'; // Force repaint
            });
          }, 10);
        }
      }

      console.log('✅ Interactive Product Group table loaded successfully!');
      console.log('🔄 Setting up dynamic header heights...');
      
      // Run header setup when page loads
      document.addEventListener('DOMContentLoaded', setupStickyHeaders);
      window.addEventListener('resize', setupStickyHeaders);
      
      // Run immediately if DOM is already loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupStickyHeaders);
      } else {
        setupStickyHeaders();
      }
      
      // Debug: Check what header elements we have after setup
      setTimeout(() => {
        console.log('🔍 Checking header positioning after dynamic setup...');
        
        const allHeaders = document.querySelectorAll('thead tr');
        console.log('Found header rows:', allHeaders.length);
        
        allHeaders.forEach((header, idx) => {
          const styles = window.getComputedStyle(header);
          console.log(\`📍 Header Row \${idx + 1}:\`, {
            position: styles.position,
            top: styles.top,
            zIndex: styles.zIndex,
            height: header.offsetHeight + 'px'
          });
        });
        
        // Test scroll behavior
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
          console.log('📊 Scroll info:', {
            scrollHeight: tableContainer.scrollHeight + 'px',
            clientHeight: tableContainer.clientHeight + 'px',
            isScrollable: tableContainer.scrollHeight > tableContainer.clientHeight
          });
        }
      }, 1500);
    </script>
</body>
</html>
       `;

             // Create and download the HTML file
       console.log('Creating interactive HTML file with table HTML length:', tableHTML.length);
       
       const blob = new Blob([html], { type: 'text/html' });
       const url = URL.createObjectURL(blob);
       
       const link = document.createElement('a');
       link.href = url;
       const filename = `ProductGroup_Interactive_${Date.now()}.html`;
       link.download = filename;
       
       console.log('Downloading interactive file:', filename);
       
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       
       URL.revokeObjectURL(url);
       
       console.log('✅ Interactive HTML export completed successfully!');
      
    } catch (err) {
      setError(err.message || 'Failed to export test HTML');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to get table header height
  const getTableHeaderHeight = (table, scale = 1) => {
    const headerRow = table.querySelector('thead tr, tr:first-child');
    if (!headerRow) return 0;
    return Math.round(headerRow.offsetHeight * scale);
  };

  // Helper to get product group header boundaries (Y positions in px)
  const getProductGroupBoundaries = (table, scale = 1) => {
    // Only main product group headers (not total/category)
    const headerRows = Array.from(table.querySelectorAll('tr.product-header-row'))
      .filter(row =>
        !row.classList.contains('total-header-row') &&
        !row.classList.contains('category-header-row')
      );
    if (headerRows.length === 0) return [0];
    // Get offsetTop relative to table
    const tableRect = table.getBoundingClientRect();
    const boundaries = headerRows.map(row => {
      const rect = row.getBoundingClientRect();
      return Math.round((rect.top - tableRect.top) * scale);
    });
    // Always include 0 (start) and table height (end)
    return [0, ...boundaries.slice(1), Math.round(table.offsetHeight * scale)];
  };

  // Helper to render table header separately
  const renderTableHeader = async (table, scale) => {
    const html2canvas = (await import('html2canvas')).default;
    const headerRow = table.querySelector('thead tr, tr:first-child');
    if (!headerRow) return null;
    return await html2canvas(headerRow, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
  };

  // Check if a slice starts with a header row
  const sliceStartsWithHeader = (table, startY, scale) => {
    const headerRows = Array.from(table.querySelectorAll('tr.product-header-row, thead tr, tr:first-child'));
    const tolerance = 5 * scale; // 5px tolerance
    return headerRows.some(row => {
      const rect = row.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      const rowTop = Math.round((rect.top - tableRect.top) * scale);
      return Math.abs(rowTop - startY) <= tolerance;
    });
  };

  // Main export logic
  const handleExportCanvas = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const tableContainer = tableRef.current;
      const table = tableContainer.querySelector('table');
      if (!table) throw new Error('Table not found');

      // Get measurements BEFORE rendering canvas
      const scale = 2;
      const boundaries = getProductGroupBoundaries(table, scale);
      const headerHeight = getTableHeaderHeight(table, scale);

      // Render main table canvas
      const canvas = await html2canvas(table, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Render header separately for reuse
      const headerCanvas = await renderTableHeader(table, scale);

      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const pageContentHeight = pageHeight - 40;
      const pxPerMm = canvas.width / imgWidth;
      const pageContentHeightPx = pageContentHeight * pxPerMm;
      
      // Adjust available height to account for repeated headers
      const headerHeightMm = headerCanvas ? (headerHeight / pxPerMm) : 0;
      const availableContentHeightPx = pageContentHeightPx - (headerCanvas ? headerHeight : 0);

      // Build slices: always break at product group boundaries
      let slices = [];
      let startY = 0;
      while (startY < canvas.height) {
        // Find the furthest boundary that fits on this page
        let endY = boundaries.find(b => b > startY && b - startY > 10 && b - startY <= availableContentHeightPx);
        if (!endY) {
          // If no boundary fits, force a page at max height (emergency break)
          endY = Math.min(startY + availableContentHeightPx, canvas.height);
        }
        slices.push({ startY, endY });
        startY = endY;
      }

      // Add each slice to PDF
      for (let i = 0; i < slices.length; i++) {
        if (i > 0) {
            doc.addPage();
        }
        // Add page title
            doc.setFontSize(16);
        doc.text(
          `Product Group - ${selectedDivision.split('-')[0]}${slices.length > 1 ? ` (Page ${i + 1})` : ''}`,
          pageWidth / 2,
          15,
          { align: 'center' }
        );
        let currentY = 25;
        // Add table header if we have one and this slice doesn't start with a header
        if (headerCanvas && !sliceStartsWithHeader(table, slices[i].startY, scale)) {
          const headerImgData = headerCanvas.toDataURL('image/png');
          doc.addImage(headerImgData, 'PNG', 10, currentY, imgWidth, headerHeightMm);
          currentY += headerHeightMm;
        }
        // Add the slice content
        const { startY, endY } = slices[i];
        const sliceHeight = endY - startY;
        // Create canvas for this slice
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
          const pageCtx = pageCanvas.getContext('2d');
        pageCtx.drawImage(canvas, 0, startY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
          const pageImgData = pageCanvas.toDataURL('image/png');
        const imgHeight = (sliceHeight / pxPerMm);
        doc.addImage(pageImgData, 'PNG', 10, currentY, imgWidth, imgHeight);
        }
      doc.save(`ProductGroup_Canvas_${Date.now()}.pdf`);
    } catch (err) {
      setError(err.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="html-export-controls">
        <button 
          onClick={handleExportCanvas}
          disabled={isExporting}
          className="export-pdf-btn"
          style={{ backgroundColor: '#FF6B35', marginRight: '10px' }}
          title="HTML to canvas to PDF"
        >
        {isExporting ? 'Exporting PDF...' : 'Export to PDF'}
        </button>
        
        <button 
          onClick={handleTestHTMLExport}
          disabled={isExporting}
          className="export-pdf-btn"
          style={{ backgroundColor: '#2E865F' }}
          title="Test HTML export with frozen headers and scrolling"
        >
        {isExporting ? 'Exporting Test...' : 'Test HTML Export'}
        </button>
        
      {error && (
        <div className="export-error" style={{ marginTop: '10px', color: 'red', fontSize: '12px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default ProductGroupHTMLExport;
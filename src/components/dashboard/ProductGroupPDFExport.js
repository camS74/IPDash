import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './PDFExport.css';

// Enhanced color helper
const rgbToHex = (rgbString) => {
  if (!rgbString || rgbString === 'transparent' || rgbString.includes('rgba(0, 0, 0, 0)')) {
    return null;
  }
  const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#FFFFFF';
  const [, r, g, b] = match.map(Number);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

// Function to determine if a color is light or dark
const isLightColor = (hexColor) => {
  if (!hexColor || hexColor === '#FFFFFF') return true;
  
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance using the standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if light (luminance > 0.5), false if dark
  return luminance > 0.5;
};

// Smart orientation based on actual table analysis
const determineOptimalOrientation = (table) => {
  if (!table) return 'landscape';
  
  const headerCells = table.querySelectorAll('thead tr:first-child th, thead tr:first-child td');
  const columnCount = headerCells.length;
  const tableWidth = table.offsetWidth;
  
  // Product Group tables are typically wide with many period columns
  // Force landscape if more than 5 columns or table is very wide
  if (columnCount > 5 || tableWidth > 800) {
    return 'landscape';
  }
  
  return 'portrait';
};

// Enhanced delta content processing with fallback characters
const processDeltaContent = (element) => {
  if (!element) return '';
  
  const originalText = element.textContent.trim();
  
  // Handle delta header columns - check what the actual content is
  if (element.textContent.includes('\u0394') || element.textContent.includes('Δ')) {
    // If it's just the delta symbol without %, return just the delta
    if (originalText === 'Δ' || originalText === '\u0394') {
      return 'Δ';
    }
    // If it contains % already, preserve it
    if (originalText.includes('%')) {
      return originalText.replace('\u0394', 'Δ');
    }
    // Otherwise, just return the delta symbol
    return 'Δ';
  }
  
  // Check if this is a delta cell with div structure
  if (element.classList.contains('delta-cell')) {
    // Look for the flex div structure: <div><span>arrow</span><span>percentage</span></div>
    const flexDiv = element.querySelector('div[style*="display: flex"]');
    if (flexDiv) {
      const spans = flexDiv.querySelectorAll('span');
      if (spans.length >= 2) {
        const arrowSpan = spans[0];
        const percentageSpan = spans[1];
        
        const arrow = arrowSpan.textContent.trim();
        const percentage = percentageSpan.textContent.trim();
        
        // Convert to ASCII arrows that work in PDF
        let pdfArrow = arrow;
        if (arrow === '▲' || arrow === '\u2191' || arrow === '↑') {
          pdfArrow = '^'; // ASCII up arrow
        } else if (arrow === '▼' || arrow === '\u2193' || arrow === '↓') {
          pdfArrow = 'v'; // ASCII down arrow
        }
        
        return `${pdfArrow} ${percentage}`;
      }
    }
    
    // Fallback: parse entire text content
    const text = element.textContent || '';
    
    // Handle all possible arrow variations
    const arrowPatterns = [
      /([▲▼↑↓])\s*([+-]?\d+\.?\d*%?)/,
      /([▲▼↑↓])\s*([+-]?\d+\.?\d*)/,
      /(up|down)\s*([+-]?\d+\.?\d*%?)/i
    ];
    
    for (const pattern of arrowPatterns) {
      const arrowMatch = text.match(pattern);
      if (arrowMatch) {
        const arrow = arrowMatch[1];
        let percentage = arrowMatch[2];
        
        // Only add % if it's actually a percentage and doesn't already have it
        if (!percentage.includes('%') && /^\d+\.?\d*$/.test(percentage)) {
          percentage += '%';
        }
        
        // Use ASCII arrows for PDF compatibility
        let pdfArrow = '^'; // default up
        if (arrow === '▼' || arrow === '\u2193' || arrow === '↓' || arrow.toLowerCase() === 'down') {
          pdfArrow = 'v';
        }
        
        // Handle sign formatting - only add + if it's not already there
        const sign = percentage.startsWith('-') ? '' : percentage.startsWith('+') ? '' : '';
        return `${pdfArrow} ${sign}${percentage}`;
      }
    }
    
    // Handle simple N/A case
    if (text.trim() === 'N/A') {
      return 'N/A';
    }
  }
  
  // Clean up any remaining Unicode characters that might cause issues
  let cleanText = originalText;
  
  // Replace common problematic Unicode characters with ASCII equivalents
  cleanText = cleanText
    .replace(/\u0394/g, 'Δ')         // Keep Delta symbol as is
    .replace(/\u2191/g, '^')         // Up arrow
    .replace(/\u2193/g, 'v')         // Down arrow
    .replace(/▲/g, '^')              // Up triangle
    .replace(/▼/g, 'v')              // Down triangle
    .replace(/↑/g, '^')              // Up arrow
    .replace(/↓/g, 'v')              // Down arrow
    .replace(/[""]/g, '"')           // Replace smart quotes with regular quotes
    .replace(/['']/g, "'")           // Replace smart apostrophes
    .replace(/[…]/g, '...')          // Replace ellipsis
    .replace(/[–—]/g, '-');          // Replace em/en dashes with hyphens
  
  return cleanText;
};

// Function to count rows for each product group
const analyzeProductGroupStructure = (tableBody) => {
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  const productGroups = [];
  let currentGroup = null;
  
  rows.forEach((row, index) => {
    const firstCell = row.querySelector('td:first-child, th:first-child');
    if (!firstCell) return;
    
    const cellText = firstCell.textContent.trim();
    const hasHeaderClass = firstCell.classList.contains('product-header') || 
                          firstCell.classList.contains('row-label') ||
                          row.classList.contains('product-header-row');
    
    // Enhanced detection for product group headers
    const sectionHeaders = [
      'Commercial Items Plain',
      'Commercial Items Printed', 
      'Industrial Items Plain',
      'Industrial Items Printed',
      'Laminates',
      'Mono Layer Printed',
      'Supplies/Raw',
      'UnPrinted',
      'Printed',
      'Films',
      'Bags',
      'Shopping Bags',
      'Flexible Packaging',
      'Thermoforming',
      'Preforms',
      'Closures'
    ];
    
    const isProductGroupHeader = hasHeaderClass || 
      sectionHeaders.some(header => 
        cellText.includes(header) || 
        cellText.toLowerCase().includes(header.toLowerCase())
      );
    
    if (isProductGroupHeader) {
      // If we have a current group, save it
      if (currentGroup) {
        currentGroup.endIndex = index - 1;
        currentGroup.rowCount = currentGroup.endIndex - currentGroup.startIndex + 1;
        productGroups.push(currentGroup);
      }
      
      // Start new group
      currentGroup = {
        name: cellText,
        startIndex: index,
        endIndex: null,
        rowCount: 0
      };
      
      console.log(`[Product Group Structure] Found group header: "${cellText}" at row ${index}`);
    }
  });
  
  // Don't forget the last group
  if (currentGroup) {
    currentGroup.endIndex = rows.length - 1;
    currentGroup.rowCount = currentGroup.endIndex - currentGroup.startIndex + 1;
    productGroups.push(currentGroup);
  }
  
  console.log(`[Product Group Structure] Analyzed ${productGroups.length} product groups:`);
  productGroups.forEach(group => {
    console.log(`  - "${group.name}": rows ${group.startIndex}-${group.endIndex} (${group.rowCount} rows)`);
  });
  
  return productGroups;
};

// Intelligent separator detection for page breaks
const findSeparatorRows = (tableBody) => {
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  const separatorIndices = [];
  
  rows.forEach((row, index) => {
    // Check for actual separator rows with white space
    if (row.classList.contains('separator-row')) {
      separatorIndices.push(index);
      return;
    }
    
    // Check for product group header rows (section boundaries)
    const firstCell = row.querySelector('td:first-child, th:first-child');
    if (firstCell) {
      const cellText = firstCell.textContent.trim();
      
      // Enhanced section headers detection including all possible product group categories
      const sectionHeaders = [
        'Commercial Items Plain',
        'Commercial Items Printed', 
        'Industrial Items Plain',
        'Industrial Items Printed',
        'Laminates',
        'Mono Layer Printed',
        'Supplies/Raw',
        'Total',
        // Additional common product group headers
        'UnPrinted',
        'Printed',
        'Films',
        'Bags',
        'Shopping Bags',
        'Flexible Packaging',
        'Thermoforming',
        'Preforms',
        'Closures'
      ];
      
      // Check for exact matches or partial matches for flexibility
      const isHeaderRow = sectionHeaders.some(header => 
        cellText.includes(header) || 
        cellText.toLowerCase().includes(header.toLowerCase())
      );
      
      // Also check for product-header class or row-label class
      const hasHeaderClass = firstCell.classList.contains('product-header') || 
                            firstCell.classList.contains('row-label') ||
                            firstCell.classList.contains('category-header') ||
                            row.classList.contains('product-header-row');
      
      if (isHeaderRow || hasHeaderClass) {
        separatorIndices.push(index);
        console.log(`[Product Group PDF] Found separator at row ${index}: "${cellText}"`);
      }
    }
    
    // Also check for rows that might be logical section breaks (empty or minimal content)
    const cells = Array.from(row.querySelectorAll('td, th'));
    const hasMinimalContent = cells.length > 0 && cells.every(cell => {
      const text = cell.textContent.trim();
      return text === '' || text === '-' || text === '0' || text === '0.00';
    });
    
    if (hasMinimalContent && !separatorIndices.includes(index)) {
      separatorIndices.push(index);
      console.log(`[Product Group PDF] Found empty separator at row ${index}`);
    }
  });
  
  console.log(`[Product Group PDF] Total separator points found: ${separatorIndices.length}`);
  return separatorIndices;
};

// Enhanced cell processing with proper styling
const processProductGroupCell = (data, scaleFactor) => {
  const cell = data.cell.raw;
  if (!cell) return;
  
  const styles = window.getComputedStyle(cell);
  
  // Handle empty header cell (top-left corner)
  if (data.row.section === 'head' && data.row.index === 0 && data.column.index === 0) {
    data.cell.styles.lineWidth = { top: 0, left: 0, right: 0.1, bottom: 0.1 };
    data.cell.styles.fillColor = '#FFFFFF';
    data.cell.text = [''];
    return;
  }
  
  // Process delta content for special cells
  if (cell.classList.contains('delta-cell') || 
      cell.textContent.includes('▲') || cell.textContent.includes('▼') || 
      cell.textContent.includes('Δ') || cell.textContent.includes('\u0394') ||
      cell.textContent.includes('↑') || cell.textContent.includes('↓')) {
    
    const originalContent = cell.textContent;
    const processedContent = processDeltaContent(cell);
    
    console.log(`[PDF Debug] Delta cell - Original: "${originalContent}" → Processed: "${processedContent}"`);
    
    data.cell.text = [processedContent];
    
    // Extract and preserve the color from delta cells
    const flexDiv = cell.querySelector('div[style*="display: flex"]');
    if (flexDiv) {
      const spans = flexDiv.querySelectorAll('span');
      console.log(`[PDF Debug] Found ${spans.length} spans in delta cell`);
      
      const colorSpan = flexDiv.querySelector('span[style*="color"]');
      if (colorSpan) {
        const spanStyles = window.getComputedStyle(colorSpan);
        const deltaColor = rgbToHex(spanStyles.color);
        console.log(`[PDF Debug] Delta color extracted: ${deltaColor}`);
        if (deltaColor) {
          data.cell.styles.textColor = deltaColor;
        }
      }
    }
  }
  
  // Header row styling - smart text color based on background
  if (data.row.section === 'head') {
    const bgColor = rgbToHex(styles.backgroundColor);
    let headerBgColor = bgColor;
    
    if (!headerBgColor || headerBgColor === '#FFFFFF') {
      // Default header colors for Product Group
      headerBgColor = '#288cfa'; // Blue
    }
    
    data.cell.styles.fillColor = headerBgColor;
    
    // Smart text color based on background brightness
    const textColor = isLightColor(headerBgColor) ? '#000000' : '#FFFFFF';
    data.cell.styles.textColor = textColor;
    
    data.cell.styles.fontStyle = 'bold';
    data.cell.styles.halign = 'center';
    data.cell.styles.valign = 'middle';
    
    console.log(`[PDF Debug] Header cell - BG: ${headerBgColor}, Text: ${textColor}`);
    return;
  }
  
  // Product group header rows (Commercial Items Plain, etc.)
  if (cell.classList.contains('product-header') || cell.classList.contains('row-label')) {
    const bgColor = '#f0f8ff';
    data.cell.styles.fillColor = bgColor;
    data.cell.styles.fontStyle = 'bold';
    data.cell.styles.textColor = isLightColor(bgColor) ? '#000000' : '#FFFFFF';
    data.cell.styles.halign = 'left';
  }
  
  // Total section styling
  else if (cell.classList.contains('total-header') || cell.textContent.trim() === 'Total') {
    const bgColor = '#1a365d';
    data.cell.styles.fillColor = bgColor;
    data.cell.styles.textColor = isLightColor(bgColor) ? '#000000' : '#FFFFFF';
    data.cell.styles.fontStyle = 'bold';
  }
  
  // Category headers (UnPrinted, Printed, etc.)
  else if (cell.classList.contains('category-header')) {
    const bgColor = '#b3d9ff';
    data.cell.styles.fillColor = bgColor;
    data.cell.styles.fontStyle = 'bold';
    data.cell.styles.textColor = isLightColor(bgColor) ? '#000000' : '#FFFFFF';
  }
  
  // Delta cells special styling
  else if (cell.classList.contains('delta-cell')) {
    data.cell.styles.fillColor = '#f8f9fa';
    data.cell.styles.halign = 'center';
    data.cell.styles.fontStyle = 'bold';
    data.cell.styles.valign = 'middle';
    
    // For delta cells, the color was already set above during content processing
    // If not set, use default color
    if (!data.cell.styles.textColor) {
      data.cell.styles.textColor = '#000000';
    }
  }
  
  // Regular data cells
  else {
    const bgColor = rgbToHex(styles.backgroundColor);
    if (bgColor && bgColor !== '#FFFFFF') {
      data.cell.styles.fillColor = bgColor;
    }
    data.cell.styles.halign = 'center';
    data.cell.styles.textColor = '#000000';
  }
  
  // Apply scaling to font size
  const baseFontSize = 8; // Base size for readability
  data.cell.styles.fontSize = Math.max(baseFontSize * scaleFactor, 6);
  
  // Standard cell properties
  data.cell.styles.valign = 'middle';
  data.cell.styles.lineWidth = 0.1;
  data.cell.styles.lineColor = '#DDDDDD';
};

const ProductGroupPDFExport = ({ tableRef, selectedDivision }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExportToPDF = () => {
    setIsExporting(true);
    setError(null);

    try {
      // Better table detection - look for the actual table element
      const tableContainer = tableRef.current;
      if (!tableContainer) {
        throw new Error('Table container not found.');
      }
      
      // Find the actual table element
      const table = tableContainer.querySelector('table.financial-table, table.product-group-table, table');
      if (!table) {
        throw new Error('Product Group table not found for export.');
      }

      console.log('[Product Group PDF] Found table:', table.className);

      // Smart orientation detection
      const orientation = determineOptimalOrientation(table);
      const format = 'a3'; // Always use A3 for better space
      
      console.log(`[Product Group PDF] Using ${orientation} orientation with ${format} format`);

      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format,
      });
      
      // Use default font that supports basic ASCII characters
      doc.setFont('helvetica', 'normal');
      
      // Proper margins for A3
      const pageMargins = { top: 20, right: 10, bottom: 15, left: 10 };
      const availableWidth = doc.internal.pageSize.getWidth() - pageMargins.left - pageMargins.right;
      
      // Smart scaling
      const tableWidthInPx = table.offsetWidth;
      const pxToMmScale = 25.4 / 96;
      const tableWidthInMm = tableWidthInPx * pxToMmScale;
      
      let scaleFactor = 1;
      if (tableWidthInMm > availableWidth) {
        scaleFactor = (availableWidth / tableWidthInMm) * 0.95; // 95% for padding
      }
      
      console.log(`[Product Group PDF] Scale Factor: ${scaleFactor}`);

      // Add title
      const divisionName = selectedDivision.split('-')[0];
      const title = `Product Group - ${divisionName} Division`;
      doc.setFontSize(16);
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 12, { align: 'center' });
      
      const subtitle = '(AED)';
      doc.setFontSize(10);
      doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 17, { align: 'center' });

      // Analyze product group structure to prevent splitting
      const tableBody = table.querySelector('tbody');
      console.log(`[Product Group PDF] Starting analysis - tableBody found: ${!!tableBody}`);
      const productGroups = analyzeProductGroupStructure(tableBody);
      const separatorRows = findSeparatorRows(tableBody);
      console.log(`[Product Group PDF] Analysis complete - ${productGroups.length} groups, ${separatorRows.length} separator points`);
      
      // Debug: Log the productGroups array to see if it's being populated
      console.log('[Product Group PDF] Product Groups Array:', productGroups);

      autoTable(doc, {
        html: table,
        startY: 20, // Start below title
        margin: pageMargins,
        theme: 'grid',
        tableWidth: 'auto',
        
        styles: {
          fillColor: '#FFFFFF',
          lineWidth: 0.1,
          lineColor: '#DDDDDD',
          overflow: 'linebreak',
          cellPadding: 0.8,
          fontSize: 7,
          halign: 'center',
          valign: 'middle',
          font: 'helvetica' // Ensure consistent font
        },
        
        headStyles: {
          fillColor: '#288cfa',
          textColor: '#FFFFFF',
          fontStyle: 'bold',
          fontSize: 8,
          font: 'helvetica'
        },
        
        columnStyles: {
          0: { 
            cellWidth: 40, // Fixed width for product names
            halign: 'left'
          },
          // Add wider minimum width for delta columns
          1: { minCellWidth: 20 },
          2: { minCellWidth: 20 },
          3: { minCellWidth: 20 },
          4: { minCellWidth: 20 },
          5: { minCellWidth: 20 }
        },
        
        // Handle multi-page scenarios
        didDrawPage: function(data) {
          if (data.pageNumber > 1) {
            // Add continuation header
            doc.setFontSize(8);
            doc.setTextColor('#666666');
            doc.text('Product Group (continued)', pageMargins.left, 8);
            doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.getWidth() - pageMargins.right - 15, 8);
            doc.setTextColor('#000000');
          }
        },
        
        didParseCell: function (data) {
          processProductGroupCell(data, scaleFactor);
        },
        
        // Check for page breaks BEFORE drawing the row
        willDrawRow: function(data) {
          const rowIndex = data.row.index;
          
          console.log(`[willDrawRow DEBUG] About to draw row ${rowIndex}`);
          
          // Current position and available space
          const currentY = data.cursor.y;
          const pageHeight = doc.internal.pageSize.getHeight();
          const remainingSpace = pageHeight - currentY - pageMargins.bottom;
          
          // Check if current row is the start of a product group
          const currentProductGroup = productGroups.find(group => group.startIndex === rowIndex);
          
          if (currentProductGroup) {
            // Calculate estimated height needed for this entire product group
            const estimatedRowHeight = 11; // mm per row (approximate)
            const groupHeight = currentProductGroup.rowCount * estimatedRowHeight;
            const bufferSpace = 10; // mm buffer for safety
            const totalNeededSpace = groupHeight + bufferSpace;
            
            console.log(`[willDrawRow] Product group "${currentProductGroup.name}" needs ${totalNeededSpace}mm (${currentProductGroup.rowCount} rows)`);
            console.log(`[willDrawRow] Available space: ${remainingSpace}mm`);
            
            // If not enough space, force page break before this group
            if (remainingSpace < totalNeededSpace) {
              console.log(`[willDrawRow] ✅ ADDING PAGE BREAK before "${currentProductGroup.name}"`);
              doc.addPage();
              return true; // Continue processing
            }
          }
          
          return true; // Continue processing row
        },
        
        // Smart page break handling - Prevent product group splitting
        didDrawRow: function(data) {
          const rowIndex = data.row.index;
          const rowElement = tableBody.children[rowIndex];
          
          console.log(`[didDrawRow DEBUG] Processing row ${rowIndex}, productGroups length: ${productGroups.length}`);
          
          // Current position and available space
          const currentY = data.cursor.y;
          const pageHeight = doc.internal.pageSize.getHeight();
          const remainingSpace = pageHeight - currentY - pageMargins.bottom;
          
          // Check if current row is the start of a product group
          const currentProductGroup = productGroups.find(group => group.startIndex === rowIndex);
          console.log(`[didDrawRow DEBUG] Current product group found: ${!!currentProductGroup}`);
          
          if (currentProductGroup) {
            // Calculate estimated height needed for this entire product group
            const estimatedRowHeight = 11; // mm per row (approximate)
            const groupHeight = currentProductGroup.rowCount * estimatedRowHeight;
            const bufferSpace = 10; // mm buffer for safety
            const totalNeededSpace = groupHeight + bufferSpace;
            
            console.log(`[Product Group PDF] Product group "${currentProductGroup.name}" needs ${totalNeededSpace}mm (${currentProductGroup.rowCount} rows)`);
            console.log(`[Product Group PDF] Available space: ${remainingSpace}mm`);
            
            // If not enough space, force page break before this group
            if (remainingSpace < totalNeededSpace) {
              console.log(`[Product Group PDF] ✅ FORCING PAGE BREAK before "${currentProductGroup.name}" to keep group intact`);
              // Try multiple methods to trigger page break
              data.addPageBreak = true;
              doc.addPage();
              return false; // Some versions use return false
            } else {
              console.log(`[Product Group PDF] ✅ Group "${currentProductGroup.name}" fits in remaining space`);
            }
          }
          
          // Alternative approach: Check for product header rows using DOM classes
          if (rowElement && (
              rowElement.classList.contains('product-header-row') ||
              rowElement.querySelector('.product-header') ||
              rowElement.querySelector('.row-label')
            )) {
            console.log(`[didDrawRow DEBUG] Found product header row at ${rowIndex}`);
            
            // Estimate that a typical product group needs ~80-100mm of space
            const estimatedGroupSpace = 80; // mm
            
            if (remainingSpace < estimatedGroupSpace) {
              console.log(`[Product Group PDF] ✅ FORCING PAGE BREAK at product header row ${rowIndex} (${remainingSpace}mm < ${estimatedGroupSpace}mm)`);
              // Try multiple methods to trigger page break
              data.addPageBreak = true;
              doc.addPage();
              return false; // Some versions use return false
            }
          }
          
          // Fallback: Insert page break at separators when space is very limited
          if (remainingSpace < 30 && separatorRows.includes(rowIndex)) {
            console.log(`[Product Group PDF] Emergency page break at separator row ${rowIndex}, remaining space: ${remainingSpace}mm`);
            data.addPageBreak = true;
          }
        }
      });

      // Smart filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Product_Group_${divisionName}_${timestamp}.pdf`;
      
      doc.save(filename);
      console.log(`[Product Group PDF] Successfully exported: ${filename}`);

    } catch (err) {
      console.error('Product Group PDF Export failed:', err);
      setError(err.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="pdf-export-controls">
      <button 
        onClick={handleExportToPDF}
        disabled={isExporting}
        className="export-pdf-btn"
        title="Export Product Group table to PDF"
      >
        {isExporting ? 'Exporting PDF...' : 'Export to PDF'}
      </button>
      
      {error && (
        <div className="export-error">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default ProductGroupPDFExport;
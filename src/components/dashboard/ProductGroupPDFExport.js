import React, { useState } from 'react';
import jsPDF from 'jspdf';
import './PDFExport.css';

const ProductGroupPDFExport = ({ tableRef, selectedDivision }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

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
    <div className="pdf-export-controls">
      <button 
        onClick={handleExportCanvas}
        disabled={isExporting}
        className="export-pdf-btn"
        style={{ backgroundColor: '#FF9800' }}
        title="HTML to canvas to PDF"
      >
        {isExporting ? 'Exporting PDF...' : 'Export to PDF'}
      </button>
      {error && (
        <div className="export-error" style={{ marginTop: '10px', color: 'red', fontSize: '12px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default ProductGroupPDFExport;
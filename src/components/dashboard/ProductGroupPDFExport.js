import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './PDFExport.css';

const ProductGroupPDFExport = ({ tableRef, selectedDivision }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // APPROACH 1: Ultra Simple - No Page Break Logic
  const handleExportSimple = () => {
    setIsExporting(true);
    setError(null);

    try {
      const tableContainer = tableRef.current;
      const table = tableContainer.querySelector('table');
      if (!table) throw new Error('Table not found');

      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      doc.setFontSize(16);
      doc.text(`Product Group - ${selectedDivision.split('-')[0]}`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

      autoTable(doc, {
        html: table,
        startY: 25,
        theme: 'striped',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [200, 200, 200] },
        // NO custom page break logic - let autoTable handle everything
      });

      doc.save(`ProductGroup_Simple_${Date.now()}.pdf`);

    } catch (err) {
      setError(`Simple: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // APPROACH 2: Manual Table Split - Create Multiple Tables
  const handleExportManualSplit = () => {
    setIsExporting(true);
    setError(null);

    try {
      const tableContainer = tableRef.current;
      const table = tableContainer.querySelector('table');
      if (!table) throw new Error('Table not found');

      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Get all rows
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const headerRow = table.querySelector('thead tr');
      
      // Find product groups by background color
      const productGroups = [];
      let currentGroup = { startIndex: 0, rows: [] };
      
      rows.forEach((row, index) => {
        const firstCell = row.querySelector('td:first-child');
        if (firstCell) {
          const bgColor = window.getComputedStyle(firstCell).backgroundColor;
          const isProductHeader = bgColor.includes('187, 222, 251'); // Light blue
          
          if (isProductHeader && index > 0) {
            // End previous group
            productGroups.push(currentGroup);
            // Start new group
            currentGroup = { startIndex: index, rows: [] };
          }
          currentGroup.rows.push(row);
        }
      });
      productGroups.push(currentGroup); // Add last group

      // Create separate table for each product group
      let yPosition = 25;
      
      productGroups.forEach((group, groupIndex) => {
        if (groupIndex > 0) {
          doc.addPage();
          yPosition = 25;
        }
        
        doc.setFontSize(16);
        doc.text(`Product Group - ${selectedDivision.split('-')[0]} (Part ${groupIndex + 1})`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        
        // Create table data for this group
        const groupData = group.rows.map(row => {
          return Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim());
        });
        
        const headerData = Array.from(headerRow.querySelectorAll('th')).map(cell => cell.textContent.trim());
        
        autoTable(doc, {
          head: [headerData],
          body: groupData,
          startY: yPosition,
          theme: 'striped',
          styles: { fontSize: 7, cellPadding: 2 }
        });
      });

      doc.save(`ProductGroup_ManualSplit_${Date.now()}.pdf`);

    } catch (err) {
      setError(`Manual Split: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // APPROACH 3: HTML to Canvas to PDF
  const handleExportCanvas = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      const tableContainer = tableRef.current;
      const table = tableContainer.querySelector('table');
      if (!table) throw new Error('Table not found');

      // Capture table as image
      const canvas = await html2canvas(table, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Calculate image dimensions to fit page
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margin each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add title
      doc.setFontSize(16);
      doc.text(`Product Group - ${selectedDivision.split('-')[0]}`, pageWidth / 2, 15, { align: 'center' });
      
      // If image fits on one page
      if (imgHeight <= pageHeight - 40) {
        doc.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
      } else {
        // Split image across multiple pages
        const pageContentHeight = pageHeight - 40;
        const totalPages = Math.ceil(imgHeight / pageContentHeight);
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            doc.addPage();
            doc.setFontSize(16);
            doc.text(`Product Group - ${selectedDivision.split('-')[0]} (Page ${page + 1})`, pageWidth / 2, 15, { align: 'center' });
          }
          
          const sourceY = page * pageContentHeight * (canvas.height / imgHeight);
          const sourceHeight = Math.min(pageContentHeight * (canvas.height / imgHeight), canvas.height - sourceY);
          
          // Create canvas for this page slice
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          
          pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
          const pageImgData = pageCanvas.toDataURL('image/png');
          
          const sliceHeight = (sourceHeight * imgWidth) / canvas.width;
          doc.addImage(pageImgData, 'PNG', 10, 25, imgWidth, sliceHeight);
        }
      }

      doc.save(`ProductGroup_Canvas_${Date.now()}.pdf`);

    } catch (err) {
      setError(`Canvas: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="pdf-export-controls">
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
        <button 
          onClick={handleExportSimple}
          disabled={isExporting}
          className="export-pdf-btn"
          style={{ backgroundColor: '#4CAF50' }}
          title="Ultra simple - no page break logic"
        >
          {isExporting ? 'Exporting...' : 'Test 1: Simple'}
        </button>
        
        <button 
          onClick={handleExportManualSplit}
          disabled={isExporting}
          className="export-pdf-btn"
          style={{ backgroundColor: '#2196F3' }}
          title="Manual split by product groups"
        >
          {isExporting ? 'Exporting...' : 'Test 2: Manual Split'}
        </button>
        
        <button 
          onClick={handleExportCanvas}
          disabled={isExporting}
          className="export-pdf-btn"
          style={{ backgroundColor: '#FF9800' }}
          title="HTML to canvas to PDF"
        >
          {isExporting ? 'Exporting...' : 'Test 3: Canvas'}
        </button>
      </div>
      
      {error && (
        <div className="export-error" style={{ marginTop: '10px', color: 'red', fontSize: '12px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default ProductGroupPDFExport;
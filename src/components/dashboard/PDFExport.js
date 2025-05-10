import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';
import './PDFExport.css';

const PDFExport = ({ tableRef, selectedDivision }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExportToPDF = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Create a container for export
      const exportContainer = document.createElement('div');
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.padding = '5px';
      exportContainer.style.backgroundColor = 'white';
      
      // Get the table view element
      const tableViewElement = tableRef.current.closest('.table-view');
      
      // Get the complete title container
      const titleContainer = tableViewElement?.querySelector('.table-title');
      
      if (titleContainer) {
        // Create a new title container for PDF
        const pdfTitleContainer = document.createElement('div');
        pdfTitleContainer.style.textAlign = 'center';
        pdfTitleContainer.style.marginBottom = '15px';
        pdfTitleContainer.style.marginTop = '0';
        
        // Get the main title (h3)
        const h3Element = titleContainer.querySelector('h3');
        if (h3Element) {
          const titleH3 = document.createElement('h1');
          titleH3.textContent = h3Element.textContent;
          titleH3.style.margin = '0';
          titleH3.style.fontSize = '22px';
          titleH3.style.color = '#333';
          titleH3.style.lineHeight = '1.3';
          pdfTitleContainer.appendChild(titleH3);
        }
        
        // Get the subtitle
        const subtitleElement = titleContainer.querySelector('.table-subtitle');
        if (subtitleElement) {
          const subtitle = document.createElement('div');
          subtitle.textContent = subtitleElement.textContent;
          subtitle.style.fontSize = '16px';
          subtitle.style.fontStyle = 'italic';
          subtitle.style.fontWeight = 'bold';
          subtitle.style.margin = '4px 0 0 0';
          subtitle.style.color = '#000';
          pdfTitleContainer.appendChild(subtitle);
        }
        
        exportContainer.appendChild(pdfTitleContainer);
      }
      
      // Get the table and clone it
      const originalTable = tableRef.current.querySelector('.financial-table');
      if (!originalTable) {
        throw new Error('Table not found');
      }
      
      const clonedTable = originalTable.cloneNode(true);
      exportContainer.appendChild(clonedTable);
      
      // PDF options with minimal margins
      const options = {
        margin: [5, 5, 5, 5], // minimal margins
        filename: `Financial_Table_${selectedDivision}_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { 
          type: 'jpeg', 
          quality: 0.98 
        },
        html2canvas: { 
          scale: 1.5,
          logging: false,
          useCORS: true,
          allowTaint: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a3', 
          orientation: 'landscape' 
        },
        pagebreak: { 
          mode: 'avoid-all'
        }
      };

      // Generate and save PDF
      await html2pdf()
        .from(exportContainer)
        .set(options)
        .save();
      
    } catch (err) {
      console.error('PDF Export failed:', err);
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
      >
        {isExporting ? 'Exporting PDF...' : 'Export to PDF'}
      </button>
      
      {error && (
        <div className="export-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default PDFExport;
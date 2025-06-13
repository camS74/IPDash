import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './PDFExport.css';

const SalesCountryPDFExport = ({ tableRef, selectedDivision }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExportToPDF = () => {
    setIsExporting(true);
    setError(null);

    try {
      const financialTable = tableRef.current.querySelector('.financial-table');
      if (!financialTable) {
        throw new Error('Sales by Country table not found for export.');
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
      });
      
      const pageMargins = { top: 25, right: 10, bottom: 15, left: 10 };
      
      // Add Title
      const divisionName = selectedDivision.split('-')[0];
      const title = `Sales by Country - ${divisionName}`;
      doc.setFontSize(18);
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      
      const subtitle = '(%)';
      doc.setFontSize(12);
      doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

      // Export table using autoTable
      doc.autoTable({
        html: financialTable,
        startY: 30,
        margin: pageMargins,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          halign: 'center',
          valign: 'middle'
        },
        headStyles: {
          fillColor: '#288cfa',
          textColor: '#FFFFFF',
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 40 }
        }
      });

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Sales_by_Country_${divisionName}_${timestamp}.pdf`;
      
      doc.save(filename);

    } catch (err) {
      console.error('Sales by Country PDF Export failed:', err);
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
        title="Export Sales by Country table to PDF"
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

export default SalesCountryPDFExport; 
import React, { useRef } from 'react';
import ProductGroupHTMLExport from './ProductGroupHTMLExport';
import ProductGroupTable from './ProductGroupTable';
import { useExcelData } from '../../hooks/useExcelData';
import './HTMLReportView.css';

const HTMLReportView = () => {
  const { selectedDivision } = useExcelData();
  const productGroupTableRef = useRef(null);

  return (
    <div className="html-report-container">
      <div className="html-report-header">
        <h1>HTML Report Dashboard</h1>
        <p>Export interactive HTML reports for {selectedDivision}</p>
      </div>

      <div className="report-cards-grid">
        {/* Product Group Export Card */}
        <div className="report-card">
          <div className="card-header">
            <h3>📊 Product Group Table Export</h3>
            <p>Export interactive HTML table with frozen headers and scrolling</p>
          </div>
          
          <div className="card-content">
            {/* Hidden Product Group Table for export */}
            <div ref={productGroupTableRef} className="export-table-container">
              <ProductGroupTable />
            </div>
            
            {/* Export Controls */}
            <div className="export-controls">
              <ProductGroupHTMLExport 
                tableRef={productGroupTableRef} 
                selectedDivision={selectedDivision} 
              />
            </div>
          </div>
        </div>

        {/* Placeholder for future export cards */}
        <div className="report-card placeholder">
          <div className="card-header">
            <h3>📈 Sales Charts Export</h3>
            <p>Coming soon - Export sales charts as HTML</p>
          </div>
          <div className="card-content">
            <button disabled className="export-btn disabled">
              Coming Soon
            </button>
          </div>
        </div>

        <div className="report-card placeholder">
          <div className="card-header">
            <h3>📋 More Export Options</h3>
            <p>Additional export formats coming soon</p>
          </div>
          <div className="card-content">
            <button disabled className="export-btn disabled">
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HTMLReportView; 
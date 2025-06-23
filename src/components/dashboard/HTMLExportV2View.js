import React, { useState } from 'react';
import { useExcelData } from '../../hooks/useExcelData';
import { exportHTMLReportV2 } from '../../utils/htmlExportV2';
import './HTMLExportV2View.css';

const HTMLExportV2View = () => {
  const { selectedDivision } = useExcelData();
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportHTMLReportV2();
      setLastExport({
        filename: result.filename,
        timestamp: new Date().toLocaleString(),
        division: selectedDivision
      });
    } catch (error) {
      console.error('Export V2 failed:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="html-export-v2-container">
      <div className="export-v2-header">
        <h1>HTML Export V2</h1>
        <p>Clean design inspired by IP logo colors - Professional reports without effects</p>
      </div>

      <div className="export-v2-content">
        <div className="export-info-section">
          <div className="info-card">
            <h3>🎨 Design Features</h3>
            <ul>
              <li><strong>IP Transparent Logo</strong> - Uses your branded logo</li>
              <li><strong>Clean Color Scheme</strong> - Inspired by IP logo colors</li>
              <li><strong>No Effects</strong> - Flat, professional design</li>
              <li><strong>Corporate Style</strong> - Business-ready formatting</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>📊 Export Content</h3>
            <ul>
              <li><strong>All Financial Charts</strong> - Complete chart analysis</li>
              <li><strong>P&L Table</strong> - Financial performance data</li>
              <li><strong>Product Group Table</strong> - Product analysis</li>
              <li><strong>Sales by Country</strong> - Geographic sales data</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>⚙️ Technical Specs</h3>
            <ul>
              <li><strong>Self-contained HTML</strong> - All images embedded</li>
              <li><strong>Responsive Design</strong> - Works on all devices</li>
              <li><strong>Print Optimized</strong> - Perfect for printing</li>
              <li><strong>Tab Navigation</strong> - Easy section switching</li>
            </ul>
          </div>
        </div>

        <div className="export-action-section">
          <div className="current-division">
            <h3>Current Division: <span className="division-name">{selectedDivision}</span></h3>
            <p>The export will include all data from the selected division above.</p>
          </div>

          <div className="export-button-container">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="export-v2-button"
            >
              {isExporting ? 'Generating V2 Report...' : '🚀 Generate HTML Report V2'}
            </button>
          </div>

          {lastExport && (
            <div className="last-export-info">
              <h4>✅ Last Export Successful</h4>
              <p><strong>File:</strong> {lastExport.filename}</p>
              <p><strong>Division:</strong> {lastExport.division}</p>
              <p><strong>Generated:</strong> {lastExport.timestamp}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HTMLExportV2View; 
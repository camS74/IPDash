import React, { useEffect, useCallback, useState } from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useFilter } from '../../contexts/FilterContext';
import DivisionSelector from './DivisionSelector';
import FilterPanel from './FilterPanel';
import ColumnConfigGrid from './ColumnConfigGrid';
import TabsComponent, { Tab } from './TabsComponent';
import TableView from './TableView';
import ChartView from './ChartView';
import './Dashboard.css';
// Import logo directly to embed it in the bundle
import interplastLogo from '../../assets/Ip Logo.png';
// Import embedded logo data as fallback
import { INTERPLAST_LOGO_SVG } from '../../assets/logoData';

const Dashboard = () => {
  const { loadExcelData, loading, error, selectedDivision, excelData } = useExcelData();
  const { columnOrder, dataGenerated } = useFilter();
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [chartExportFunction, setChartExportFunction] = useState(null);
  const [logoSrc, setLogoSrc] = useState(interplastLogo);
  
  // Use useCallback to memoize the function to prevent it from changing on every render
  const loadData = useCallback(() => {
    console.log('Dashboard mounted, attempting to load Excel data...');
    // Load Excel data when component mounts - pointing to our backend server
    loadExcelData('/api/financials.xlsx')
      .catch(err => {
        console.error('Error in Dashboard useEffect:', err);
      });
  }, [loadExcelData]);
  
  // Only run this effect once when the component mounts
  useEffect(() => {
    // Only load data if we don't already have it
    if (Object.keys(excelData).length === 0) {
      loadData();
    }
  }, [loadData, excelData]);

  // Update selected periods when column order changes
  useEffect(() => {
    if (columnOrder.length > 0) {
      const periods = columnOrder.map(col => ({
        year: col.year,
        month: col.month,
        type: col.type,
        customColor: col.customColor,
        id: col.id
      }));
      setSelectedPeriods(periods);
    }
  }, [columnOrder]);

  // Handle when chart export function is ready
  const handleExportRefsReady = useCallback((exportData) => {
    setChartExportFunction(() => exportData.exportFunction);
  }, []);
  
  console.log('Dashboard render state:', { loading, error, selectedDivision });
  
  if (loading) {
    return <div className="loading">Loading Excel data...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <img 
          src={logoSrc}
          alt="Interplast Logo" 
          className="dashboard-logo"
          onError={() => {
            console.log('PNG logo failed, switching to embedded SVG');
            setLogoSrc(INTERPLAST_LOGO_SVG);
          }}
        />
        <h1>Interplast Dashboard</h1>
      </div>
      
      <DivisionSelector />
      
      {selectedDivision && (
        <div className="dashboard-content">
          <FilterPanel />
          
          {/* Add the column configuration grid here */}
          <ColumnConfigGrid exportPdfFunction={chartExportFunction} />
          
          <TabsComponent>
            <Tab label="Data Table">
              <TableView />
            </Tab>
            <Tab label="Charts">
              {dataGenerated ? (
                <ChartView 
                  tableData={excelData}
                  selectedPeriods={selectedPeriods}
                  onExportRefsReady={handleExportRefsReady}
                />
              ) : (
                <div className="empty-charts-container">
                  <p>Please select columns and click the Generate button to view charts.</p>
                </div>
              )}
            </Tab>
          </TabsComponent>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 
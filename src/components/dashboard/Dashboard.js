import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useFilter } from '../../contexts/FilterContext';
import DivisionSelector from './DivisionSelector';
import FilterPanel from './FilterPanel';
import ColumnConfigGrid from './ColumnConfigGrid';
import TabsComponent, { Tab } from './TabsComponent';
import TableView from './TableView';
import ProductGroupTable from './ProductGroupTable';
import SalesByCountryTable from './SalesByCountryTable';
import SalesByCustomerTable from './SalesByCustomerTable';
import SalesCountryChart from './SalesCountryChart';

import MapSwitcher from './MapSwitcher';
import ChartView from './ChartView';
import WriteUpView from './WriteUpView';
import MasterData from './MasterData';
import KPIExecutiveSummary from './KPIExecutiveSummary';
import SalesBySaleRepTable from './SalesBySaleRepTable';
import './Dashboard.css';
// Import logo directly to embed it in the bundle
import interplastLogo from '../../assets/Ip Logo.png';
// Import embedded logo data as fallback
import { INTERPLAST_LOGO_SVG } from '../../assets/logoData';

const Dashboard = () => {
  const { loadExcelData, loading, error, selectedDivision, excelData } = useExcelData();
  const { loadSalesData, loading: salesLoading, error: salesError } = useSalesData();
  const { columnOrder, dataGenerated } = useFilter();
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [chartExportFunction, setChartExportFunction] = useState(null);
  const [logoSrc, setLogoSrc] = useState(interplastLogo);
  const productGroupTableRef = useRef(null);
  
  // Use useCallback to memoize the function to prevent it from changing on every render
  const loadData = useCallback(() => {
    // Load Excel data when component mounts - pointing to our backend server
    loadExcelData('/api/financials.xlsx')
      .catch(err => {
        console.error('Error in Dashboard useEffect:', err);
      });
      
    // Load Sales data
    loadSalesData('/api/sales.xlsx')
      .catch(err => {
        console.error('Error loading sales data:', err);
      });
  }, [loadExcelData, loadSalesData]);
  
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
  
  if (loading || salesLoading) {
    return <div className="loading">Loading Excel data...</div>;
  }
  
  if (error || salesError) {
    return <div className="error">Error: {error || salesError}</div>;
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
        <DivisionSelector />
      </div>
      
      {selectedDivision && (
        <div className="dashboard-content">
          <FilterPanel />
          
          {/* Add the column configuration grid here */}
          <ColumnConfigGrid exportPdfFunction={chartExportFunction} productGroupTableRef={productGroupTableRef} />
          
          <TabsComponent>
            <Tab label="KPI">
              <KPIExecutiveSummary />
            </Tab>
            <Tab label="P&L">
              <TableView />
            </Tab>
            <Tab label="Product Group">
              <ProductGroupTable ref={productGroupTableRef} />
            </Tab>
            <Tab label="Sales by Country">
              <TabsComponent variant="secondary">
                <Tab label="Table">
                  <SalesByCountryTable />
                </Tab>
                <Tab label="Chart">
                  <SalesCountryChart />
                </Tab>
                <Tab label="Map (2D/3D)">
                  <MapSwitcher />
                </Tab>
              </TabsComponent>
            </Tab>
            <Tab label="Sales by Customer">
              <SalesByCustomerTable />
            </Tab>
            <Tab label="Sales by SaleRep">
              <SalesBySaleRepTable />
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
            <Tab label="Write-Up">
              {dataGenerated ? (
                <WriteUpView 
                  tableData={excelData}
                  selectedPeriods={selectedPeriods}
                />
              ) : (
                <div className="empty-writeup-container">
                  <p>Please select columns and click the Generate button to access the AI writeup assistant.</p>
                </div>
              )}
            </Tab>
            <Tab label="Master Data">
              <MasterData />
            </Tab>
          </TabsComponent>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
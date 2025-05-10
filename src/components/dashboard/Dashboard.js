import React, { useEffect, useCallback } from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import DivisionSelector from './DivisionSelector';
import FilterPanel from './FilterPanel';
import ColumnConfigGrid from './ColumnConfigGrid';
import TabsComponent, { Tab } from './TabsComponent';
import TableView from './TableView';
import './Dashboard.css';

const Dashboard = () => {
  const { loadExcelData, loading, error, selectedDivision, excelData } = useExcelData();
  
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
  
  console.log('Dashboard render state:', { loading, error, selectedDivision });
  
  if (loading) {
    return <div className="loading">Loading Excel data...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  return (
    <div className="dashboard-container">
      <h1>Excel Dashboard</h1>
      
      <DivisionSelector />
      
      {selectedDivision && (
        <div className="dashboard-content">
          <FilterPanel />
          
          {/* Add the column configuration grid here */}
          <ColumnConfigGrid />
          
          <TabsComponent>
            <Tab label="Data Table">
              <TableView />
            </Tab>
            <Tab label="Charts">
              <div className="empty-charts-container">
                <p>Charts functionality is not currently implemented.</p>
              </div>
            </Tab>
          </TabsComponent>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 
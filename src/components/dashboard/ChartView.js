import React from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useFilter } from '../../contexts/FilterContext';
import './ChartView.css';

const ChartView = () => {
  const { excelData, selectedDivision } = useExcelData();
  const { columnOrder, dataGenerated } = useFilter();
  
  // Only show data if Generate button has been clicked
  if (!dataGenerated) {
    return (
      <div className="chart-view">
        <h3>Visualizations</h3>
        <div className="chart-empty-state">
          <p>Please select columns and click the Generate button to view visualizations.</p>
        </div>
      </div>
    );
  }
  
  // Get unique years, months, and types from column order
  const uniqueYears = [...new Set(columnOrder.map(col => col.year))];
  const uniqueMonths = [...new Set(columnOrder.map(col => col.month))];
  const uniqueTypes = [...new Set(columnOrder.map(col => col.type))];
  
  return (
    <div className="chart-view">
      <h3>Visualizations</h3>
      <div className="chart-container">
        <p>Charts will be displayed here based on selected data.</p>
        <p>Currently configured columns:</p>
        <ul>
          <li>Division: {selectedDivision}</li>
          <li>Number of columns: {columnOrder.length}</li>
          {uniqueYears.length > 0 && (
            <li>Years used: {uniqueYears.join(', ')}</li>
          )}
          {uniqueMonths.length > 0 && (
            <li>Periods used: {uniqueMonths.join(', ')}</li>
          )}
          {uniqueTypes.length > 0 && (
            <li>Types used: {uniqueTypes.join(', ')}</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ChartView;

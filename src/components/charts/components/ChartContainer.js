import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Select } from 'antd';
import { useFilter } from '../../../contexts/FilterContext';
import { useExcelData } from '../../../contexts/ExcelDataContext';
import BarChart from './BarChart';
import { calculatePeriodDifferences } from '../utils/chartCalculations';
import './ChartContainer.css';
import { computeCellValue as sharedComputeCellValue } from '../../../utils/computeCellValue';

const ChartContainer = ({ tableData, selectedPeriods }) => {
  const { excelData, selectedDivision } = useExcelData();
  const { 
    columnOrder, 
    basePeriodIndex,
    chartVisibleColumns, 
    isColumnVisibleInChart 
  } = useFilter();

  // Get the Excel data based on selectedDivision
  const divisionData = excelData[selectedDivision] || [];

  // --- Compute cell value logic (copied from TableView) ---
  const computeCellValue = (rowIndex, column) => {
    return sharedComputeCellValue(divisionData, rowIndex, column);
  };

  // --- Build chart data from processed table data ---
  const periods = columnOrder;
  const basePeriod = periods[basePeriodIndex];

  // Get filtered periods based on chart visibility
  const filteredPeriods = periods.filter(period => isColumnVisibleInChart(period.id));

  // Debug log for data building
  console.log('Chart data: Found', {
    totalPeriods: periods.length,
    visiblePeriods: filteredPeriods.length,
    visiblePeriodIds: filteredPeriods.map(p => p.id),
    allVisibleIds: chartVisibleColumns
  });

  // Build chart data for visible columns
  const chartData = {};
  
  // Only proceed if we have visible periods
  if (filteredPeriods.length === 0) {
    console.warn('No visible periods for chart - showing all periods by default');
    // If no periods are visible, show all periods
    periods.forEach((col, index) => {
      // Include month in the periodKey to differentiate between Year, Q1, etc.
      const periodKey = `${col.year}-${col.month || 'Year'}-${col.type}`;
      // Use the same computeCellValue logic as the table
      const sales = computeCellValue(3, col);           // Sales
      const salesVolume = computeCellValue(7, col);     // Sales Volume
      const productionVolume = computeCellValue(8, col); // Production Volume
      chartData[periodKey] = { sales, salesVolume, productionVolume };
    });
  } else {
    // Process only the visible periods
    filteredPeriods.forEach((col, index) => {
      // Include month in the periodKey to differentiate between Year, Q1, etc.
      const periodKey = `${col.year}-${col.month || 'Year'}-${col.type}`;
      // Double-check the column structure
      console.log(`Period ${index+1} structure:`, JSON.stringify(col));
      // Use the same computeCellValue logic as the table
      const sales = computeCellValue(3, col);           // Sales
      const salesVolume = computeCellValue(7, col);     // Sales Volume
      const productionVolume = computeCellValue(8, col); // Production Volume
      // Debug log for each period
      console.log(`Processing chart period ${index+1} (${periodKey}):`, {
        column: col,
        sales,
        salesVolume,
        productionVolume
      });
      chartData[periodKey] = { sales, salesVolume, productionVolume };
    });
  }

  // Debug log for final chart data
  console.log('Final chart data:', {
    periodCount: Object.keys(chartData).length,
    dataKeys: Object.keys(chartData),
    values: Object.values(chartData).map(d => d.sales)
  });

  // --- Render ---
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      height: '1000px',
      padding: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px'
    }}>
      <div style={{ flex: 1, minHeight: '900px' }}>
        <BarChart
          data={chartData}
          periods={filteredPeriods}
          basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''}
        />
      </div>
    </div>
  );
};

export default ChartContainer; 
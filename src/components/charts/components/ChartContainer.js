import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Select } from 'antd';
import { useFilter } from '../../../contexts/FilterContext';
import { useExcelData } from '../../../contexts/ExcelDataContext';
import BarChart from './BarChart';
import { calculatePeriodDifferences } from '../utils/chartCalculations';
import './ChartContainer.css';

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
    try {
      if (!column || typeof column !== 'object') return 0;
      if (typeof rowIndex !== 'number') return 0;
      if (!divisionData || !Array.isArray(divisionData) || divisionData.length === 0) return 0;
      if (rowIndex < 0 || rowIndex >= divisionData.length) return 0;

      // Handle Budget (Year + Budget)
      if (column.type === 'Budget') {
        console.log('Computing Budget value for:', {
          year: column.year,
          type: column.type,
          rowIndex
        });
        
        let budgetValue = 0;
        let foundValue = false;
        
        for (let c = 1; c < divisionData[0].length; c++) {
          const cellYear = divisionData[0] && divisionData[0][c];
          const cellType = divisionData[2] && divisionData[2][c];
          
          if (cellYear == column.year && cellType === 'Budget') {
            console.log('Found Budget cell:', {
              cellYear,
              cellType,
              value: divisionData[rowIndex][c]
            });
            
            const value = divisionData[rowIndex][c];
            if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
              budgetValue += parseFloat(value);
              foundValue = true;
            }
          }
        }
        
        console.log(`Budget value for ${column.year}: ${budgetValue}`);
        return foundValue ? budgetValue : 0;
      }

      // Handle Actual (Year + Actual): sum all months
      if (column.type === 'Actual' && column.month === 'Year') {
        let sum = 0;
        let foundValues = false;
        for (let c = 1; c < divisionData[0].length; c++) {
          const cellYear = divisionData[0] && divisionData[0][c];
          const cellType = divisionData[2] && divisionData[2][c];
          if (cellYear == column.year && cellType === 'Actual') {
            const value = divisionData[rowIndex][c];
            if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
              sum += parseFloat(value);
              foundValues = true;
            }
          }
        }
        return foundValues ? sum : 0;
      }

      // Handle Q1, Q2, Q3, Q4 for Actual
      if (column.type === 'Actual' && ['Q1', 'Q2', 'Q3', 'Q4'].includes(column.month)) {
        const quarterMonths = {
          Q1: ['January', 'February', 'March'],
          Q2: ['April', 'May', 'June'],
          Q3: ['July', 'August', 'September'],
          Q4: ['October', 'November', 'December']
        };
        let sum = 0;
        let foundValues = false;
        
        console.log(`Processing quarter ${column.month} for year ${column.year}`);
        
        for (let c = 1; c < divisionData[0].length; c++) {
          const cellYear = divisionData[0] && divisionData[0][c];
          const cellMonth = divisionData[1] && divisionData[1][c];
          const cellType = divisionData[2] && divisionData[2][c];
          
          if (cellYear == column.year && cellType === 'Actual' && quarterMonths[column.month].includes(cellMonth)) {
            const value = divisionData[rowIndex][c];
            
            console.log(`Found match: ${cellYear} ${cellMonth} ${cellType} = ${value}`);
            
            if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
              sum += parseFloat(value);
              foundValues = true;
            }
          }
        }
        
        console.log(`Quarter ${column.month} sum: ${sum}`);
        return foundValues ? sum : 0;
      }

      // Handle individual month for Actual or Budget
      if ((column.type === 'Actual' || column.type === 'Budget') && 
          !['Year', 'Q1', 'Q2', 'Q3', 'Q4'].includes(column.month)) {
        
        let sum = 0;
        let foundValues = false;
        
        console.log(`Processing individual month ${column.month} ${column.year} ${column.type}`);
        
        for (let c = 1; c < divisionData[0].length; c++) {
          const cellYear = divisionData[0] && divisionData[0][c];
          const cellMonth = divisionData[1] && divisionData[1][c];
          const cellType = divisionData[2] && divisionData[2][c];
          
          if (cellYear == column.year && cellMonth === column.month && cellType === column.type) {
            const value = divisionData[rowIndex][c];
            
            console.log(`Found exact match: ${cellYear} ${cellMonth} ${cellType} = ${value}`);
            
            if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
              sum += parseFloat(value);
              foundValues = true;
            }
          }
        }
        
        console.log(`Month ${column.month} sum: ${sum}`);
        return foundValues ? sum : 0;
      }

      // Fallback: try to match by year, month, type
      let sum = 0;
      let foundValues = false;
      for (let c = 1; c < divisionData[0].length; c++) {
        const cellYear = divisionData[0] && divisionData[0][c];
        const cellMonth = divisionData[1] && divisionData[1][c];
        const cellType = divisionData[2] && divisionData[2][c];
        
        if (cellYear == column.year && 
            (cellMonth === column.month || column.month === undefined) && 
            cellType === column.type) {
          const value = divisionData[rowIndex][c];
          if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
            sum += parseFloat(value);
            foundValues = true;
          }
        }
      }
      return foundValues ? sum : 0;
    } catch (error) {
      console.error('Error computing cell value:', error);
      return 0;
    }
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
      height: '600px', 
      padding: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px'
    }}>
      <div style={{ flex: 1, minHeight: '500px' }}>
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
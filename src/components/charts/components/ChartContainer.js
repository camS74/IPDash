import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Select } from 'antd';
import { useFilter } from '../../../contexts/FilterContext';
import { useExcelData } from '../../../contexts/ExcelDataContext';
import BarChart from './BarChart';
import ModernMarginGauge from './ModernMarginGauge';
import ManufacturingCostChart from './ManufacturingCostChart';
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
    console.log(`Computing cell value for row ${rowIndex}, column:`, column);
    const value = sharedComputeCellValue(divisionData, rowIndex, column);
    console.log(`Cell value result: ${value}`);
    return value;
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

  // Log the entire division data structure to verify row indices
  console.log('Full division data structure:', {
    divisionName: selectedDivision,
    rowCount: divisionData.length,
    // Sample first few rows to verify data structure
    sampleRows: divisionData.slice(0, 10)
  });

  // Build chart data for visible columns
  const chartData = {};
  
  // Only proceed if we have visible periods
  if (filteredPeriods.length === 0) {
    console.warn('No visible periods for chart - showing all periods by default');
    // If no periods are visible, show all periods
    periods.forEach((col, index) => {
      const periodKey = `${col.year}-${col.month || 'Year'}-${col.type}`;
      const sales = computeCellValue(3, col);           // Sales (row 3)
      const materialCost = computeCellValue(5, col);    // Material Cost (row 5)
      const salesVolume = computeCellValue(7, col);     // Sales Volume (row 7)
      const productionVolume = computeCellValue(8, col); // Production Volume (row 8)
      const marginOverMaterial = sales - materialCost;
      const marginPerKg = salesVolume > 0 ? marginOverMaterial / salesVolume : null;
      chartData[periodKey] = { sales, materialCost, salesVolume, productionVolume, marginPerKg };
      console.log('DEBUG:', { periodKey, sales, materialCost, salesVolume, productionVolume, marginPerKg });
    });
  } else {
    filteredPeriods.forEach((col, index) => {
      const periodKey = `${col.year}-${col.month || 'Year'}-${col.type}`;
      const sales = computeCellValue(3, col);           // Sales (row 3)
      const materialCost = computeCellValue(5, col);    // Material Cost (row 5)
      const salesVolume = computeCellValue(7, col);     // Sales Volume (row 7)
      const productionVolume = computeCellValue(8, col); // Production Volume (row 8)
      const marginOverMaterial = sales - materialCost;
      const marginPerKg = salesVolume > 0 ? marginOverMaterial / salesVolume : null;
      chartData[periodKey] = { sales, materialCost, salesVolume, productionVolume, marginPerKg };
      console.log('DEBUG:', { periodKey, sales, materialCost, salesVolume, productionVolume, marginPerKg });
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
      height: 'auto',
      padding: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px'
    }}>
      {/* Bar chart container - match gauge panel style */}
      <div className="modern-margin-gauge-panel" style={{ marginTop: 60 }}>
        <BarChart
          data={chartData}
          periods={filteredPeriods}
          basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''}
        />
      </div>
      {/* New Modern Gauge chart */}
      <ModernMarginGauge
        data={chartData}
        periods={filteredPeriods}
        basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''}
        style={{ marginTop: 60 }}
      />
      {/* Manufacturing Cost chart panel after gauges */}
      <ManufacturingCostChart
        tableData={tableData}
        selectedPeriods={selectedPeriods}
        computeCellValue={computeCellValue}
        style={{ marginTop: 60 }}
      />
    </div>
  );
};

export default ChartContainer; 
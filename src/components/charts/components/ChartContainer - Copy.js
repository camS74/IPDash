import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Typography, Select, Button } from 'antd';
import { useFilter } from '../../../contexts/FilterContext';
import { useExcelData } from '../../../contexts/ExcelDataContext';
import BarChart from './BarChart';
import ModernMarginGauge from './ModernMarginGauge';
import ManufacturingCostChart from './ManufacturingCostChart';
import BelowGPExpensesChart from './BelowGPExpensesChart.tsx';
import ExpencesChart from './ExpencesChart';
import Profitchart from './Profitchart';
import AIWriteupPanel from './AIWriteupPanel';
import './ChartContainer.css';
import { computeCellValue as sharedComputeCellValue } from '../../../utils/computeCellValue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';

const ChartContainer = ({ tableData, selectedPeriods }) => {
  const { excelData, selectedDivision } = useExcelData();
  const { 
    columnOrder, 
    basePeriodIndex,
    chartVisibleColumns, 
    isColumnVisibleInChart 
  } = useFilter();

  // Refs for chart elements
  const barChartRef = useRef(null);
  const modernMarginGaugeRef = useRef(null);
  const manufacturingCostChartRef = useRef(null);
  const belowGPExpensesChartRef = useRef(null);
  const combinedTrendsRef = useRef(null); // New ref for combined Expenses and Profit/EBITDA trends
  const aiWriteupPanelRef = useRef(null);

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

  const handleExportToPDF = async () => {
    try {
      // Initialize PDF with landscape A4
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      const padding = 40;

      // Helper function to get current page dimensions
      const getPageDimensions = () => {
        // Force a small delay to ensure page dimensions are updated
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              width: pdf.internal.pageSize.getWidth(),
              height: pdf.internal.pageSize.getHeight()
            });
          }, 100);
        });
      };

      // Helper function to add a new landscape page and return its dimensions
      const addLandscapePage = async () => {
        pdf.addPage('a4', 'landscape');
        return await getPageDimensions();
      };

      // Helper function to get chart image data
      const getChartImageData = async (ref, name) => {
        if (!ref.current) {
          console.warn(`Chart reference not found for ${name}`);
          return null;
        }

        // Try ECharts export first
        if (typeof ref.current.getEchartsInstance === 'function') {
          try {
            const instance = ref.current.getEchartsInstance();
            if (instance) {
              // Wait for chart to be ready
              await new Promise(resolve => setTimeout(resolve, 500));
              return instance.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: '#fff'
              });
            }
          } catch (error) {
            console.error(`Error getting ECharts instance for ${name}:`, error);
          }
        }

        // For non-ECharts components, use html2canvas
        try {
          // Ensure the element is visible and fully rendered
          const element = ref.current;
          const originalStyle = {
            visibility: element.style.visibility,
            position: element.style.position,
            zIndex: element.style.zIndex
          };

          // Make element temporarily visible for capture
          element.style.visibility = 'visible';
          element.style.position = 'relative';
          element.style.zIndex = '1';

          // Wait for any animations or renders to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#fff',
            logging: false,
            onclone: (clonedDoc) => {
              // Ensure the cloned element is properly styled
              const clonedElement = clonedDoc.querySelector(`[data-chart-name="${name}"]`);
              if (clonedElement) {
                clonedElement.style.visibility = 'visible';
                clonedElement.style.position = 'relative';
                clonedElement.style.zIndex = '1';
              }
            }
          });

          // Restore original styles
          element.style.visibility = originalStyle.visibility;
          element.style.position = originalStyle.position;
          element.style.zIndex = originalStyle.zIndex;

          return canvas.toDataURL('image/png', 1.0);
        } catch (error) {
          console.error(`Error capturing ${name} with html2canvas:`, error);
          return null;
        }
      };

      // Helper function to add image to PDF with proper sizing using current page dimensions
      const addImageToPDF = async (imgData, name, pageNumber, dimensions) => {
        if (!imgData) {
          pdf.setFontSize(16);
          pdf.text(`Error: Failed to capture ${name}`, padding, dimensions.height / 2);
          pdf.setFontSize(12);
          pdf.text(`Page ${pageNumber}`, padding, dimensions.height / 2 + 30);
          return;
        }

        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            // Calculate dimensions to maintain aspect ratio using current page size
            const maxWidth = dimensions.width - (2 * padding);
            const maxHeight = dimensions.height - (2 * padding);
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            
            const finalWidth = img.width * ratio;
            const finalHeight = img.height * ratio;
            
            // Center the image on the current page
            const x = (dimensions.width - finalWidth) / 2;
            const y = (dimensions.height - finalHeight) / 2;

            // Log dimensions for debugging
            console.log(`Adding ${name} to page ${pageNumber}:`, {
              pageWidth: dimensions.width,
              pageHeight: dimensions.height,
              imageWidth: img.width,
              imageHeight: img.height,
              finalWidth,
              finalHeight,
              x,
              y
            });

            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            resolve();
          };
          img.onerror = () => {
            console.error(`Error loading image for ${name}`);
            pdf.setFontSize(16);
            pdf.text(`Error: Failed to load image for ${name}`, padding, dimensions.height / 2);
            pdf.setFontSize(12);
            pdf.text(`Page ${pageNumber}`, padding, dimensions.height / 2 + 30);
            resolve();
          };
          img.src = imgData;
        });
      };

      // Define all charts to export with their refs and names
      const chartsToExport = [
        { ref: barChartRef, name: 'Bar Chart' },
        { ref: modernMarginGaugeRef, name: 'Modern Margin Gauge' },
        { ref: manufacturingCostChartRef, name: 'Manufacturing Cost Chart' },
        { ref: belowGPExpensesChartRef, name: 'Below GP Expenses Chart' },
        { ref: combinedTrendsRef, name: 'Combined Trends' }
      ];

      // Export each chart
      for (let i = 0; i < chartsToExport.length; i++) {
        const { ref, name } = chartsToExport[i];
        
        // Get fresh page dimensions for each chart
        const pageDimensions = i === 0 
          ? await getPageDimensions() 
          : await addLandscapePage();

        console.log(`Page ${i + 1} dimensions:`, pageDimensions);

        const imgData = await getChartImageData(ref, name);
        await addImageToPDF(imgData, name, i + 1, pageDimensions);
      }

      // Handle AI Writeup Panel separately (portrait mode)
      if (aiWriteupPanelRef.current) {
        // Add a new portrait page and get its dimensions
        pdf.addPage('a4', 'portrait');
        const portraitDimensions = await getPageDimensions();
        const portraitPadding = 30;

        console.log('AI Writeup page dimensions:', portraitDimensions);

        try {
          // Make the panel temporarily visible for capture
          const originalStyle = {
            visibility: aiWriteupPanelRef.current.style.visibility,
            position: aiWriteupPanelRef.current.style.position,
            zIndex: aiWriteupPanelRef.current.style.zIndex
          };

          aiWriteupPanelRef.current.style.visibility = 'visible';
          aiWriteupPanelRef.current.style.position = 'relative';
          aiWriteupPanelRef.current.style.zIndex = '1';

          await new Promise(resolve => setTimeout(resolve, 1000));

          const canvas = await html2canvas(aiWriteupPanelRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#fff',
            logging: false
          });

          // Restore original styles
          aiWriteupPanelRef.current.style.visibility = originalStyle.visibility;
          aiWriteupPanelRef.current.style.position = originalStyle.position;
          aiWriteupPanelRef.current.style.zIndex = originalStyle.zIndex;

          const imgData = canvas.toDataURL('image/png', 1.0);
          
          // Calculate dimensions using current portrait page size
          const maxWidth = portraitDimensions.width - (2 * portraitPadding);
          const maxHeight = portraitDimensions.height - (2 * portraitPadding);
          const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
          
          const finalWidth = canvas.width * ratio;
          const finalHeight = canvas.height * ratio;
          
          // Center the image on the current portrait page
          const x = (portraitDimensions.width - finalWidth) / 2;
          const y = (portraitDimensions.height - finalHeight) / 2;

          console.log('AI Writeup image placement:', {
            pageWidth: portraitDimensions.width,
            pageHeight: portraitDimensions.height,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            finalWidth,
            finalHeight,
            x,
            y
          });

          pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        } catch (error) {
          console.error('Error capturing AI Writeup:', error);
          pdf.setFontSize(16);
          pdf.text('Error: Failed to capture AI Writeup', portraitPadding, portraitDimensions.height / 2);
          pdf.setFontSize(12);
          pdf.text(`Page ${chartsToExport.length + 1}`, portraitPadding, portraitDimensions.height / 2 + 30);
        }
      }

      pdf.save('dashboard_export.pdf');
      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please check the console for details.');
    }
  };

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
      <Button 
        type="primary" 
        onClick={handleExportToPDF} 
        style={{ marginBottom: 20, alignSelf: 'flex-end' }}
      >
        Export to PDF
      </Button>
      {/* Bar chart container - match gauge panel style */}
      <div ref={barChartRef} className="modern-margin-gauge-panel" style={{ marginTop: 60 }}>
        <BarChart
          data={chartData}
          periods={filteredPeriods}
          basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''}
        />
      </div>
      {/* New Modern Gauge chart */}
      <div ref={modernMarginGaugeRef}>
        <ModernMarginGauge
          data={chartData}
          periods={filteredPeriods}
          basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''}
          style={{ marginTop: 60 }}
        />
      </div>
      {/* Manufacturing Cost chart panel after gauges */}
      <div ref={manufacturingCostChartRef}>
        <ManufacturingCostChart
          tableData={tableData}
          selectedPeriods={selectedPeriods}
          computeCellValue={computeCellValue}
          style={{ marginTop: 60 }}
        />
      </div>
      {/* Below Gross Profit Expenses chart panel after Manufacturing Cost */}
      <div ref={belowGPExpensesChartRef}>
        <BelowGPExpensesChart
          tableData={tableData}
          selectedPeriods={selectedPeriods}
          computeCellValue={computeCellValue}
          style={{ marginTop: 60 }}
        />
      </div>
      {/* Combined Expenses and Profit/EBITDA Trends */}
      <div ref={combinedTrendsRef} style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
        {/* Expenses Trend panel */}
        <div> {/* Removed specific ref if it was only for individual export */}
          <ExpencesChart
            tableData={tableData}
            selectedPeriods={selectedPeriods}
            computeCellValue={computeCellValue}
            style={{ marginTop: 0 }} /* Adjusted marginTop as it's inside a flex container */
          />
        </div>
        {/* Profit Trend panel */}
        <div> {/* Removed specific ref if it was only for individual export */}
          <Profitchart
            tableData={tableData}
            selectedPeriods={selectedPeriods}
            computeCellValue={computeCellValue}
            style={{ marginTop: 0 }} /* Adjusted marginTop */
          />
        </div>
      </div>
      {/* AI Write-up panel at the end */}
      <div ref={aiWriteupPanelRef} style={{ marginTop: 60 }}> {/* Added marginTop for spacing after combined charts*/}
        <AIWriteupPanel
          tableData={tableData}
          selectedPeriods={selectedPeriods}
          basePeriod={basePeriod}
          division={selectedDivision}
          chatContext={null} // TODO: pass chat context if available
          computeCellValue={computeCellValue}
        />
      </div>
    </div>
  );
};

export default ChartContainer; 
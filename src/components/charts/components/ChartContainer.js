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

  // Improved captureChartForPDF for better sizing and padding
  async function captureChartForPDF(ChartComponent, props, width, height) {
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.position = 'fixed';
    hiddenDiv.style.left = '-9999px';
    hiddenDiv.style.top = '0';
    hiddenDiv.style.width = width + 'px';
    hiddenDiv.style.height = height + 'px';
    hiddenDiv.style.background = '#fff';
    hiddenDiv.style.zIndex = '-1000';
    hiddenDiv.style.overflow = 'hidden';
    hiddenDiv.style.boxSizing = 'border-box';
    document.body.appendChild(hiddenDiv);

    const root = createRoot(hiddenDiv);
    root.render(
      <div style={{ 
        width: width, 
        height: height, 
        background: '#fff',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <ChartComponent {...props} />
      </div>
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(hiddenDiv, {
      scale: 2,
      useCORS: true,
      width,
      height,
      backgroundColor: '#fff',
      logging: true
    });

    root.unmount();
    document.body.removeChild(hiddenDiv);

    return canvas;
  }

  const handleExportToPDF = async () => {
    try {
      const mainPdf = new jsPDF('l', 'pt', 'a3'); // A3 Landscape
      const pagePadding = 40;
    const pdfPageWidth = mainPdf.internal.pageSize.getWidth();
    const pdfPageHeight = mainPdf.internal.pageSize.getHeight();
    const availableWidth = pdfPageWidth - (2 * pagePadding);
    const availableHeight = pdfPageHeight - (2 * pagePadding);

      // --- Special handling for Bar Chart: render into hidden container sized to PDF page ---
      const hiddenDiv = document.createElement('div');
      hiddenDiv.style.position = 'fixed';
      hiddenDiv.style.left = '-9999px';
      hiddenDiv.style.top = '0';
      // Give extra space for chart title, legend, and internal padding
      hiddenDiv.style.width = (availableWidth + 100) + 'px';
      hiddenDiv.style.height = (availableHeight + 100) + 'px';
      hiddenDiv.style.background = '#fff';
      hiddenDiv.style.zIndex = '-1000';
      hiddenDiv.style.overflow = 'visible';
      hiddenDiv.style.boxSizing = 'border-box';
      document.body.appendChild(hiddenDiv);

      const root = createRoot(hiddenDiv);
      root.render(
        <div style={{ 
          width: availableWidth + 100, 
          height: availableHeight + 100, 
          background: '#fff',
          padding: '30px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <BarChart
              data={chartData}
              periods={filteredPeriods}
              basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''}
            />
          </div>
        </div>
      );

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 1000));

      const barChartCanvas = await html2canvas(hiddenDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: availableWidth + 100,
        height: availableHeight + 100,
        backgroundColor: '#fff',
        removeContainer: true,
        imageTimeout: 15000
      });

      root.unmount();
      document.body.removeChild(hiddenDiv);

      if (barChartCanvas.width === 0 || barChartCanvas.height === 0) {
        console.error('Bar Chart canvas is empty');
      } else {
        const imgData = barChartCanvas.toDataURL('image/png', 1.0);
        const imgProps = mainPdf.getImageProperties(imgData);
        
        // Fill the entire available area
        mainPdf.addImage(imgData, 'PNG', pagePadding, pagePadding, availableWidth, availableHeight);
      }

      // --- Export the rest of the charts with maximum size ---
      const chartElements = [
        { 
          ref: modernMarginGaugeRef, 
          name: 'Modern Margin Gauge',
          component: ModernMarginGauge,
          props: {
        data: chartData,
        periods: filteredPeriods,
        basePeriod: basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''
          }
        },
        { 
          ref: manufacturingCostChartRef, 
          name: 'Manufacturing Cost Chart',
          component: ManufacturingCostChart,
          props: {
            tableData: tableData,
            selectedPeriods: selectedPeriods,
            computeCellValue: computeCellValue
          }
        },
        { 
          ref: belowGPExpensesChartRef, 
          name: 'Below GP Expenses Chart',
          component: BelowGPExpensesChart,
          props: {
            tableData: tableData,
            selectedPeriods: selectedPeriods,
            computeCellValue: computeCellValue
          }
        },
        { 
          ref: combinedTrendsRef, 
          name: 'Key Trends (Expenses, Net Profit, EBITDA)',
          component: ({ tableData, selectedPeriods, computeCellValue }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', height: '100%' }}>
              <div style={{ flex: 1 }}>
                <ExpencesChart
                  tableData={tableData}
                  selectedPeriods={selectedPeriods}
                  computeCellValue={computeCellValue}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Profitchart
                  tableData={tableData}
                  selectedPeriods={selectedPeriods}
                  computeCellValue={computeCellValue}
                />
              </div>
            </div>
          ),
          props: {
            tableData: tableData,
            selectedPeriods: selectedPeriods,
            computeCellValue: computeCellValue
          }
        }
      ];

      for (let i = 0; i < chartElements.length; i++) {
      const chartItem = chartElements[i];
      if (chartItem.ref.current) {
        mainPdf.addPage('a3', 'l');
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            // First try to capture the existing chart with better sizing
        const targetElement = chartItem.ref.current;
            
            // Temporarily modify the target element for better PDF capture
            const originalStyle = {
              width: targetElement.style.width,
              height: targetElement.style.height,
              transform: targetElement.style.transform,
              padding: targetElement.style.padding
            };
            
            targetElement.style.width = availableWidth + 'px';
            targetElement.style.height = availableHeight + 'px';
            targetElement.style.transform = 'scale(1)';
            targetElement.style.padding = '20px';
            targetElement.style.boxSizing = 'border-box';

            await new Promise(resolve => setTimeout(resolve, 1000));
        
        const canvas = await html2canvas(targetElement, { 
          scale: 1.5, 
          useCORS: true, 
              allowTaint: true,
              logging: false,
              width: availableWidth,
              height: availableHeight,
              backgroundColor: '#ffffff',
              removeContainer: true,
              imageTimeout: 20000
            });

            // Restore original styles
            targetElement.style.width = originalStyle.width;
            targetElement.style.height = originalStyle.height;
            targetElement.style.transform = originalStyle.transform;
            targetElement.style.padding = originalStyle.padding;

            if (canvas.width === 0 || canvas.height === 0) {
              console.error(`Canvas is empty for ${chartItem.name}`);
              continue;
            }
            const imgData = canvas.toDataURL('image/png', 0.9);
            if (imgData === 'data:,') {
              console.error(`No image data for ${chartItem.name}`);
              continue;
            }
            
            // Fill the entire available area
            mainPdf.addImage(imgData, 'PNG', pagePadding, pagePadding, availableWidth, availableHeight);
          } catch (error) {
            console.error(`Error capturing ${chartItem.name}:`, error);
            mainPdf.setFontSize(16);
            mainPdf.text(`Error capturing ${chartItem.name}`, pagePadding, pagePadding + 50);
            mainPdf.setFontSize(12);
            mainPdf.text(error.message, pagePadding, pagePadding + 80);
          }
        } else {
          console.warn(`Reference not found for ${chartItem.name}`);
        }
      }

      // --- AI Write-up Panel with full panel styling ---
      if (aiWriteupPanelRef.current) {
        mainPdf.addPage('a3', 'p');
        const portraitPageWidth = mainPdf.internal.pageSize.getWidth();
        const portraitPageHeight = mainPdf.internal.pageSize.getHeight();
        const portraitPadding = 20; // Reduced padding for more content space
        const fullContentWidth = portraitPageWidth - (2 * portraitPadding);
        const maxContentHeight = portraitPageHeight - (2 * portraitPadding);
        
        try {
          // Create a hidden container for the full AI writeup panel
          const writeupHiddenDiv = document.createElement('div');
          writeupHiddenDiv.style.position = 'fixed';
          writeupHiddenDiv.style.left = '-9999px';
          writeupHiddenDiv.style.top = '0';
          writeupHiddenDiv.style.width = fullContentWidth + 'px';
          writeupHiddenDiv.style.height = maxContentHeight + 'px';
          writeupHiddenDiv.style.background = '#ffffff';
          writeupHiddenDiv.style.zIndex = '-1000';
          writeupHiddenDiv.style.overflow = 'visible';
          writeupHiddenDiv.style.boxSizing = 'border-box';
          writeupHiddenDiv.style.padding = '30px';
          document.body.appendChild(writeupHiddenDiv);

          const writeupRoot = createRoot(writeupHiddenDiv);
          
          writeupRoot.render(
            <div style={{ 
              width: '100%', 
              minHeight: '100%',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              padding: '30px',
              boxSizing: 'border-box',
              fontFamily: 'Arial, sans-serif'
            }}>
              <AIWriteupPanel
                tableData={tableData}
                selectedPeriods={selectedPeriods}
                basePeriod={basePeriod}
                division={selectedDivision}
                chatContext={null}
                computeCellValue={computeCellValue}
              />
            </div>
          );

          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const canvas = await html2canvas(writeupHiddenDiv, { 
            scale: 1.5,
        useCORS: true, 
            allowTaint: true,
            logging: false,
            width: fullContentWidth,
            height: maxContentHeight,
            backgroundColor: '#ffffff',
            removeContainer: true,
            imageTimeout: 20000
          });
          
          writeupRoot.unmount();
          document.body.removeChild(writeupHiddenDiv);

          if (canvas.width === 0 || canvas.height === 0) {
            console.error('AI Writeup canvas is empty');
            mainPdf.setFontSize(16);
            mainPdf.text('AI Writeup content could not be captured', portraitPadding, portraitPadding + 50);
          } else {
            const imgData = canvas.toDataURL('image/png', 0.9);
            // Use the full available area for the writeup
            mainPdf.addImage(imgData, 'PNG', portraitPadding, portraitPadding, fullContentWidth, maxContentHeight);
          }
          
        } catch (error) {
          console.error('Error capturing AI Writeup:', error);
          mainPdf.setFontSize(16);
          mainPdf.text('Error capturing AI Writeup', portraitPadding, portraitPadding + 50);
          mainPdf.setFontSize(12);
          mainPdf.text(error.message, portraitPadding, portraitPadding + 80);
        }
      }
      mainPdf.save('dashboard_export.pdf');
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
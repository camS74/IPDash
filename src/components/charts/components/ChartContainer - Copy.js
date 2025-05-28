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

  // New function to handle combined PDF export
  const handleExportAllCharts = async () => {
    try {
      // Create a new PDF document in landscape mode for better chart visibility
        const pdf = new jsPDF({
        orientation: 'landscape',
          unit: 'pt',
          format: 'a4'
        });

      // A4 landscape dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();  // 842pt
      const pageHeight = pdf.internal.pageSize.getHeight(); // 595pt

      // Set minimal margins - prioritize left/right space for charts
      const margins = {
        top: 20,    // Reduced since no title
        right: 20,  // Minimal right margin
        bottom: 20, // Reduced since no title
        left: 20    // Minimal left margin
      };

      // Calculate available space for content - maximize width usage
      const contentWidth = pageWidth - (margins.left + margins.right);
      const contentHeight = pageHeight - (margins.top + margins.bottom);

      // Array of charts to export with their refs and names
      const chartsToExport = [
        { ref: barChartRef, name: 'Bar Chart' },
        { ref: modernMarginGaugeRef, name: 'Modern Margin Gauge' },
        { ref: manufacturingCostChartRef, name: 'Manufacturing Cost Chart' },
        { ref: belowGPExpensesChartRef, name: 'Below GP Expenses Chart' },
        { ref: combinedTrendsRef, name: 'Combined Trends' },
        { ref: aiWriteupPanelRef, name: 'AI Writeup' }
      ];

      let currentPage = 1;

      // Helper function to add a new page without title
      const addNewPage = () => {
        if (currentPage > 1) {
          pdf.addPage();
        }
        currentPage++;
      };

      // Process each chart
      for (const chart of chartsToExport) {
        if (!chart.ref.current) {
          console.warn(`Chart reference not found for ${chart.name}`);
          continue;
        }

        // Special handling for AI Writeup - use portrait orientation
        if (chart.name === 'AI Writeup') {
          // For AI Writeup, capture as image in portrait mode to preserve formatting
          pdf.addPage('portrait');
          currentPage++;
          
          // Portrait dimensions
          const portraitWidth = 595;
          const portraitHeight = 842;
          const portraitMargins = {
            top: 40,
            right: 40,
            bottom: 40,
            left: 40
          };
          const portraitContentWidth = portraitWidth - (portraitMargins.left + portraitMargins.right);
          const portraitContentHeight = portraitHeight - (portraitMargins.top + portraitMargins.bottom);
          
          // Capture AI Writeup as image to preserve formatting
          let chartNode = chart.ref.current;
          
          // Find the contenteditable div that contains the actual AI-generated text
          let contentDiv = chartNode.querySelector('div[contenteditable]');
          if (!contentDiv) {
            console.warn('Could not find contenteditable div in AI Writeup panel');
            contentDiv = chartNode; // Fallback to entire panel
          }
          
          // Set up the content area for better capture - targeting only the text content
          const originalStyle = contentDiv.style.cssText;
          contentDiv.style.width = `${portraitContentWidth}px`; // Match PDF content width exactly
          contentDiv.style.padding = '20px';
          contentDiv.style.backgroundColor = '#ffffff';
          contentDiv.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';
          contentDiv.style.lineHeight = '1.6';
          contentDiv.style.fontSize = '11px'; // Smaller font for better fitting
          contentDiv.style.color = '#000000';
          contentDiv.style.border = 'none';
          contentDiv.style.outline = 'none';
          contentDiv.style.boxSizing = 'border-box';
          
          // Wait for style application
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Check the actual height after styling
          const totalHeight = contentDiv.scrollHeight;
          const maxPageHeight = portraitHeight - portraitMargins.top - portraitMargins.bottom;
          
          // If content fits on one page, capture it all
          if (totalHeight <= maxPageHeight) {
            const captureOptions = {
              scale: 1,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              logging: false,
              width: portraitContentWidth,
              height: totalHeight
            };

            const canvas = await html2canvas(contentDiv, captureOptions);
            const imgData = canvas.toDataURL('image/png', 0.95);
            
            // Add the single image to PDF
            pdf.addImage(
              imgData, 
              'PNG', 
              portraitMargins.left, 
              portraitMargins.top, 
              portraitContentWidth, 
              totalHeight
            );
          } else {
            // For longer content, let it flow naturally and use multiple pages
            // Set a reasonable height limit per page
            const pageContentHeight = maxPageHeight - 40; // Leave some margin for safety
            
            contentDiv.style.height = `${pageContentHeight}px`;
            contentDiv.style.overflow = 'hidden';
            
            let currentOffset = 0;
            let pageNumber = 0;
            
            while (currentOffset < totalHeight) {
              if (pageNumber > 0) {
                pdf.addPage('portrait');
              }
              
              // Set the scroll position for this page
              contentDiv.scrollTop = currentOffset;
              
              await new Promise(resolve => setTimeout(resolve, 100));
              
              const captureOptions = {
                scale: 1,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: portraitContentWidth,
                height: Math.min(pageContentHeight, totalHeight - currentOffset)
              };

              const canvas = await html2canvas(contentDiv, captureOptions);
              const imgData = canvas.toDataURL('image/png', 0.95);
              
              // Add this page to PDF
              pdf.addImage(
                imgData, 
                'PNG', 
                portraitMargins.left, 
                portraitMargins.top, 
                portraitContentWidth, 
                Math.min(pageContentHeight, totalHeight - currentOffset)
              );
              
              currentOffset += pageContentHeight;
              pageNumber++;
              
              // Safety break to avoid infinite loops
              if (pageNumber > 10) {
                console.warn('Too many pages, breaking to avoid infinite loop');
                break;
              }
            }
          }
          
          // Restore original style
          contentDiv.style.cssText = originalStyle;
          
          continue;
        }

        // For all other charts - maximize size and center without titles
        addNewPage();

      let imgData = null;

        // Try ECharts export first with optimized dimensions for smaller file size
        if (chart.ref.current && typeof chart.ref.current.getEchartsInstance === 'function') {
          const instance = chart.ref.current.getEchartsInstance();
        if (instance) {
            // Use full content dimensions to avoid cutting charts
          instance.resize({
              width: contentWidth,  // Use full 802pt width
              height: contentHeight // Use full 555pt height
          });
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            imgData = instance.getDataURL({
                type: 'png', // Use PNG for charts - better quality for graphics
                pixelRatio: 2, // Good quality without being excessive
              backgroundColor: '#fff',
              width: contentWidth,
              height: contentHeight
            });
          } catch (echartsError) {
              console.error(`Error getting chart data URL for ${chart.name}:`, echartsError);
          }
        }
      }

        // Fallback to html2canvas with balanced settings
      if (!imgData) {
          let chartNode = chart.ref.current;
          
          // Balanced capture options - quality vs file size
          const captureOptions = {
            scale: 2, // Good quality scale
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#fff',
            logging: false,
            // Use actual chart dimensions, don't cap artificially
            width: Math.max(chartNode.scrollWidth, contentWidth),
            height: Math.max(chartNode.scrollHeight, contentHeight)
          };

          const canvas = await html2canvas(chartNode, captureOptions);
          imgData = canvas.toDataURL('image/png', 0.92); // High quality PNG with slight compression
        }

        // Add image to PDF - centered and maximized without title space
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
              // Calculate dimensions to maximize chart size while maintaining aspect ratio
              const imgAspectRatio = img.width / img.height;
              const contentAspectRatio = contentWidth / contentHeight;
              
              let finalWidth, finalHeight;
              
              if (imgAspectRatio > contentAspectRatio) {
                // Image is wider - constrain by width
                finalWidth = contentWidth;
                finalHeight = contentWidth / imgAspectRatio;
              } else {
                // Image is taller - constrain by height
                finalHeight = contentHeight;
                finalWidth = contentHeight * imgAspectRatio;
              }
              
              // Center the image both horizontally and vertically (no title space needed)
              const x = margins.left + (contentWidth - finalWidth) / 2;
              const y = margins.top + (contentHeight - finalHeight) / 2;

              // Add image as PNG with moderate compression
              pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'SLOW');
            resolve();
          } catch (error) {
              console.error(`Error adding image to PDF for ${chart.name}:`, error);
            reject(error);
          }
        };
        img.onerror = (error) => {
            console.error(`Error loading image for ${chart.name}:`, error);
          reject(error);
        };
        img.src = imgData;
      });
      }

      // Save the combined PDF with compression
      pdf.save('Combined_Charts_Export.pdf', { compress: true });
    } catch (error) {
      console.error('Failed to export combined charts:', error);
      alert('Failed to export combined charts. Please check the console for details.');
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
      {/* Add Export All button at the top */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <Button 
          type="primary" 
          size="large"
          onClick={handleExportAllCharts}
          style={{ 
            backgroundColor: '#1890ff',
            borderColor: '#1890ff',
            padding: '0 24px',
            height: '40px',
            fontSize: '16px'
          }}
        >
          Export All Charts to PDF
        </Button>
      </div>

      {/* Bar chart container */}
      <div ref={barChartRef} className="modern-margin-gauge-panel" style={{ marginTop: 20 }}>
        <BarChart
          data={chartData}
          periods={filteredPeriods}
          basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''}
        />
      </div>

      {/* Modern Gauge chart */}
      <div ref={modernMarginGaugeRef} style={{ marginTop: 40 }}>
        <ModernMarginGauge
          data={chartData}
          periods={filteredPeriods}
          basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''}
        />
      </div>

      {/* Manufacturing Cost chart */}
      <div ref={manufacturingCostChartRef} style={{ marginTop: 40 }}>
        <ManufacturingCostChart
          tableData={tableData}
          selectedPeriods={selectedPeriods}
          computeCellValue={computeCellValue}
        />
      </div>

      {/* Below GP Expenses chart */}
      <div ref={belowGPExpensesChartRef} style={{ marginTop: 40 }}>
        <BelowGPExpensesChart
          tableData={tableData}
          selectedPeriods={selectedPeriods}
          computeCellValue={computeCellValue}
        />
      </div>

      {/* Combined Trends */}
      <div ref={combinedTrendsRef} style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
          <ExpencesChart
            tableData={tableData}
            selectedPeriods={selectedPeriods}
            computeCellValue={computeCellValue}
          />
          <Profitchart
            tableData={tableData}
            selectedPeriods={selectedPeriods}
            computeCellValue={computeCellValue}
          />
        </div>
      </div>

      {/* AI Write-up panel */}
      <div ref={aiWriteupPanelRef} style={{ marginTop: 40 }}>
        <AIWriteupPanel
          tableData={tableData}
          selectedPeriods={selectedPeriods}
          basePeriod={basePeriod}
          division={selectedDivision}
          chatContext={null}
          computeCellValue={computeCellValue}
        />
      </div>
    </div>
  );
};

export default ChartContainer; 
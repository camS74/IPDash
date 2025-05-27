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

  // Helper function to export a single chart to PDF
  const handleExportSingleChart = async (ref, name) => {
    if (!ref.current) {
      console.error(`Chart reference not found for ${name}`);
      return;
    }

    // Special export logic for AI Writeup
    if (name === 'AI Writeup') {
      try {
        // Find the contentEditable div inside .ai-writeup-content
        let writeupNode = ref.current;
        const aiWriteupContent = writeupNode.classList.contains('ai-writeup-content')
          ? writeupNode
          : writeupNode.querySelector('.ai-writeup-content');
        if (!aiWriteupContent) throw new Error('Could not find .ai-writeup-content');
        const editableDiv = aiWriteupContent.querySelector('div[contenteditable]');
        if (!editableDiv) throw new Error('Could not find contentEditable writeup div');

        // Get only the plain text (no HTML, no formatting)
        const plainText = editableDiv.innerText || editableDiv.textContent || '';
        console.log('AI Writeup export - extracted plainText:', plainText);

        // Set up jsPDF for A4 portrait
        const portraitWidth = 595; // A4 portrait width in pt
        const portraitHeight = 842; // A4 portrait height in pt
        const margin = 40; // 40pt margin
        const contentWidth = portraitWidth - 2 * margin;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);

        // Improved formatting for AI Writeup export
        const paragraphs = plainText.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        let y = margin;
        const lineHeight = 14;
        const paraSpacing = 8;
        const headingSpacing = 16;
        const bulletIndent = 18;
        const sectionSpacing = 18;

        // Helper to replace Unicode punctuation with ASCII equivalents
        function toAscii(str) {
          return str
            .replace(/[‘’‛‹›]/g, "'")
            .replace(/[“”«»„‟]/g, '"')
            .replace(/[–—−]/g, '-')
            .replace(/[•·]/g, '*')
            .replace(/[…]/g, '...')
            .replace(/[^\x00-\x7F]/g, '') // Remove any other non-ASCII
            .replace(/\s+/g, ' ')
            .replace(/\u00A0/g, ' ')
            .trim();
        }

        for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
          let para = paragraphs[pIdx];
          // Split into lines for finer control
          const lines = para.split(/\n/).map(l => l.trim()).filter(Boolean);
          for (let lIdx = 0; lIdx < lines.length; lIdx++) {
            let line = lines[lIdx];
            // Detect headings (all caps or lines ending with ':')
            const isHeading = /^([A-Z\s\-:0-9]+)$/.test(line) || /:$/.test(line);
            // Detect subheadings (first word or two in all caps, but not full line)
            const isSubheading = /^[A-Z][A-Z\s]+:/.test(line) && !isHeading;
            // Detect bullet points
            const isBullet = line.startsWith('• ') || line.startsWith('- ');

            if (isHeading) {
              pdf.setFont(undefined, 'bold');
              pdf.setFontSize(13);
              if (y > margin) y += headingSpacing;
            } else if (isSubheading) {
              pdf.setFont(undefined, 'bold');
              pdf.setFontSize(11);
              if (y > margin) y += paraSpacing;
            } else {
              pdf.setFont(undefined, 'normal');
              pdf.setFontSize(11);
            }

            if (isBullet) {
              // Bullet point: indent and use bullet
              const text = line.replace(/^[-•]\s*/, '');
              const bulletLines = pdf.splitTextToSize(text, contentWidth - bulletIndent);
              for (let bl = 0; bl < bulletLines.length; bl++) {
                if (y + lineHeight > portraitHeight - margin) {
                  pdf.addPage();
                  y = margin;
                }
                // Sanitize line before rendering
                const sanitized = toAscii(bulletLines[bl]);
                pdf.text('*', margin + 2, y);
                pdf.text(sanitized, margin + bulletIndent, y);
                y += lineHeight;
              }
              y += 2;
            } else {
              // Normal or heading/subheading
              const normalLines = pdf.splitTextToSize(line, contentWidth);
              for (let nl = 0; nl < normalLines.length; nl++) {
                if (y + lineHeight > portraitHeight - margin) {
                  pdf.addPage();
                  y = margin;
                }
                // Sanitize line before rendering
                const sanitized = toAscii(normalLines[nl]);
                pdf.text(sanitized, margin, y);
                y += lineHeight;
              }
              if (isHeading) {
                y += headingSpacing;
              } else if (isSubheading) {
                y += paraSpacing;
              } else {
                y += paraSpacing;
              }
            }
          }
          // Add extra space between sections
          if (pIdx < paragraphs.length - 1) {
            y += sectionSpacing;
          }
        }

        pdf.save('AI_Writeup_export.pdf');
        return;
      } catch (error) {
        console.error('Failed to export AI Writeup:', error);
        alert('Failed to export AI Writeup. Please check the console for details.');
      }
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      // A4 landscape dimensions: 842pt × 595pt
      const pageWidth = pdf.internal.pageSize.getWidth();  // 842pt
      const pageHeight = pdf.internal.pageSize.getHeight(); // 595pt

      // Set margins (in points)
      const margins = {
        top: 40,
        right: 40,
        bottom: 40,
        left: 40
      };

      // Calculate available space for content
      const contentWidth = pageWidth - (margins.left + margins.right);
      const contentHeight = pageHeight - (margins.top + margins.bottom);

      let imgData = null;

      // Try ECharts export first if available
      if (ref.current && typeof ref.current.getEchartsInstance === 'function') {
        console.log(`Attempting to get ECharts instance for ${name}...`);
        const instance = ref.current.getEchartsInstance();
        
        if (instance) {
          console.log(`ECharts instance found for ${name}, preparing export...`);
          // Resize chart to fit content area
          instance.resize({
            width: contentWidth,
            height: contentHeight
          });
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            imgData = instance.getDataURL({
              type: 'png',
              pixelRatio: 2,
              backgroundColor: '#fff',
              width: contentWidth,
              height: contentHeight
            });
            console.log(`Successfully got chart data URL for ${name}`);
          } catch (echartsError) {
            console.error(`Error getting chart data URL for ${name}:`, echartsError);
          }
        }
      }

      // If ECharts export failed or isn't available, use html2canvas
      if (!imgData) {
        console.log(`Using html2canvas for ${name} export...`);
        let chartNode = ref.current;
        
        // Capture the entire content
        const canvas = await html2canvas(chartNode, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#fff',
          logging: true,
          width: chartNode.scrollWidth,
          height: chartNode.scrollHeight
        });

        imgData = canvas.toDataURL('image/png', 0.95);
        console.log(`Successfully captured ${name} using html2canvas`);
      }

      // Add image to PDF with proper scaling
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            // Always scale to fill the content width, even if it means stretching
            const finalWidth = contentWidth;
            const finalHeight = img.height * (contentWidth / img.width);
            let y = (pageHeight - finalHeight) / 2;
            if (finalHeight > contentHeight) {
              // If the scaled height is too tall, crop from the top
              y = margins.top;
            }
            const x = margins.left;

            // Add the image to the PDF
            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            
            // Add a title
            pdf.setFontSize(16);
            pdf.text(name, pageWidth / 2, margins.top / 2, { align: 'center' });
            
            pdf.save(`${name.replace(/\s+/g, '_')}_export.pdf`);
            resolve();
          } catch (error) {
            console.error(`Error adding image to PDF for ${name}:`, error);
            reject(error);
          }
        };
        img.onerror = (error) => {
          console.error(`Error loading image for ${name}:`, error);
          reject(error);
        };
        img.src = imgData;
      });

    } catch (error) {
      console.error(`PDF export failed for ${name}:`, error);
      alert(`Failed to export ${name}. Please check the console for details.`);
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
      {/* Bar chart container */}
      <div ref={barChartRef} className="modern-margin-gauge-panel" style={{ marginTop: 20 }}>
        <BarChart
          data={chartData}
          periods={filteredPeriods}
          basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''}
        />
        <Button 
          type="primary" 
          style={{ marginTop: 16 }}
          onClick={() => handleExportSingleChart(barChartRef, 'Bar Chart')}
        >
          Export Bar Chart
        </Button>
      </div>

      {/* Modern Gauge chart */}
      <div ref={modernMarginGaugeRef} style={{ marginTop: 40 }}>
        <ModernMarginGauge
          data={chartData}
          periods={filteredPeriods}
          basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''}
        />
        <Button 
          type="primary" 
          style={{ marginTop: 16 }}
          onClick={() => handleExportSingleChart(modernMarginGaugeRef, 'Modern Margin Gauge')}
        >
          Export Gauge
        </Button>
      </div>

      {/* Manufacturing Cost chart */}
      <div ref={manufacturingCostChartRef} style={{ marginTop: 40 }}>
        <ManufacturingCostChart
          tableData={tableData}
          selectedPeriods={selectedPeriods}
          computeCellValue={computeCellValue}
        />
        <Button 
          type="primary" 
          style={{ marginTop: 16 }}
          onClick={() => handleExportSingleChart(manufacturingCostChartRef, 'Manufacturing Cost Chart')}
        >
          Export Cost Chart
        </Button>
      </div>

      {/* Below GP Expenses chart */}
      <div ref={belowGPExpensesChartRef} style={{ marginTop: 40 }}>
        <BelowGPExpensesChart
          tableData={tableData}
          selectedPeriods={selectedPeriods}
          computeCellValue={computeCellValue}
        />
        <Button 
          type="primary" 
          style={{ marginTop: 16 }}
          onClick={() => handleExportSingleChart(belowGPExpensesChartRef, 'Below GP Expenses Chart')}
        >
          Export Expenses Chart
        </Button>
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
        <Button 
          type="primary" 
          style={{ marginTop: 16 }}
          onClick={() => handleExportSingleChart(combinedTrendsRef, 'Combined Trends')}
        >
          Export Trends
        </Button>
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
        <Button 
          type="primary" 
          style={{ marginTop: 16 }}
          onClick={() => handleExportSingleChart(aiWriteupPanelRef, 'AI Writeup')}
        >
          Export AI Writeup
        </Button>
      </div>
    </div>
  );
};

export default ChartContainer; 
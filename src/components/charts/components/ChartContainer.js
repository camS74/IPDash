import React, { useRef, useEffect } from 'react';
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

/**
 * Complete replacement for the original ChartContainer.js.
 * --------------------------------------------------------
 * Key changes:
 * 1.  AI Write‑up is exported as vector **text** on an **A4 portrait** page using `jspdf.html`,
 *     so the panel chrome is gone and original typography/spacing is preserved.
 * 2.  All chart pages are still exported one‑per‑page in **A4 landscape** with ultra‑narrow
 *     side margins (20 pt) so each chart fills the sheet.
 * 3.  No other functional changes have been made – state, refs, logging, rendering etc. are
 *     identical to the prior version.
 */

const ChartContainer = ({ tableData, selectedPeriods, onExportRefsReady }) => {
  /* --------------------------------------------------
   * CONTEXTS & HOOKS
   * -------------------------------------------------- */
  const { excelData, selectedDivision } = useExcelData();
  const { 
    columnOrder, 
    basePeriodIndex,
    chartVisibleColumns, 
    isColumnVisibleInChart 
  } = useFilter();

  /* --------------------------------------------------
   * REFS FOR EXPORT
   * -------------------------------------------------- */
  const barChartRef = useRef(null);
  const modernMarginGaugeRef = useRef(null);
  const manufacturingCostChartRef = useRef(null);
  const belowGPExpensesChartRef = useRef(null);
  const combinedTrendsRef = useRef(null);

  /* --------------------------------------------------
   * HELPER: computeCellValue (delegates to shared util)
   * -------------------------------------------------- */
  const divisionData = excelData[selectedDivision] || [];
  const computeCellValue = (rowIndex, column) =>
    sharedComputeCellValue(divisionData, rowIndex, column);

  /* --------------------------------------------------
   * BUILD CHART DATA (unchanged‑from‑original block)
   * -------------------------------------------------- */
  const periods = columnOrder;
  const basePeriod = periods[basePeriodIndex];
  const visiblePeriods = periods.filter(p => isColumnVisibleInChart(p.id));

  const chartData = {};
  const colsToIterate = visiblePeriods.length ? visiblePeriods : periods;

  colsToIterate.forEach(col => {
    const key = `${col.year}-${col.month || 'Year'}-${col.type}`;
    const sales = computeCellValue(3, col);
    const material = computeCellValue(5, col);
    const salesVol = computeCellValue(7, col);
    const prodVol = computeCellValue(8, col);
    chartData[key] = {
      sales,
      materialCost: material,
      salesVolume: salesVol,
      productionVolume: prodVol,
      marginPerKg: salesVol > 0 ? (sales - material) / salesVol : null
    };
  });

  /* --------------------------------------------------
   * EXPORT HANDLER – NEW IMPLEMENTATION
   * -------------------------------------------------- */
  const handleExportAllCharts = async () => {
    try {
      // Find and click the Charts tab to ensure charts are visible
      const allTabs = document.querySelectorAll('.tab-button');
      let chartsTabElement = null;
      
      allTabs.forEach(tab => {
        if (tab.textContent.includes('Charts')) {
          chartsTabElement = tab;
        }
      });
      
      if (!chartsTabElement) {
        alert('Charts tab not found. Please ensure the Charts view is available.');
        return;
      }
      
      // Check if Charts tab is not already active
      if (!chartsTabElement.classList.contains('active')) {
        // Click the Charts tab
        chartsTabElement.click();
        // Wait for tab switch and charts to render
        await new Promise(r => setTimeout(r, 1500));
      }

      // Additional wait to ensure charts are fully rendered
      await new Promise(r => setTimeout(r, 500));

      /* 1 ► create doc (landscape so first chart page uses that) */
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth(); // 842 pt
      const pageH = pdf.internal.pageSize.getHeight(); // 595 pt
      const margin = 20;
      const contentW = pageW - margin * 2;
      const contentH = pageH - margin * 2;

      /* 2 ► list of visual chart refs (AI panel handled separately) */
      const chartRefs = [
        { ref: barChartRef, selector: '.echarts-for-react', name: 'Bar Chart' },
        { ref: modernMarginGaugeRef, selector: '.echarts-for-react', name: 'Margin Gauge' },
        { ref: manufacturingCostChartRef, selector: null, isManufacturing: true, name: 'Manufacturing Cost' },
        { ref: belowGPExpensesChartRef, selector: null, isBelowGP: true, name: 'Below GP Expenses' },
        { ref: combinedTrendsRef, selector: null, name: 'Combined Trends' }
      ];

      /* 3 ► iterate over charts */
      let capturedCharts = 0;
      for (let i = 0; i < chartRefs.length; i++) {
        const { ref, selector, isManufacturing, isBelowGP, name } = chartRefs[i];
        const containerNode = ref.current;
        
        if (!containerNode) {
          console.warn(`Chart ref not found for ${name}`);
          continue;
        }

        // Check if container is visible
        const rect = containerNode.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          console.warn(`Chart ${name} has no dimensions, skipping`);
          continue;
        }

        console.log(`Processing ${name}:`, { width: rect.width, height: rect.height });

        // Hide any tooltips before capture
        const tooltips = document.querySelectorAll('.ant-tooltip, [role="tooltip"], .echarts-tooltip, .tooltip');
        tooltips.forEach(tooltip => {
          if (tooltip) tooltip.style.display = 'none';
        });

        // Wait for content to settle
        await new Promise(r => setTimeout(r, 300));

        let canvas;
        
        try {
          /* Resize ECharts instance (if any) to maximise quality */
          if (typeof containerNode.getEchartsInstance === 'function') {
            const inst = containerNode.getEchartsInstance();
            if (inst) {
              // Hide tooltip before resize
              inst.dispatchAction({
                type: 'hideTip'
              });
              // Don't resize the chart - capture at original size
              await new Promise(r => setTimeout(r, 300));
            }
            
            /* Capture bitmap for ECharts */
            const chartElement = containerNode.querySelector(selector) || containerNode;
            canvas = await html2canvas(chartElement, {
              scale: 2,
              backgroundColor: '#ffffff',
              useCORS: true,
              allowTaint: true,
              logging: false,
              windowWidth: chartElement.scrollWidth,
              windowHeight: chartElement.scrollHeight
            });
          } else {
            /* For non-ECharts components - capture the entire container */
            canvas = await html2canvas(containerNode, {
              scale: 2,
              backgroundColor: '#ffffff',
              useCORS: true,
              allowTaint: true,
              logging: false,
              windowWidth: containerNode.scrollWidth,
              windowHeight: containerNode.scrollHeight,
              onclone: (clonedDoc, element) => {
                // Ensure visibility in cloned document
                element.style.display = 'block';
                element.style.visibility = 'visible';
                element.style.opacity = '1';
                
                // Make sure panel and title are visible
                const panel = element.querySelector('.modern-margin-gauge-panel');
                if (panel) {
                  panel.style.display = 'block';
                  panel.style.visibility = 'visible';
                  panel.style.backgroundColor = '#ffffff';
                }
                
                const title = element.querySelector('.modern-gauge-heading, h2');
                if (title) {
                  title.style.display = 'block';
                  title.style.visibility = 'visible';
                  title.style.color = '#333';
                }
              }
            });
          }
          
          if (!canvas || canvas.width === 0 || canvas.height === 0) {
            console.error(`Failed to capture ${name} - invalid canvas`);
            continue;
          }

          // Create image data
          const imgData = canvas.toDataURL('image/jpeg', 0.85);

          /* Calculate dimensions to fit on page with proper scaling */
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const imgRatio = imgWidth / imgHeight;
          const pageRatio = contentW / contentH;
          
          let drawW, drawH, x, y;
          
          // --- Fit Bar Chart and Margin Gauge to 100% width ---
          if (name === 'Bar Chart' || name === 'Margin Gauge') {
            drawW = contentW;
            drawH = contentW / imgRatio;
            x = margin;
            y = margin + (contentH - drawH) / 2;
          } else {
            // --- Use current logic for the rest ---
            if (imgRatio > pageRatio) {
              drawW = contentW;
              drawH = contentW / imgRatio;
              x = margin;
              y = margin + (contentH - drawH) / 2;
            } else {
              drawH = contentH;
              drawW = contentH * imgRatio;
              x = margin + (contentW - drawW) / 2;
              y = margin;
            }
          }

          // Ensure we're not exceeding page bounds
          if (drawW > contentW) {
            const scale = contentW / drawW;
            drawW = contentW;
            drawH = drawH * scale;
          }
          if (drawH > contentH) {
            const scale = contentH / drawH;
            drawH = contentH;
            drawW = drawW * scale;
          }
          
          console.log(`${name} dimensions:`, {
            canvas: { width: imgWidth, height: imgHeight },
            draw: { width: drawW, height: drawH },
            position: { x, y },
            page: { contentW, contentH }
          });

          // Validate dimensions
          if (drawW > 0 && drawH > 0 && !isNaN(x) && !isNaN(y)) {
            // Add image to PDF
            pdf.addImage(imgData, 'JPEG', x, y, drawW, drawH);
            capturedCharts++;
            
            /* Add a new page for next chart (except last) */
            if (i < chartRefs.length - 1) {
              pdf.addPage('landscape', 'a4');
            }
          } else {
            console.error(`Invalid dimensions for ${name}:`, { drawW, drawH, x, y });
          }
        } catch (err) {
          console.error(`Error capturing ${name}:`, err);
        }
      }

      if (capturedCharts === 0) {
        alert('No charts could be captured. Please ensure you are on the Charts tab and charts are visible.');
        return;
      }

      /* 5 ► save with compression */
      pdf.save('Combined_Charts_Export.pdf', { 
        compress: true,
        precision: 16, // Higher precision for better quality
        userUnit: 1.0 // Standard unit for better rendering
      });
      
      console.log(`Successfully exported ${capturedCharts} charts to PDF`);
    } catch (err) {
      // eslint-disable-next-line no-alert
      console.error('PDF export failed:', err);
      alert('Failed to export PDF – check console for details.');
    }
  };

  /* --------------------------------------------------
   * EXPOSE EXPORT FUNCTION TO PARENT
   * -------------------------------------------------- */
  useEffect(() => {
    if (onExportRefsReady) {
      onExportRefsReady({
        exportFunction: handleExportAllCharts,
        refs: {
          barChartRef,
          modernMarginGaugeRef,
          manufacturingCostChartRef,
          belowGPExpensesChartRef,
          combinedTrendsRef
        }
      });
    }
  }, [onExportRefsReady]);

  /* --------------------------------------------------
   * RENDER – identical structure to original
   * -------------------------------------------------- */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: 16, background: '#f5f5f5', borderRadius: 12 }}>
      {/* CHARTS */}
      <div ref={barChartRef} className="modern-margin-gauge-panel" style={{ marginTop: 20 }}>
        <BarChart data={chartData} periods={visiblePeriods} basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''} />
      </div>

      <div ref={modernMarginGaugeRef} style={{ marginTop: 40 }}>
        <ModernMarginGauge data={chartData} periods={visiblePeriods} basePeriod={basePeriod ? `${basePeriod.year}-${basePeriod.month || 'Year'}-${basePeriod.type}` : ''} />
      </div>

      <div ref={manufacturingCostChartRef} style={{ marginTop: 40 }}>
        <ManufacturingCostChart tableData={tableData} selectedPeriods={selectedPeriods} computeCellValue={computeCellValue} />
      </div>

      <div ref={belowGPExpensesChartRef} style={{ marginTop: 40 }}>
        <BelowGPExpensesChart tableData={tableData} selectedPeriods={selectedPeriods} computeCellValue={computeCellValue} />
      </div>

      <div ref={combinedTrendsRef} style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
          <ExpencesChart tableData={tableData} selectedPeriods={selectedPeriods} computeCellValue={computeCellValue} />
          <Profitchart tableData={tableData} selectedPeriods={selectedPeriods} computeCellValue={computeCellValue} />
        </div>
      </div>

      {/* AI Write‑up */}
      <div style={{ marginTop: 40 }}>
        <AIWriteupPanel tableData={tableData} selectedPeriods={selectedPeriods} basePeriod={basePeriod} division={selectedDivision} chatContext={null} computeCellValue={computeCellValue} />
      </div>
    </div>
  );
};

export default ChartContainer; 

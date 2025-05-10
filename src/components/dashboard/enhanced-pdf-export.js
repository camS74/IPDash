// Enhanced PDF export function that preserves table structure and styling

const exportToPDF = () => {
  if (!tableRef.current) return;
  
  // Show loading state
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = '<div class="loading-spinner"></div><div>Generating PDF...</div>';
  document.body.appendChild(loadingOverlay);
  
  // Get date for filename
  const today = new Date();
  const dateString = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const fileName = `Financial_Table_${selectedDivision}_${dateString}.pdf`;
  
  try {
    // Create a wrapper div for better control
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-export-wrapper';
    wrapper.style.width = '100%';
    wrapper.style.maxWidth = '1000px'; // Wide enough for landscape A4
    wrapper.style.margin = '0 auto';
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = '#ffffff';
    document.body.appendChild(wrapper);
    
    // Add title
    const titleDiv = document.createElement('div');
    titleDiv.innerHTML = `
      <h2 style="text-align:center; margin-bottom:5px; font-family:Arial, sans-serif; color:#333; font-size:20px;">Financial Table</h2>
      <div style="text-align:center; margin-bottom:20px; font-family:Arial, sans-serif; font-weight:bold; font-size:14px;">(AED) - ${selectedDivision}</div>
    `;
    wrapper.appendChild(titleDiv);
    
    // Create a fully-featured table that matches the on-screen display
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontFamily = 'Arial, sans-serif';
    table.style.fontSize = '10px';
    table.style.tableLayout = 'fixed';
    
    // Create table header - 4 rows for Year, Month, Type, and Metrics
    const thead = document.createElement('thead');
    
    // Row 1: Years
    const yearRow = document.createElement('tr');
    // First column empty
    const emptyHeader = document.createElement('th');
    emptyHeader.style.width = '200px';
    emptyHeader.style.border = '1px solid #ddd';
    emptyHeader.style.padding = '5px';
    emptyHeader.style.textAlign = 'left';
    emptyHeader.style.backgroundColor = '#f9f9f9';
    yearRow.appendChild(emptyHeader);
    
    // Add year headers
    columnOrder.forEach(column => {
      const yearHeader = document.createElement('th');
      yearHeader.textContent = column.year;
      yearHeader.colSpan = 3; // Spans Amount, % of Sales, Sales per Kg
      yearHeader.style.border = '1px solid #ddd';
      yearHeader.style.padding = '5px';
      yearHeader.style.textAlign = 'center';
      
      // Apply color based on column type
      const style = getColumnHeaderStyle(column);
      yearHeader.style.backgroundColor = style.backgroundColor;
      yearHeader.style.color = style.color;
      
      yearRow.appendChild(yearHeader);
    });
    thead.appendChild(yearRow);
    
    // Row 2: Months
    const monthRow = document.createElement('tr');
    // First column empty
    const emptyMonthHeader = document.createElement('th');
    emptyMonthHeader.style.border = '1px solid #ddd';
    emptyMonthHeader.style.padding = '5px';
    emptyMonthHeader.style.textAlign = 'left';
    emptyMonthHeader.style.backgroundColor = '#f9f9f9';
    monthRow.appendChild(emptyMonthHeader);
    
    // Add month headers
    columnOrder.forEach(column => {
      const monthHeader = document.createElement('th');
      monthHeader.textContent = column.month;
      monthHeader.colSpan = 3; // Spans Amount, % of Sales, Sales per Kg
      monthHeader.style.border = '1px solid #ddd';
      monthHeader.style.padding = '5px';
      monthHeader.style.textAlign = 'center';
      
      // Apply color based on column type
      const style = getColumnHeaderStyle(column);
      monthHeader.style.backgroundColor = style.backgroundColor;
      monthHeader.style.color = style.color;
      
      monthRow.appendChild(monthHeader);
    });
    thead.appendChild(monthRow);
    
    // Row 3: Types (Actual, Budget, etc.)
    const typeRow = document.createElement('tr');
    // First column empty
    const emptyTypeHeader = document.createElement('th');
    emptyTypeHeader.style.border = '1px solid #ddd';
    emptyTypeHeader.style.padding = '5px';
    emptyTypeHeader.style.textAlign = 'left';
    emptyTypeHeader.style.backgroundColor = '#f9f9f9';
    typeRow.appendChild(emptyTypeHeader);
    
    // Add type headers
    columnOrder.forEach(column => {
      const typeHeader = document.createElement('th');
      typeHeader.textContent = column.type;
      typeHeader.colSpan = 3; // Spans Amount, % of Sales, Sales per Kg
      typeHeader.style.border = '1px solid #ddd';
      typeHeader.style.padding = '5px';
      typeHeader.style.textAlign = 'center';
      
      // Apply color based on column type
      const style = getColumnHeaderStyle(column);
      typeHeader.style.backgroundColor = style.backgroundColor;
      typeHeader.style.color = style.color;
      
      typeRow.appendChild(typeHeader);
    });
    thead.appendChild(typeRow);
    
    // Row 4: Metrics (Amount, % of Sales, Sales per Kg)
    const metricRow = document.createElement('tr');
    // First column empty
    const emptyMetricHeader = document.createElement('th');
    emptyMetricHeader.style.border = '1px solid #ddd';
    emptyMetricHeader.style.padding = '5px';
    emptyMetricHeader.style.textAlign = 'left';
    emptyMetricHeader.style.backgroundColor = '#f9f9f9';
    metricRow.appendChild(emptyMetricHeader);
    
    // Add metric headers for each column
    columnOrder.forEach(column => {
      // Amount header
      const amountHeader = document.createElement('th');
      amountHeader.textContent = 'Amount';
      amountHeader.style.border = '1px solid #ddd';
      amountHeader.style.padding = '4px';
      amountHeader.style.textAlign = 'center';
      amountHeader.style.fontSize = '9px';
      amountHeader.style.fontWeight = 'bold';
      
      // Apply color based on column type
      const style = getColumnHeaderStyle(column);
      amountHeader.style.backgroundColor = style.backgroundColor;
      amountHeader.style.color = style.color;
      
      // % of Sales header
      const percentHeader = document.createElement('th');
      percentHeader.textContent = '% of Sales';
      percentHeader.style.border = '1px solid #ddd';
      percentHeader.style.padding = '4px';
      percentHeader.style.textAlign = 'center';
      percentHeader.style.fontSize = '9px';
      percentHeader.style.fontWeight = 'bold';
      percentHeader.style.backgroundColor = style.backgroundColor;
      percentHeader.style.color = style.color;
      
      // Sales per Kg header
      const perKgHeader = document.createElement('th');
      perKgHeader.textContent = 'Sales per Kg';
      perKgHeader.style.border = '1px solid #ddd';
      perKgHeader.style.padding = '4px';
      perKgHeader.style.textAlign = 'center';
      perKgHeader.style.fontSize = '9px';
      perKgHeader.style.fontWeight = 'bold';
      perKgHeader.style.backgroundColor = style.backgroundColor;
      perKgHeader.style.color = style.color;
      
      metricRow.appendChild(amountHeader);
      metricRow.appendChild(percentHeader);
      metricRow.appendChild(perKgHeader);
    });
    thead.appendChild(metricRow);
    
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Add data rows
    salesRows.forEach(row => {
      // Handle separator rows
      if (row.isSeparator) {
        const separatorRow = document.createElement('tr');
        const separatorCell = document.createElement('td');
        separatorCell.colSpan = columnOrder.length * 3 + 1; // +1 for the row label column
        separatorCell.style.height = '5px';
        separatorCell.style.padding = '0';
        separatorCell.style.border = 'none';
        separatorCell.style.backgroundColor = '#f9f9f9';
        separatorRow.appendChild(separatorCell);
        tbody.appendChild(separatorRow);
        return;
      }
      
      // Create normal data row
      const dataRow = document.createElement('tr');
      
      // First column: Row label
      const labelCell = document.createElement('td');
      labelCell.textContent = row.label || '';
      labelCell.style.border = '1px solid #ddd';
      labelCell.style.padding = '5px';
      labelCell.style.textAlign = 'left';
      labelCell.style.backgroundColor = '#ffffff';
      
      // Add bold styling for important rows
      const isImportantRow = row.label === 'Sales' || 
                             row.label === 'Margin over Material' || 
                             row.label === 'Cost of Sales' ||
                             row.label === 'Labour' ||
                             row.label === 'Dir.Cost in Stock/Stock Adj.' ||
                             row.label === 'Gross profit (after Depn.)' ||
                             row.label === 'Selling expenses' ||
                             row.label === 'Total Below GP Expenses' ||
                             row.label === 'Total Expenses' ||
                             row.label === 'Net Profit' ||
                             (row.label && row.label.trim().toUpperCase() === 'EBITDA');
      
      if (isImportantRow || row.isHeader) {
        labelCell.style.fontWeight = 'bold';
      }
      
      dataRow.appendChild(labelCell);
      
      // Add cells for each column
      columnOrder.forEach(column => {
        // Get background color for cell
        const bgColor = getCellBackgroundColor(column);
        
        // For calculated cells
        if (row.isCalculated) {
          // Process formula to get actual value
          let formattedResult = 'N/A';
          
          // Calculate values based on formulas - simplified logic
          try {
            if (row.formula === 'sales-material') {
              const salesValue = computeCellValue(3, column);
              const materialValue = computeCellValue(4, column);
              
              const salesNum = salesValue === 'N/A' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
              const materialNum = materialValue === 'N/A' ? 0 : parseFloat(materialValue.replace(/,/g, ''));
              
              const result = salesNum - materialNum;
              formattedResult = result.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              });
            }
            // Add other formula calculations here
            // ...
          } catch (error) {
            console.error('Error calculating formula value:', error);
            formattedResult = 'Calc Error';
          }
          
          // Amount cell
          const amountCell = document.createElement('td');
          amountCell.textContent = formattedResult;
          amountCell.style.border = '1px solid #ddd';
          amountCell.style.padding = '5px';
          amountCell.style.textAlign = 'right';
          amountCell.style.backgroundColor = bgColor;
          amountCell.style.fontStyle = 'italic'; // Indicate calculated value
          
          // % of Sales cell
          const percentCell = document.createElement('td');
          try {
            if (row.index === -5) {
              percentCell.textContent = '';
            } else {
              const cellNum = formattedResult === 'N/A' ? 0 : parseFloat(formattedResult.replace(/,/g, ''));
              const salesValue = computeCellValue(3, column); 
              const salesNum = salesValue === 'N/A' ? 0 : parseFloat(salesValue.replace(/,/g, ''));
              
              if (salesNum === 0) {
                percentCell.textContent = 'N/A';
              } else {
                const percentValue = (cellNum / salesNum) * 100;
                percentCell.textContent = percentValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) + '%';
              }
            }
          } catch (error) {
            percentCell.textContent = 'Error';
          }
          percentCell.style.border = '1px solid #ddd';
          percentCell.style.padding = '5px';
          percentCell.style.textAlign = 'right';
          percentCell.style.backgroundColor = bgColor;
          percentCell.style.fontStyle = 'italic'; // Indicate calculated value
          
          // Sales per Kg cell
          const perKgCell = document.createElement('td');
          try {
            if (row.index === -5) {
              perKgCell.textContent = '';
            } else {
              const cellNum = formattedResult === 'N/A' ? 0 : parseFloat(formattedResult.replace(/,/g, ''));
              const salesVolumeValue = computeCellValue(7, column);
              const salesVolumeNum = salesVolumeValue === 'N/A' ? 0 : parseFloat(salesVolumeValue.replace(/,/g, ''));
              
              if (salesVolumeNum === 0) {
                perKgCell.textContent = 'N/A';
              } else {
                const perKgValue = cellNum / salesVolumeNum;
                perKgCell.textContent = perKgValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
              }
            }
          } catch (error) {
            perKgCell.textContent = 'Error';
          }
          perKgCell.style.border = '1px solid #ddd';
          perKgCell.style.padding = '5px';
          perKgCell.style.textAlign = 'right';
          perKgCell.style.backgroundColor = bgColor;
          perKgCell.style.fontStyle = 'italic'; // Indicate calculated value
          
          if (isImportantRow) {
            amountCell.style.fontWeight = 'bold';
            percentCell.style.fontWeight = 'bold';
            perKgCell.style.fontWeight = 'bold';
          }
          
          dataRow.appendChild(amountCell);
          dataRow.appendChild(percentCell);
          dataRow.appendChild(perKgCell);
        } else {
          // Regular (non-calculated) cells
          const cellValue = row.index > 0 ? computeCellValue(row.index, column) : 'N/A';
          
          // Amount cell
          const amountCell = document.createElement('td');
          amountCell.textContent = cellValue;
          amountCell.style.border = '1px solid #ddd';
          amountCell.style.padding = '5px';
          amountCell.style.textAlign = 'right';
          amountCell.style.backgroundColor = bgColor;
          
          // % of Sales cell
          const percentCell = document.createElement('td');
          if (row.index !== 7 && row.index !== 8 && row.index !== -5) {
            percentCell.textContent = computePercentOfSales(row.index, column);
          } else {
            percentCell.textContent = '';
          }
          percentCell.style.border = '1px solid #ddd';
          percentCell.style.padding = '5px';
          percentCell.style.textAlign = 'right';
          percentCell.style.backgroundColor = bgColor;
          
          // Sales per Kg cell
          const perKgCell = document.createElement('td');
          if (row.index !== 7 && row.index !== 8 && row.index !== -5) {
            perKgCell.textContent = computeSalesPerKg(row.index, column);
          } else {
            perKgCell.textContent = '';
          }
          perKgCell.style.border = '1px solid #ddd';
          perKgCell.style.padding = '5px';
          perKgCell.style.textAlign = 'right';
          perKgCell.style.backgroundColor = bgColor;
          
          if (isImportantRow) {
            amountCell.style.fontWeight = 'bold';
            percentCell.style.fontWeight = 'bold';
            perKgCell.style.fontWeight = 'bold';
          }
          
          dataRow.appendChild(amountCell);
          dataRow.appendChild(percentCell);
          dataRow.appendChild(perKgCell);
        }
      });
      
      tbody.appendChild(dataRow);
    });
    
    table.appendChild(tbody);
    wrapper.appendChild(table);
    
    // Use html2canvas to convert the table to an image
    html2canvas(wrapper, {
      scale: 1.5, // Higher scale for better quality
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    }).then(canvas => {
      try {
        // Create PDF in landscape orientation (A4)
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        
        // Define A4 landscape dimensions (297mm × 210mm)
        const pdfWidth = 297;
        const pdfHeight = 210;
        
        // Calculate margins
        const marginLeft = 10;
        const marginTop = 10;
        
        // Calculate content dimensions to fit on page
        const contentWidth = pdfWidth - (marginLeft * 2);
        const contentHeight = pdfHeight - (marginTop * 2);
        
        // Add image to PDF, fitting within the calculated dimensions
        pdf.addImage(imgData, 'PNG', marginLeft, marginTop, contentWidth, contentHeight);
        
        // Add footer with generation date
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Generated on: ${new Date().toLocaleDateString()} - ${selectedDivision}`, pdfWidth - 15, pdfHeight - 5, { align: 'right' });
        
        // Save PDF
        pdf.save(fileName);
        
        // Clean up
        document.body.removeChild(wrapper);
        document.body.removeChild(loadingOverlay);
      } catch (error) {
        console.error('Error generating PDF:', error);
        document.body.removeChild(wrapper);
        document.body.removeChild(loadingOverlay);
        alert('Error generating PDF. Please try again.');
      }
    }).catch(error => {
      console.error('Error rendering canvas:', error);
      document.body.removeChild(wrapper);
      document.body.removeChild(loadingOverlay);
      alert('Error generating PDF. Please try again.');
    });
  } catch (error) {
    console.error('Error in PDF export process:', error);
    if (document.querySelector('.loading-overlay')) {
      document.body.removeChild(document.querySelector('.loading-overlay'));
    }
    alert('Error generating PDF. Please try again.');
  }
};

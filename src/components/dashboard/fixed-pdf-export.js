// Fixed PDF export function with error handling

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
    wrapper.style.width = '277mm'; // A4 landscape width minus 20mm margins
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.margin = '0';
    wrapper.style.padding = '0';
    wrapper.style.backgroundColor = '#ffffff';
    document.body.appendChild(wrapper);
    
    // Create title for PDF
    const titleDiv = document.createElement('div');
    titleDiv.innerHTML = `
      <h2 style="text-align:center; margin-bottom:5px; margin-top:0; color:#333; font-size:18px;">Financial Table</h2>
      <div style="text-align:center; margin-bottom:10px; font-weight:bold; font-size:12px;">(AED)</div>
    `;
    wrapper.appendChild(titleDiv);
    
    // Clone the table with proper styling preserved
    const tableContent = document.createElement('div');
    tableContent.className = 'pdf-table-container';
    tableContent.style.width = '100%';
    tableContent.style.overflow = 'visible';
    tableContent.style.margin = '0';
    tableContent.style.padding = '0';
    
    // Clone the original table
    const tableClone = tableRef.current.cloneNode(true);
    tableClone.className = 'financial-table pdf-export-table';
    tableClone.style.width = '100%';
    tableClone.style.tableLayout = 'fixed';
    tableClone.style.borderCollapse = 'collapse';
    tableClone.style.margin = '0 auto';
    tableClone.style.fontSize = '9px';
    
    // Adjust cell styles directly
    const allCells = tableClone.querySelectorAll('th, td');
    allCells.forEach(cell => {
      cell.style.fontFamily = 'Arial, sans-serif';
      cell.style.padding = '3px 4px';
      cell.style.fontSize = '9px';
      cell.style.overflow = 'hidden';
      cell.style.textOverflow = 'ellipsis';
      cell.style.whiteSpace = 'nowrap';
      cell.style.border = '1px solid #ddd';
    });
    
    // Handle header styling
    const headerCells = tableClone.querySelectorAll('thead th');
    headerCells.forEach(cell => {
      cell.style.fontWeight = 'bold';
      cell.style.textAlign = 'center';
    });
    
    // Handle first column cells
    const firstColCells = tableClone.querySelectorAll('td:first-child');
    firstColCells.forEach(cell => {
      cell.style.textAlign = 'left';
      cell.style.paddingLeft = '6px';
      cell.style.backgroundColor = '#ffffff';
    });
    
    // Handle amount cells
    const amountCells = tableClone.querySelectorAll('td:nth-child(3n+2)');
    amountCells.forEach(cell => {
      cell.style.textAlign = 'right';
      cell.style.paddingRight = '8px';
    });
    
    // Apply header colors safely
    const headerRows = tableClone.querySelectorAll('thead tr');
    headerRows.forEach((row, rowIndex) => {
      const headerCells = row.querySelectorAll('th');
      headerCells.forEach((cell, cellIndex) => {
        // Skip the first empty cell in the header
        if (rowIndex === 0 && cellIndex === 0) return;
        
        // Apply default header styling if column information is missing
        let backgroundColor = '#288cfa'; // Default blue
        let textColor = '#FFFFFF';      // Default white text
        
        try {
          // Try to get column information safely
          const colIndex = Math.floor((cellIndex - 1) / 3);
          if (colIndex < columnOrder.length) {
            const column = columnOrder[colIndex];
            if (column) {
              // Get style safely with fallbacks
              const style = getColumnHeaderStyle(column);
              if (style) {
                backgroundColor = style.backgroundColor || backgroundColor;
                textColor = style.color || textColor;
              }
            }
          }
        } catch (error) {
          console.log('Error applying header color, using default', error);
        }
        
        // Apply the styles
        cell.style.backgroundColor = backgroundColor;
        cell.style.color = textColor;
      });
    });
    
    // Apply cell background colors safely
    const dataRows = tableClone.querySelectorAll('tbody tr:not(.separator-row)');
    dataRows.forEach(row => {
      const dataCells = row.querySelectorAll('td:not(:first-child)');
      dataCells.forEach((cell, cellIndex) => {
        try {
          const colIndex = Math.floor(cellIndex / 3);
          if (colIndex < columnOrder.length) {
            const column = columnOrder[colIndex];
            if (column) {
              // Get background color safely
              const bgColor = getCellBackgroundColor(column);
              if (bgColor) {
                cell.style.backgroundColor = bgColor;
              }
            }
          }
        } catch (error) {
          console.log('Error applying cell background color', error);
        }
      });
    });
    
    // Ensure separator rows have proper styling
    const separatorRows = tableClone.querySelectorAll('tr.separator-row');
    separatorRows.forEach(row => {
      row.style.height = '4px';
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.padding = '0';
        cell.style.border = 'none';
        cell.style.backgroundColor = '#f9f9f9';
      });
    });
    
    // Add table to the wrapper
    tableContent.appendChild(tableClone);
    wrapper.appendChild(tableContent);
    
    // Use html2canvas with improved settings
    html2canvas(wrapper, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      width: 277*3.78, // Convert mm to px for better scaling
      height: 190*3.78  // Convert mm to px for better scaling
    }).then(canvas => {
      // Define A4 landscape dimensions (297mm × 210mm)
      const pdfWidth = 297;
      const pdfHeight = 210;
      
      // Create PDF in landscape orientation
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Calculate margins
      const marginLeft = 10;
      const marginTop = 10;
      const contentWidth = pdfWidth - (marginLeft * 2);
      const contentHeight = pdfHeight - (marginTop * 2);
      
      // Add the canvas as image
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', marginLeft, marginTop, contentWidth, contentHeight);
      
      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} - ${selectedDivision}`, pdfWidth - 15, pdfHeight - 5, { align: 'right' });
      
      // Save PDF
      pdf.save(fileName);
      
      // Clean up
      document.body.removeChild(wrapper);
      document.body.removeChild(loadingOverlay);
    }).catch(error => {
      console.error('Error generating PDF canvas:', error);
      document.body.removeChild(wrapper);
      document.body.removeChild(loadingOverlay);
      alert('Error generating PDF. Please try again.');
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    document.body.removeChild(loadingOverlay);
    alert('Error generating PDF. Please try again.');
  }
};

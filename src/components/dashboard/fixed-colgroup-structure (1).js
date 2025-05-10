// Fixed table structure with proper colgroups and no React.Fragment

return (
  <div className="table-view">
    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <button 
            onClick={exportToPDF} 
            className="export-pdf-btn"
            title="Export to PDF"
          >
            Export to PDF
          </button>
        </div>
        <div style={{ flex: 2, textAlign: 'center' }}>
          <h3 style={{ marginBottom: '2px', color: '#333' }}>Financial Table</h3>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>(AED)</div>
        </div>
        <div style={{ flex: 1 }}></div>
      </div>
    </div>
    <div className="table-container">
      <table className="financial-table" ref={tableRef}>
        <colgroup>
          {/* First column for row labels */}
          <col style={{ width: '302px' }} />
          
          {/* Add columns for data (3 per period) */}
          {columnOrder.map((_, index) => [
            <col key={`col-amount-${index}`} style={{ width: '185px' }} />,
            <col key={`col-percent-${index}`} style={{ width: '57px' }} />,
            <col key={`col-perkg-${index}`} style={{ width: '57px' }} />
          ])}
        </colgroup>
        
        <thead>
          <tr>
            <th className="empty-header" rowSpan="4"></th>
            
            {/* Year headers */}
            {columnOrder.map((column, index) => (
              <th
                key={`year-${index}`}
                style={getColumnHeaderStyle(column)}
                colSpan="3"
              >
                {column.year}
              </th>
            ))}
          </tr>
          
          <tr>
            {/* Period headers */}
            {columnOrder.map((column, index) => (
              <th
                key={`period-${index}`}
                style={getColumnHeaderStyle(column)}
                colSpan="3"
              >
                {column.month}
              </th>
            ))}
          </tr>
          
          <tr>
            {/* Type headers */}
            {columnOrder.map((column, index) => (
              <th 
                key={`type-${index}`}
                style={getColumnHeaderStyle(column)}
                colSpan="3"
              >
                {column.type}
              </th>
            ))}
          </tr>
          
          <tr>
            {/* Metric headers - using array instead of React.Fragment */}
            {columnOrder.flatMap((column, index) => [
              <th 
                key={`amount-${index}`} 
                style={{
                  ...getColumnHeaderStyle(column), 
                  fontSize: '12px',
                  width: '185px', 
                  padding: '3px'
                }}
              >
                Amount
              </th>,
              <th 
                key={`percent-${index}`} 
                style={{
                  ...getColumnHeaderStyle(column), 
                  fontSize: '12px',
                  width: '57px', 
                  padding: '3px'
                }}
              >
                % of Sales
              </th>,
              <th 
                key={`perkg-${index}`} 
                style={{
                  ...getColumnHeaderStyle(column), 
                  fontSize: '12px',
                  width: '57px', 
                  padding: '3px'
                }}
              >
                Sales per Kg
              </th>
            ])}
          </tr>
        </thead>
        
        <tbody>
          {/* Table body remains the same but make sure React.Fragment is not used */}
          {salesRows.map((row) => {
            // If it's a separator row, render a spacer row
            if (row.isSeparator) {
              return (
                <tr key={row.key} className="separator-row">
                  <td colSpan={(columnOrder.length * 3) + 1}>&nbsp;</td>
                </tr>
              );
            }
            
            // Otherwise render a normal data row
            const isImportantRow = 
              row.label === 'Sales' || 
              row.label === 'Margin over Material' || 
              row.label === 'Cost of Sales' ||
              row.label === 'Labour' ||
              row.label === 'Dir.Cost in Stock/Stock Adj.' ||
              row.label === 'Gross profit (after Depn.)' ||
              row.label === 'Selling expenses' ||
              row.label === 'Total Below GP Expenses' ||
              row.label === 'Total Expenses' ||
              row.label === 'Net Profit' ||
              row.label.trim().toUpperCase() === 'EBITDA';
            
            return (
              <tr key={row.key} className={`${row.isHeader ? 'section-header' : ''} ${isImportantRow ? 'important-row' : ''}`}>
                <td className="row-label">{row.label}</td>
                {/* Use flatMap instead of React.Fragment */}
                {columnOrder.flatMap((column, colIndex) => {
                  // Cell rendering code stays the same but uses array returns 
                  // instead of React.Fragment
                  // (The rest of the code remains the same)
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

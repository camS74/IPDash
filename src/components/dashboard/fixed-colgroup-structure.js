// Fix for the colgroup structure in TableView.js

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
      {/* Financial data table */}
      <table className="financial-table" ref={tableRef}>
        <colgroup>
          {/* First column for row labels */}
          <col style={{ width: '302px' }} />
          
          {/* Add columns for each period (3 columns per period) */}
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
            {/* Metric headers */}
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
        {/* Table body remains the same */}
      </table>
    </div>
  </div>
);

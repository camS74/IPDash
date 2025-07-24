import React from 'react';

const TopCustomersTable = ({ topCustomers, basePeriodIndex, totalKgs }) => {
  const formatNumber = (value, decimals = 0) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return Number(value).toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <div className="report-section">
      <h2>4. Top Customer Performance</h2>
      <div className="customer-table-container">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Customer</th>
              <th>Volume (KGS)</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((customer, index) => {
              const volume = customer.rawValues[basePeriodIndex] || 0;
              const percentage = totalKgs > 0 ? (volume / totalKgs) * 100 : 0;

              return (
                <tr key={customer.name || customer.customerName || index}>
                  <td className="rank-cell">{index + 1}</td>
                  <td className="customer-name">{customer.name || customer.customerName}</td>
                  <td className="number-cell">{formatNumber(volume)}</td>
                  <td className="number-cell">{percentage.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopCustomersTable;

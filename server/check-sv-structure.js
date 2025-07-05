const XLSX = require('xlsx');
const fs = require('fs');

try {
  const workbook = XLSX.readFile('data/Sales.xlsx');
  const sheet = workbook.Sheets['FP-S&V'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('FP-S&V Sheet Structure:');
  console.log('Total rows:', data.length);
  console.log('First 5 rows:');
  data.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}: [${row.join(', ')}]`);
  });
  
  console.log('\nSample data rows (6-10):');
  data.slice(5, 10).forEach((row, i) => {
    console.log(`Row ${i+5}: [${row.join(', ')}]`);
  });
  
  // Check for unique sales reps in column A
  const salesReps = new Set();
  for (let i = 3; i < Math.min(data.length, 103); i++) {
    if (data[i] && data[i][0]) {
      salesReps.add(data[i][0]);
    }
  }
  console.log('\nUnique sales reps found:', Array.from(salesReps));
  
  // Check for unique product groups in column D
  const productGroups = new Set();
  for (let i = 3; i < Math.min(data.length, 103); i++) {
    if (data[i] && data[i][3]) {
      productGroups.add(data[i][3]);
    }
  }
  console.log('\nUnique product groups found:', Array.from(productGroups));
  
  // Check for ledger types in column E
  const ledgerTypes = new Set();
  for (let i = 3; i < Math.min(data.length, 103); i++) {
    if (data[i] && data[i][4]) {
      ledgerTypes.add(data[i][4]);
    }
  }
  console.log('\nUnique ledger types found:', Array.from(ledgerTypes));
  
} catch (error) {
  console.error('Error:', error.message);
} 
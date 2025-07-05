const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('server/data/Sales.xlsx');
  const sheet = workbook.Sheets['FP-S&V'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const salesReps = new Set();
  const productGroups = new Set();
  const ledgerTypes = new Set();

  for (let i = 3; i < Math.min(data.length, 103); i++) {
    const row = data[i];
    if (row) {
      if (row[0]) salesReps.add(row[0]);
      if (row[3]) productGroups.add(row[3]);
      if (row[4]) ledgerTypes.add(row[4]);
    }
  }

  console.log('Unique sales reps in first 100 rows:', Array.from(salesReps));
  console.log('Unique product groups in first 100 rows:', Array.from(productGroups));
  console.log('Unique ledger types in first 100 rows:', Array.from(ledgerTypes));
} catch (error) {
  console.error('Error:', error.message);
} 
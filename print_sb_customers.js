const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('server/data/Sales.xlsx');
let output = '';

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  output += `Sheet: ${sheetName}\nRows: ${data.length}\n`;
  data.slice(0, 3).forEach((row, idx) => {
    output += `  Row ${idx}: ${JSON.stringify(row)}\n`;
  });
  output += '\n';
});

fs.writeFileSync('sb_customers_preview.txt', output);
console.log('Wrote sheet summary to sb_customers_preview.txt'); 
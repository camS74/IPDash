const XLSX = require('xlsx');
const fs = require('fs');

// Test the sales rep data flow
function testSalesRepData() {
  try {
    console.log('=== Testing Sales Rep Data Flow ===\n');
    
    // 1. Check if Sales.xlsx exists and has S&V sheets
    const workbook = XLSX.readFile('data/Sales.xlsx');
    console.log('1. Available sheets:', workbook.SheetNames);
    
    // 2. Check FP-S&V sheet structure
    const fpSheet = workbook.Sheets['FP-S&V'];
    const fpData = XLSX.utils.sheet_to_json(fpSheet, { header: 1 });
    console.log('\n2. FP-S&V sheet has', fpData.length, 'rows');
    
    // 3. Check first few data rows (starting from row 4, index 3)
    console.log('\n3. Sample data rows (4-8):');
    for (let i = 3; i < Math.min(8, fpData.length); i++) {
      const row = fpData[i];
      console.log(`Row ${i}: SalesRep="${row[0]}", ProductGroup="${row[3]}", Ledger="${row[4]}"`);
    }
    
    // 4. Check configured sales reps
    const configPath = 'data/sales-reps-config.json';
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('\n4. Configured sales reps for FP:', config.FP?.defaults || []);
      console.log('   Sales rep groups:', Object.keys(config.FP?.groups || {}));
    } else {
      console.log('\n4. No sales-reps-config.json found');
    }
    
    // 5. Test filtering logic
    console.log('\n5. Testing filtering logic:');
    const testRep = 'Abraham Mathew';
    const testVariable = 'KGS';
    const dataRows = fpData.slice(3, 103); // First 100 data rows
    
    // Filter by sales rep and ledger type
    const filteredRows = dataRows.filter(row => {
      return row[0] === testRep && row[4] === testVariable;
    });
    
    console.log(`   Found ${filteredRows.length} rows for ${testRep} with ${testVariable}`);
    
    // Get unique product groups
    const productGroups = Array.from(new Set(
      filteredRows.map(row => row[3])
    )).filter(Boolean);
    
    console.log(`   Product groups for ${testRep}:`, productGroups);
    
    // 6. Test period column mapping
    console.log('\n6. Testing period column mapping:');
    const headerRow0 = fpData[0]; // Year row
    const headerRow1 = fpData[1]; // Month row  
    const headerRow2 = fpData[2]; // Type row
    
    console.log('   Year columns (starting from F):', headerRow0.slice(5, 15));
    console.log('   Month columns (starting from F):', headerRow1.slice(5, 15));
    console.log('   Type columns (starting from F):', headerRow2.slice(5, 15));
    
    // Test finding a specific period column
    const testColumn = { year: 2024, month: 'January', type: 'Actual' };
    let foundColumn = -1;
    
    for (let c = 5; c < headerRow0.length; c++) {
      const cellYear = headerRow0[c];
      const cellMonth = headerRow1[c];
      const cellType = headerRow2[c];
      
      if (cellYear == testColumn.year && 
          cellMonth === testColumn.month && 
          cellType === testColumn.type) {
        foundColumn = c;
        break;
      }
    }
    
    console.log(`   Found column for ${testColumn.year} ${testColumn.month} ${testColumn.type} at index:`, foundColumn);
    
    // 7. Test value extraction
    if (foundColumn !== -1 && filteredRows.length > 0) {
      const testRow = filteredRows[0];
      const testValue = testRow[foundColumn];
      console.log(`\n7. Test value extraction:`);
      console.log(`   Row: ${testRow[0]} | ${testRow[3]} | ${testRow[4]}`);
      console.log(`   Value at column ${foundColumn}: ${testValue}`);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Error in test:', error.message);
  }
}

testSalesRepData(); 
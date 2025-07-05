const XLSX = require('xlsx');

function testColumnMapping() {
  try {
    console.log('=== Testing Column Mapping ===\n');
    
    const workbook = XLSX.readFile('data/Sales.xlsx');
    const fpSheet = workbook.Sheets['FP-S&V'];
    const fpData = XLSX.utils.sheet_to_json(fpSheet, { header: 1 });
    
    const headerRow0 = fpData[0]; // Year row
    const headerRow1 = fpData[1]; // Month row  
    const headerRow2 = fpData[2]; // Type row
    
    console.log('Total columns:', headerRow0.length);
    console.log('Data columns (starting from F):', headerRow0.length - 5);
    
    // Find all unique year/month/type combinations
    const periods = [];
    for (let c = 5; c < headerRow0.length; c++) {
      const year = headerRow0[c];
      const month = headerRow1[c];
      const type = headerRow2[c];
      
      if (year && month && type) {
        periods.push({
          columnIndex: c,
          year: year,
          month: month,
          type: type
        });
      }
    }
    
    console.log('\nAvailable periods:');
    periods.forEach((period, index) => {
      console.log(`${index + 1}. Column ${period.columnIndex}: ${period.year} ${period.month} ${period.type}`);
    });
    
    // Test with a period that actually exists
    const testPeriod = periods[0]; // Use first available period
    console.log(`\nTesting with: ${testPeriod.year} ${testPeriod.month} ${testPeriod.type} (column ${testPeriod.columnIndex})`);
    
    // Test data extraction
    const testRep = 'Abraham Mathew';
    const testVariable = 'KGS';
    const dataRows = fpData.slice(3, 103); // First 100 data rows
    
    const filteredRows = dataRows.filter(row => {
      return row[0] === testRep && row[4] === testVariable;
    });
    
    console.log(`Found ${filteredRows.length} rows for ${testRep} with ${testVariable}`);
    
    // Test value extraction for the test period
    let totalValue = 0;
    filteredRows.forEach(row => {
      const value = row[testPeriod.columnIndex];
      if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
        totalValue += parseFloat(value);
        console.log(`  ${row[3]}: ${value}`);
      }
    });
    
    console.log(`Total value for ${testRep} ${testVariable}: ${totalValue}`);
    
    // Test group logic
    console.log('\n=== Testing Group Logic ===');
    const groupMembers = ['Abraham Mathew', 'Adam Ali Khattab'];
    const groupFilteredRows = dataRows.filter(row => {
      return groupMembers.includes(row[0]) && row[4] === testVariable;
    });
    
    console.log(`Found ${groupFilteredRows.length} rows for group members with ${testVariable}`);
    
    let groupTotalValue = 0;
    const groupProductGroups = new Set();
    
    groupFilteredRows.forEach(row => {
      const value = row[testPeriod.columnIndex];
      if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
        groupTotalValue += parseFloat(value);
        groupProductGroups.add(row[3]);
      }
    });
    
    console.log(`Group total value: ${groupTotalValue}`);
    console.log(`Group product groups:`, Array.from(groupProductGroups));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testColumnMapping(); 
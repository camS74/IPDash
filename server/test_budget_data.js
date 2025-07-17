require('dotenv').config();
const fpDataService = require('./database/fpDataService');

async function testBudgetData() {
  console.log('=== Testing Budget Data Retrieval ===');
  
  try {
    // Test 1: Check if we have any budget data at all
    console.log('\n1. Checking for budget data in database...');
    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
    
    const budgetCountQuery = "SELECT COUNT(*) as count FROM fp_data WHERE type = 'Budget' AND values > 0";
    const budgetCount = await pool.query(budgetCountQuery);
    console.log(`Budget records with values > 0: ${budgetCount.rows[0].count}`);
    
    // Test 2: Get a sample budget record
    const sampleBudgetQuery = `
      SELECT salesrepname, productgroup, values_type, year, month, values 
      FROM fp_data 
      WHERE type = 'Budget' AND values > 0 
      LIMIT 5
    `;
    const sampleBudget = await pool.query(sampleBudgetQuery);
    console.log('\n2. Sample budget records:');
    sampleBudget.rows.forEach(row => {
      console.log(`${row.salesrepname} | ${row.productgroup} | ${row.values_type} | ${row.year} | "${row.month}" | ${row.values}`);
    });
    
    // Test 3: Test fpDataService with budget data
    if (sampleBudget.rows.length > 0) {
      const testRecord = sampleBudget.rows[0];
      console.log('\n3. Testing fpDataService with budget data...');
      console.log(`Testing: ${testRecord.salesrepname}, ${testRecord.productgroup}, ${testRecord.values_type}, ${testRecord.year}, ${testRecord.month}`);
      
      const budgetResult = await fpDataService.getSalesDataByValueType(
        testRecord.salesrepname,
        testRecord.productgroup,
        testRecord.values_type,
        testRecord.year,
        testRecord.month.trim(), // Use trimmed month
        'Budget'
      );
      
      const actualResult = await fpDataService.getSalesDataByValueType(
        testRecord.salesrepname,
        testRecord.productgroup,
        testRecord.values_type,
        testRecord.year,
        testRecord.month.trim(),
        'Actual'
      );
      
      console.log(`Budget result: ${budgetResult}`);
      console.log(`Actual result: ${actualResult}`);
      console.log(`Expected budget: ${testRecord.values}`);
    }
    
    // Test 4: Test API endpoint simulation
    console.log('\n4. Testing API endpoint simulation...');
    const testPeriods = [
      { year: 2025, month: '01', type: 'Budget' },
      { year: 2025, month: '01', type: 'Actual' }
    ];
    
    // Get product groups for a sales rep
    const salesReps = await fpDataService.getSalesReps();
    if (salesReps.length > 0) {
      const testSalesRep = salesReps[0];
      console.log(`Testing with sales rep: ${testSalesRep}`);
      
      const productGroups = await fpDataService.getProductGroupsBySalesRep(testSalesRep);
      console.log(`Product groups: ${productGroups.slice(0, 3).join(', ')}...`);
      
      if (productGroups.length > 0) {
        const testProductGroup = productGroups[0];
        
        for (const period of testPeriods) {
          const result = await fpDataService.getSalesDataByValueType(
            testSalesRep,
            testProductGroup,
            'Amount',
            period.year,
            period.month,
            period.type
          );
          console.log(`${testSalesRep} | ${testProductGroup} | Amount | ${period.year}-${period.month}-${period.type}: ${result}`);
        }
      }
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Error testing budget data:', error);
  }
}

testBudgetData();
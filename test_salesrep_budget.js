const fpDataService = require('./server/database/fpDataService');

// Test budget data retrieval for sales rep table
async function testSalesRepBudgetData() {
  console.log('=== Testing Sales Rep Budget Data ===\n');
  
  try {
    // Test 1: Check if getMonthName is working correctly
    console.log('1. Testing getMonthName function:');
    console.log('January:', `'${fpDataService.getMonthName(1)}'`);
    console.log('February:', `'${fpDataService.getMonthName(2)}'`);
    console.log();
    
    // Test 2: Get product groups for a sales rep first
    console.log('2. Getting product groups for Sofiane Salah:');
    const productGroups = await fpDataService.getProductGroupsBySalesRep('Sofiane Salah');
    console.log('Product groups:', productGroups);
    console.log();
    
    // Test 3: Test getSalesDataByValueType with correct parameters
    console.log('3. Testing getSalesDataByValueType with correct parameters:');
    
    if (productGroups.length > 0) {
      const testProductGroup = productGroups[0]; // Use first product group
      console.log(`Testing with product group: ${testProductGroup}`);
      
      const budgetResult = await fpDataService.getSalesDataByValueType(
        'Sofiane Salah',
        testProductGroup,
        'KGS',
        2025,
        1, // January
        'Budget'
      );
      console.log('Budget result:', budgetResult);
      
      const actualResult = await fpDataService.getSalesDataByValueType(
        'Sofiane Salah',
        testProductGroup,
        'KGS',
        2025,
        1, // January
        'Actual'
      );
      console.log('Actual result:', actualResult);
      
      // Test with Amount as well
      const budgetAmountResult = await fpDataService.getSalesDataByValueType(
        'Sofiane Salah',
        testProductGroup,
        'Amount',
        2025,
        1, // January
        'Budget'
      );
      console.log('Budget Amount result:', budgetAmountResult);
      
      const actualAmountResult = await fpDataService.getSalesDataByValueType(
        'Sofiane Salah',
        testProductGroup,
        'Amount',
        2025,
        1, // January
        'Actual'
      );
      console.log('Actual Amount result:', actualAmountResult);
    }
    console.log();
    
    // Test 4: Test with different product groups
    console.log('4. Testing with different product groups:');
    const testGroups = ['Laminates', 'Industrial Items Plain', 'Shrink Film Printed'];
    
    for (const group of testGroups) {
      const budgetKgs = await fpDataService.getSalesDataByValueType(
        'Sofiane Salah',
        group,
        'KGS',
        2025,
        1,
        'Budget'
      );
      const actualKgs = await fpDataService.getSalesDataByValueType(
        'Sofiane Salah',
        group,
        'KGS',
        2025,
        1,
        'Actual'
      );
      console.log(`${group} - Budget: ${budgetKgs}, Actual: ${actualKgs}`);
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testSalesRepBudgetData();
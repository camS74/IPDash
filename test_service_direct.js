const fpDataService = require('./server/database/fpDataService');

async function testServiceDirect() {
  console.log('Testing fpDataService methods directly...');
  
  try {
    // Test getSalesDataByValueType directly
    const result1 = await fpDataService.getSalesDataByValueType(
      'Narek Koroukian', 
      'Shrink Film Printed', 
      'Amount', 
      2024, 
      'January', 
      'Actual'
    );
    console.log('Direct service call result:', result1);
    
    // Test with month number instead of name
    const result2 = await fpDataService.getSalesDataByValueType(
      'Narek Koroukian', 
      'Shrink Film Printed', 
      'Amount', 
      2024, 
      1, 
      'Actual'
    );
    console.log('Service call with month number:', result2);
    
    // Test the getMonthName function behavior
    console.log('\nMonth name conversions:');
    console.log('getMonthName("January"):', fpDataService.getMonthName('January'));
    console.log('getMonthName(1):', fpDataService.getMonthName(1));
    console.log('getMonthName("Q1"):', fpDataService.getMonthName('Q1'));
    
  } catch (error) {
    console.error('Service error:', error);
  }
}

testServiceDirect();
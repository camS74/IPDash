const fpDataService = require('./server/database/fpDataService');

async function testMonthConversion() {
  console.log('Testing month conversion...');
  
  // Test the getMonthName function
  console.log('Month 1:', fpDataService.getMonthName(1));
  console.log('Month "January":', fpDataService.getMonthName('January'));
  console.log('Month "Q1":', fpDataService.getMonthName('Q1'));
  
  // Test direct database query for Amount data
  const { pool } = require('./server/database/config');
  
  try {
    const query = `
      SELECT DISTINCT month, values_type, COUNT(*) as count
      FROM fp_data 
      WHERE salesrepname = 'Narek Koroukian'
      AND values_type = 'Amount'
      AND values > 0
      GROUP BY month, values_type
      ORDER BY month
    `;
    
    const result = await pool.query(query);
    console.log('\nAmount data by month for Narek:');
    result.rows.forEach(row => {
      console.log(`  ${row.month}: ${row.count} records`);
    });
    
    // Test specific query that should match our API call
    const testQuery = `
      SELECT SUM(values) as total_value, month, year
      FROM fp_data 
      WHERE salesrepname = 'Narek Koroukian'
      AND productgroup = 'Shrink Film Printed'
      AND values_type = 'Amount'
      AND year = 2024
      AND month = 'January'
      AND type = 'Actual'
      GROUP BY month, year
    `;
    
    const testResult = await pool.query(testQuery);
    console.log('\nDirect query for Narek, Shrink Film Printed, Amount, 2024, January:');
    console.log(testResult.rows);
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

testMonthConversion();
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '654883',
});

async function cleanMonths() {
  try {
    console.log('🧹 Cleaning month column in fp_data table...');
    
    const client = await pool.connect();
    
    // First, let's see the current state
    console.log('\n📊 Before cleaning - Current month distribution:');
    const beforeResult = await client.query(`
      SELECT month, COUNT(*) as count 
      FROM fp_data 
      WHERE month IS NOT NULL 
      GROUP BY month 
      ORDER BY month
    `);
    
    beforeResult.rows.forEach(row => {
      console.log(`"${row.month}" - ${row.count} records`);
    });
    
    // Update all month values to trim trailing spaces
    console.log('\n🔄 Updating month column to trim trailing spaces...');
    const updateResult = await client.query(`
      UPDATE fp_data 
      SET month = TRIM(month) 
      WHERE month IS NOT NULL
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} records`);
    
    // Check the result after cleaning
    console.log('\n📊 After cleaning - New month distribution:');
    const afterResult = await client.query(`
      SELECT month, COUNT(*) as count 
      FROM fp_data 
      WHERE month IS NOT NULL 
      GROUP BY month 
      ORDER BY month
    `);
    
    afterResult.rows.forEach(row => {
      console.log(`"${row.month}" - ${row.count} records`);
    });
    
    // Get final unique months count
    const uniqueMonthsResult = await client.query(`
      SELECT COUNT(DISTINCT month) as unique_months 
      FROM fp_data 
      WHERE month IS NOT NULL
    `);
    
    console.log(`\n✅ Final result: ${uniqueMonthsResult.rows[0].unique_months} unique months`);
    
    // Show all unique months
    const allMonthsResult = await client.query(`
      SELECT DISTINCT month 
      FROM fp_data 
      WHERE month IS NOT NULL 
      ORDER BY month
    `);
    
    console.log('\n📅 All unique months after cleaning:');
    console.log('=====================================');
    allMonthsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. "${row.month}"`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error cleaning months:', error.message);
  } finally {
    await pool.end();
  }
}

cleanMonths(); 
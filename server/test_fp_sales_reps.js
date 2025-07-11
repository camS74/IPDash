const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '654883',
});

async function getFPSalesReps() {
  try {
    console.log('🔍 Getting unique sales rep names from fp_data table...');
    
    const client = await pool.connect();
    
    // Get unique sales rep names from fp_data table
    const salesRepsResult = await client.query(`
      SELECT DISTINCT salesrepname 
      FROM fp_data 
      WHERE salesrepname IS NOT NULL 
      AND TRIM(salesrepname) != ''
      ORDER BY salesrepname
    `);
    
    console.log('\n👥 Sales Representatives from fp_data:');
    console.log('=====================================');
    salesRepsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. "${row.salesrepname}"`);
    });
    
    console.log(`\n✅ Total unique sales reps: ${salesRepsResult.rows.length}`);
    
    // Get some sample data to verify
    const sampleResult = await client.query(`
      SELECT salesrepname, COUNT(*) as record_count
      FROM fp_data 
      WHERE salesrepname IS NOT NULL 
      GROUP BY salesrepname 
      ORDER BY record_count DESC 
      LIMIT 5
    `);
    
    console.log('\n📊 Top 5 Sales Reps by Record Count:');
    console.log('=====================================');
    sampleResult.rows.forEach(row => {
      console.log(`"${row.salesrepname}" - ${row.record_count} records`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error getting sales reps:', error.message);
  } finally {
    await pool.end();
  }
}

getFPSalesReps(); 
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'IPDashboard',
  user: 'postgres',
  password: '654883',
});

async function checkFPDataTable() {
  try {
    console.log('Testing connection to fp_data table...');
    console.log('Database: IPDashboard');
    console.log('Host: localhost');
    console.log('Port: 5432');
    console.log('User: postgres');
    
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Check if fp_data table exists
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'fp_data'
    `);
    
    if (tableResult.rows.length > 0) {
      console.log('✅ fp_data table exists');
      
      // Check table structure
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'fp_data' 
        ORDER BY ordinal_position
      `);
      
      console.log('\nTable columns:');
      columnsResult.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });
      
      // Check if there's any data
      const countResult = await client.query('SELECT COUNT(*) FROM fp_data');
      console.log(`\nTotal records: ${countResult.rows[0].count}`);
      
      // Show sample data
      const sampleResult = await client.query('SELECT * FROM fp_data LIMIT 3');
      console.log('\nSample data (first 3 rows):');
      sampleResult.rows.forEach((row, index) => {
        console.log(`  Row ${index + 1}:`, row);
      });
      
    } else {
      console.log('❌ fp_data table does not exist');
      
      // List all tables
      const allTablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('\nAvailable tables:');
      allTablesResult.rows.forEach(row => {
        console.log(`  ${row.table_name}`);
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error checking fp_data table:', error.message);
  } finally {
    await pool.end();
  }
}

checkFPDataTable(); 
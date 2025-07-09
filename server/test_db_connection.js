const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'postgres', // Connect to default postgres database first
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Password: ${process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]'}`);
    
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Database connection successful!');
    console.log('PostgreSQL version:', result.rows[0].version);
    client.release();
    
    // Test if IPDashboard database exists
    const dbResult = await pool.query("SELECT 1 FROM pg_database WHERE datname = 'IPDashboard'");
    if (dbResult.rows.length > 0) {
      console.log('✅ IPDashboard database exists');
    } else {
      console.log('❌ IPDashboard database does not exist');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
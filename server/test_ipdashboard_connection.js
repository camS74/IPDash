const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'IPDashboard', // Connect specifically to IPDashboard
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function testConnection() {
  try {
    console.log('Testing connection to IPDashboard database...');
    const client = await pool.connect();
    
    // Test basic connection
    const result = await client.query('SELECT current_database(), version()');
    console.log('✅ Connected successfully!');
    console.log('Database:', result.rows[0].current_database);
    console.log('PostgreSQL Version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // List all databases to confirm IPDashboard exists
    const dbList = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('\n📋 Available databases:');
    dbList.rows.forEach(row => {
      console.log(`  - ${row.datname}`);
    });
    
    // List schemas in IPDashboard
    const schemas = await client.query('SELECT schema_name FROM information_schema.schemata');
    console.log('\n📁 Schemas in IPDashboard:');
    schemas.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });
    
    client.release();
    console.log('\n✅ IPDashboard database is ready for use!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.code === '3D000') {
      console.log('\n💡 The IPDashboard database does not exist yet.');
      console.log('   Please create it first using: CREATE DATABASE "IPDashboard";');
    }
  } finally {
    await pool.end();
  }
}

testConnection();
const fpDataService = require('./server/database/fpDataService');
const { pool } = require('./server/database/config');

async function debugBudgetQuery() {
  console.log('=== Debugging Budget Query ===\n');
  
  try {
    // Check what types exist in the database
    console.log('1. Checking all unique types in fp_data:');
    const typesResult = await pool.query('SELECT DISTINCT type FROM fp_data ORDER BY type');
    console.log('Types found:', typesResult.rows.map(r => `'${r.type}'`));
    console.log();
    
    // Check budget records for Sofiane Salah
    console.log('2. Checking budget records for Sofiane Salah:');
    const budgetQuery = `
      SELECT salesrepname, productgroup, values_type, year, month, type, values 
      FROM fp_data 
      WHERE salesrepname = 'Sofiane Salah' 
      AND type LIKE '%Budget%'
      LIMIT 10
    `;
    const budgetResult = await pool.query(budgetQuery);
    console.log('Budget records found:', budgetResult.rows.length);
    budgetResult.rows.forEach(row => {
      console.log(`  ${row.salesrepname} | ${row.productgroup} | ${row.values_type} | ${row.year} | '${row.month}' | '${row.type}' | ${row.values}`);
    });
    console.log();
    
    // Check what months exist for budget data
    console.log('3. Checking months for budget data:');
    const monthsQuery = `
      SELECT DISTINCT month 
      FROM fp_data 
      WHERE type LIKE '%Budget%' 
      AND salesrepname = 'Sofiane Salah'
      ORDER BY month
    `;
    const monthsResult = await pool.query(monthsQuery);
    console.log('Months with budget data:', monthsResult.rows.map(r => `'${r.month}'`));
    console.log();
    
    // Test the exact query that getSalesDataByValueType uses
    console.log('4. Testing exact query from getSalesDataByValueType:');
    const testQuery = `
      SELECT SUM(values) as total_value 
      FROM fp_data 
      WHERE salesrepname = $1 
      AND productgroup = $2 
      AND values_type = $3
      AND year = $4
      AND month = $5
      AND type = $6
    `;
    
    const params = ['Sofiane Salah', 'Laminates', 'KGS', 2025, 'January  ', 'Budget'];
    console.log('Query parameters:', params);
    const testResult = await pool.query(testQuery, params);
    console.log('Query result:', testResult.rows[0]);
    console.log();
    
    // Try with different type variations
    console.log('5. Testing different type variations:');
    const typeVariations = ['Budget', 'budget', 'BUDGET', 'Budget ', ' Budget'];
    
    for (const typeVar of typeVariations) {
      const result = await pool.query(testQuery, ['Sofiane Salah', 'Laminates', 'KGS', 2025, 'January  ', typeVar]);
      console.log(`Type '${typeVar}': ${result.rows[0]?.total_value || 0}`);
    }
    
  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

debugBudgetQuery();
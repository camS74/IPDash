const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('=== Testing Sales Rep API ===\n');
    
    // Test the sales reps defaults endpoint
    const response = await fetch('http://localhost:3001/api/sales-reps-defaults?division=FP');
    const data = await response.json();
    
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ API is working!');
      console.log('Sales reps found:', data.defaults?.length || 0);
      console.log('Groups found:', Object.keys(data.groups || {}).length);
    } else {
      console.log('\n❌ API returned error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Wait a bit for server to start, then test
setTimeout(testAPI, 3000); 
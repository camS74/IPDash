async function testAmountAPI() {
  try {
    console.log('Testing Amount API call...');
    
    const response = await fetch('http://localhost:3001/api/fp/sales-rep-dashboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        salesRep: 'Narek Koroukian',
        valueTypes: ['Amount'],
        periods: [
          { year: 2024, month: 'January', type: 'Actual' },
          { year: 2023, month: 'January', type: 'Actual' },
          { year: 2025, month: 'Q1', type: 'Actual' }
        ]
      })
    });
    
    console.log('\n=== API RESPONSE ===');
    console.log('Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Full response structure:', JSON.stringify(data, null, 2));
    
    if (data.productGroups) {
      console.log('Product Groups:', data.productGroups);
    }
    
    if (data.dashboardData) {
      console.log('Dashboard Data Keys:', Object.keys(data.dashboardData));
      
      // Check first product group data
      const firstPG = Object.keys(data.dashboardData)[0];
      if (firstPG) {
        console.log(`\n=== ${firstPG} DATA ===`);
        console.log('Available variables:', Object.keys(data.dashboardData[firstPG]));
        
        if (data.dashboardData[firstPG].Amount) {
          console.log('Amount keys:', Object.keys(data.dashboardData[firstPG].Amount));
          console.log('Sample Amount values:', Object.entries(data.dashboardData[firstPG].Amount).slice(0, 5));
        } else {
          console.log('NO AMOUNT DATA FOUND!');
        }
      }
    }
    
  } catch (error) {
    console.error('API Error:', error.message);
    console.error('Error details:', error);
  }
}

testAmountAPI();
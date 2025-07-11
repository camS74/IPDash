// Test script to verify total calculation logic

// Mock data structure similar to what the component receives
const mockData = [
  {
    name: 'Shrink Film Printed',
    values: ['1,290,987', '▲ 15.2%', '1,509,666'],
    rawValues: [1290987, 1509666]
  },
  {
    name: 'Shrink Sleeves',
    values: ['7,459', '▼ 8.3%', '8,123'],
    rawValues: [7459, 8123]
  },
  {
    name: 'Wide Film',
    values: ['0', '0.0%', '0'],
    rawValues: [0, 0]
  }
];

// Mock extendedColumns
const extendedColumns = [
  { columnType: 'data', year: 2024, month: 'January', type: 'Actual' },
  { columnType: 'delta' },
  { columnType: 'data', year: 2023, month: 'January', type: 'Actual' }
];

// Test calculateColumnTotal function
const calculateColumnTotal = (data, columnIndex) => {
  console.log('calculateColumnTotal called with:', { dataLength: data.length, columnIndex });
  console.log('Sample data structure:', data[0]);
  
  // Map columnIndex to rawValues index (skip delta columns)
  const extendedColumnsForData = extendedColumns.filter(col => col.columnType === 'data');
  const dataColumnIndex = extendedColumns.slice(0, columnIndex).filter(col => col.columnType === 'data').length;
  
  console.log('Data column index:', dataColumnIndex, 'Total data columns:', extendedColumnsForData.length);
  
  return data.reduce((total, productGroup) => {
    if (!productGroup.rawValues || dataColumnIndex >= productGroup.rawValues.length) {
      console.log(`Product: ${productGroup.name}, No raw value at index ${dataColumnIndex}`);
      return total;
    }
    
    const rawValue = productGroup.rawValues[dataColumnIndex];
    console.log(`Product: ${productGroup.name}, Raw Value at ${dataColumnIndex}:`, rawValue, typeof rawValue);
    
    if (typeof rawValue === 'number' && !isNaN(rawValue)) {
      return total + rawValue;
    }
    return total;
  }, 0);
};

// Test the function
console.log('\n=== Testing Column 0 (2024 January) ===');
const total0 = calculateColumnTotal(mockData, 0);
console.log('Total for column 0:', total0);
console.log('Expected: 1298446 (1290987 + 7459 + 0)');

console.log('\n=== Testing Column 2 (2023 January) ===');
const total2 = calculateColumnTotal(mockData, 2);
console.log('Total for column 2:', total2);
console.log('Expected: 1517789 (1509666 + 8123 + 0)');

// Test delta calculation
const calculateTotalDelta = (data, fromIndex, toIndex) => {
  const fromTotal = calculateColumnTotal(data, fromIndex);
  const toTotal = calculateColumnTotal(data, toIndex);
  
  console.log('Delta calculation:', { fromTotal, toTotal, fromIndex, toIndex });
  
  if (fromTotal === 0) return { arrow: '', value: '', color: '#666' };
  
  const delta = ((toTotal - fromTotal) / fromTotal) * 100;
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '';
  const color = delta > 0 ? '#0066FF' : delta < 0 ? '#FF0000' : '#666';
  
  // Format delta based on range: -99.99% to +99.9% should have decimals, outside should not
  const absDelta = Math.abs(delta);
  let formattedValue;
  
  if (absDelta >= 99.99) {
    // Outside range: no decimals
    formattedValue = Math.round(absDelta) + '%';
  } else {
    // Within range: with decimals
    formattedValue = absDelta.toFixed(1) + '%';
  }
  
  return { arrow, value: formattedValue, color };
};

console.log('\n=== Testing Delta Calculation (from column 0 to column 2) ===');
const deltaResult = calculateTotalDelta(mockData, 0, 2);
console.log('Delta result:', deltaResult);
console.log('Expected: positive delta since 2023 > 2024');
// Fixed column styling functions with proper error handling

// Function to get column style based on the column configuration
const getColumnHeaderStyle = (column) => {
  // Ensure column is defined
  if (!column) {
    return { 
      backgroundColor: '#288cfa', 
      color: '#FFFFFF',
      fontWeight: 'bold'
    };
  }
  
  // Check if column has customColor property safely
  if (column.customColor) {
    const scheme = colorSchemes.find(s => s.name === column.customColor);
    if (scheme) {
      return { 
        backgroundColor: scheme.primary,
        color: scheme.isDark ? '#FFFFFF' : '#000000',
        fontWeight: 'bold'
      };
    }
  }
  
  // Default color assignment based on month/type
  if (column.month === 'Q1' || column.month === 'Q2' || column.month === 'Q3' || column.month === 'Q4') {
    return {
      backgroundColor: '#FF9800', // Orange
      color: '#000000',
      fontWeight: 'bold'
    };
  } else if (column.month === 'January') {
    return {
      backgroundColor: '#FFEA00', // Yellow
      color: '#000000',
      fontWeight: 'bold'
    };
  } else if (column.month === 'Year') {
    return {
      backgroundColor: '#288cfa', // Blue
      color: '#FFFFFF',
      fontWeight: 'bold'
    };
  } else if (column.type === 'Budget') {
    return {
      backgroundColor: '#2E865F', // Green
      color: '#FFFFFF',
      fontWeight: 'bold'
    };
  }
  
  // Default to blue
  return { 
    backgroundColor: '#288cfa', 
    color: '#FFFFFF',
    fontWeight: 'bold'
  };
};

// Function to get cell background color based on column configuration
const getCellBackgroundColor = (column) => {
  // Ensure column is defined
  if (!column) {
    return '#E6F2FF'; // Default light blue
  }
  
  // Check if column has customColor property safely
  if (column.customColor) {
    const scheme = colorSchemes.find(s => s.name === column.customColor);
    if (scheme) {
      return scheme.light;
    }
  }
  
  // Default color assignment based on month/type
  if (column.month === 'Q1' || column.month === 'Q2' || column.month === 'Q3' || column.month === 'Q4') {
    return '#FFF3E0'; // Light orange
  } else if (column.month === 'January') {
    return '#FFFDE7'; // Light yellow
  } else if (column.month === 'Year') {
    return '#E6F2FF'; // Light blue
  } else if (column.type === 'Budget') {
    return '#E6F5EF'; // Light green
  }
  
  // Default to light blue
  return '#E6F2FF';
};

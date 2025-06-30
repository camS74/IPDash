import React, { createContext, useState, useContext, useEffect } from 'react';
import { useExcelData } from './ExcelDataContext';

const FilterContext = createContext();

export const useFilter = () => useContext(FilterContext);

export const FilterProvider = ({ children }) => {
  const { excelData, selectedDivision } = useExcelData();
  
  // Filter states
  const [availableFilters, setAvailableFilters] = useState({
    years: [],
    months: [],
    types: []
  });
  
  // Column order state - explicitly added by user
  const [columnOrder, setColumnOrder] = useState([]);
  
  // Chart visible columns - track which columns are visible in charts
  const [chartVisibleColumns, setChartVisibleColumns] = useState([]);
  
  // Base period index state
  const [basePeriodIndex, setBasePeriodIndex] = useState(null);
  
  // State to track if data has been generated
  const [dataGenerated, setDataGenerated] = useState(false);
  
  // Column selection state for styling/highlighting
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(null);
  
  // Full year and quarters mapping for aggregation
  const fullYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const quarters = {
    'Q1': ['January', 'February', 'March'],
    'Q2': ['April', 'May', 'June'],
    'Q3': ['July', 'August', 'September'],
    'Q4': ['October', 'November', 'December']
  };
  const halfYears = {
    'HY1': ['January', 'February', 'March', 'April', 'May', 'June'],
    'HY2': ['July', 'August', 'September', 'October', 'November', 'December']
  };
  
  // Helper function to check if months are sequential
  const areMonthsSequential = (months) => {
    if (months.length <= 1) return true;
    
    const monthIndices = months.map(month => fullYear.indexOf(month)).sort((a, b) => a - b);
    
    for (let i = 1; i < monthIndices.length; i++) {
      if (monthIndices[i] !== monthIndices[i - 1] + 1) {
        return false;
      }
    }
    return true;
  };

  // Helper function to format month range display
  const formatMonthRange = (months) => {
    if (months.length === 1) {
      return months[0];
    } else if (months.length > 1) {
      const firstMonth = months[0].substring(0, 3); // Jan, Feb, etc.
      const lastMonth = months[months.length - 1].substring(0, 3);
      return `${firstMonth}-${lastMonth}`;
    }
    return '';
  };

  // Function to create custom month range
  const createCustomRange = (year, selectedMonths, type) => {
    // Sort months by their order in the year
    const sortedMonths = selectedMonths.sort((a, b) => 
      fullYear.indexOf(a) - fullYear.indexOf(b)
    );

    // Validate sequential requirement
    if (!areMonthsSequential(sortedMonths)) {
      return { success: false, error: 'Selected months must be sequential (consecutive).' };
    }

    // Create display name and ID
    const displayName = formatMonthRange(sortedMonths);
    const rangeId = `CUSTOM_${sortedMonths.join('_')}`;
    
    const newColumn = {
      year,
      month: rangeId, // Use unique ID for custom ranges
      type,
      months: sortedMonths,
      displayName, // Add display name for UI
      isCustomRange: true,
      id: `${year}-${rangeId}-${type}`
    };

    return { success: true, column: newColumn };
  };
  
  // Extract filter options from the Excel data
  useEffect(() => {
    if (excelData && selectedDivision && excelData[selectedDivision]) {
      const sheet = excelData[selectedDivision];
      
      // Check if sheet has enough rows and columns
      if (sheet.length >= 3 && sheet[0].length > 1) {
        // Extract years from row 1 (index 0)
        const years = [...new Set(sheet[0].slice(1).filter(Boolean))];
        
        // Extract months from row 2 (index 1)
        const months = [...new Set(sheet[1].slice(1).filter(Boolean))];
        const extendedMonths = ["Year", "HY1", "HY2", "Q1", "Q2", "Q3", "Q4", ...months];
        
        // Extract data types from row 3 (index 2)
        const types = [...new Set(sheet[2].slice(1).filter(Boolean))];
        
        setAvailableFilters({ years, months: extendedMonths, types });
      }
    }
  }, [excelData, selectedDivision]);
  
  // Maximum number of columns allowed
  const MAX_COLUMNS = 5;
  
  // Function to add a column
  const addColumn = (year, month, type, customMonths = null) => {
    // Check if we've already reached the maximum number of columns
    if (columnOrder.length >= MAX_COLUMNS) {
      console.warn(`Maximum number of columns (${MAX_COLUMNS}) reached`);
      return { success: false, error: `Maximum limit of ${MAX_COLUMNS} columns reached.` };
    }

    let newColumn;

    // Handle custom month ranges
    if (customMonths && Array.isArray(customMonths) && customMonths.length > 0) {
      const customResult = createCustomRange(year, customMonths, type);
      if (!customResult.success) {
        return customResult; // Return error from createCustomRange
      }
      newColumn = customResult.column;
    } else {
      // Handle regular periods (existing logic)
      let actualMonths = [];
      if (month === 'Year') actualMonths = fullYear;
      else if (quarters[month]) actualMonths = quarters[month];
      else if (halfYears[month]) actualMonths = halfYears[month];
      else actualMonths = [month];
      
      newColumn = { 
        year, 
        month, 
        type, 
        months: actualMonths,
        id: `${year}-${month}-${type}`
      };
    }

    // Check if this column already exists to avoid duplicates
    const exists = columnOrder.some(col => col.id === newColumn.id);
    
    if (!exists) {
      setColumnOrder(prev => [...prev, newColumn]);
      return { success: true };
    }
    
    return { success: false, error: 'This column combination already exists.' };
  };
  
  // Function to update column order
  const updateColumnOrder = (newOrder) => {
    setColumnOrder(newOrder);
  };
  
  // Function to remove a column
  const removeColumn = (columnId) => {
    setColumnOrder(prev => prev.filter(col => col.id !== columnId));
  };
  
  // Function to clear all columns
  const clearAllColumns = () => {
    setColumnOrder([]);
    setDataGenerated(false);
  };
  
  // Function to generate data based on selected columns
  const generateData = () => {
    if (columnOrder.length > 0) {
      setDataGenerated(true);
      return true;
    }
    return false;
  };

  // Function to save current selection as standard
  const saveAsStandardSelection = async () => {
    if (columnOrder.length > 0) {
      try {
        const response = await fetch('http://localhost:3001/api/standard-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'standardColumnSelection',
            data: columnOrder
          })
        });
        
        if (response.ok) {
          // console.log('Standard configuration saved to backend');
          return true;
        } else {
          console.error('Failed to save standard configuration to backend');
          return false;
        }
      } catch (error) {
        console.error('Error saving standard configuration:', error);
        return false;
      }
    }
    return false;
  };

  // Function to clear standard selection
  const clearStandardSelection = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/standard-config/standardColumnSelection', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // console.log('Standard configuration cleared from backend');
        return true;
      } else {
        console.error('Failed to clear standard configuration from backend');
        return false;
      }
    } catch (error) {
      console.error('Error clearing standard configuration:', error);
      return false;
    }
  };

  // Function to set base period
  const setBasePeriod = async (index) => {
    setBasePeriodIndex(index);
    try {
      await fetch('http://localhost:3001/api/standard-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'basePeriodIndex',
          data: index
        })
      });
      // console.log('Base period saved to backend');
    } catch (error) {
      console.error('Failed to save base period to backend:', error);
    }
  };

  // Function to clear base period
  const clearBasePeriod = async () => {
    setBasePeriodIndex(null);
    try {
      await fetch('http://localhost:3001/api/standard-config/basePeriodIndex', {
        method: 'DELETE'
      });
      // console.log('Base period cleared from backend');
    } catch (error) {
      console.error('Failed to clear base period from backend:', error);
    }
  };

  // Toggle visibility of a column in charts
  const toggleChartColumnVisibility = (columnId) => {
    setChartVisibleColumns(prev => {
      const newVisibility = prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)  // Remove if present (hide)
        : [...prev, columnId];                // Add if not present (show)
      
      // Save to backend immediately
      saveChartVisibilityToBackend(newVisibility);
      return newVisibility;
    });
  };
  
  // Check if a column is visible in charts
  const isColumnVisibleInChart = (columnId) => {
    return chartVisibleColumns.includes(columnId);
  };

  // Alias for backward compatibility
  const setSelectedColumn = setSelectedColumnIndex;

  // Load standard configuration from backend on component mount
  useEffect(() => {
    const loadStandardConfig = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/standard-config/standardColumnSelection');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setColumnOrder(result.data);
            // console.log('Loaded standard configuration from backend');
          }
        }
      } catch (error) {
        console.warn('Failed to load standard configuration from backend:', error);
      }
    };

    const loadChartVisibility = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/standard-config/chartVisibleColumns');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setChartVisibleColumns(result.data);
            // console.log('Loaded chart visibility from backend');
          }
        }
      } catch (error) {
        console.warn('Failed to load chart visibility from backend:', error);
      }
    };

    const loadBasePeriod = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/standard-config/basePeriodIndex');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data !== null) {
            setBasePeriodIndex(result.data);
            // console.log('Loaded base period from backend');
          }
        }
      } catch (error) {
        console.warn('Failed to load base period from backend:', error);
      }
    };

    loadStandardConfig();
    loadChartVisibility();
    loadBasePeriod();
  }, []);
  
  // Update chart visibility when columnOrder changes
  useEffect(() => {
    // Make sure all columns have a visibility setting
    setChartVisibleColumns(prev => {
      // Find any columns that aren't in the visibility list yet
      const newColumns = columnOrder.filter(col => !prev.includes(col.id));
      
      // If there are any new columns, add them to the visibility list
      if (newColumns.length > 0) {
        const updatedVisibility = [...prev, ...newColumns.map(col => col.id)];
        // Save to backend immediately
        saveChartVisibilityToBackend(updatedVisibility);
        return updatedVisibility;
      }
      
      // If all columns already have visibility settings, just return the current list
      // But filter out any columns that no longer exist
      const filtered = prev.filter(id => columnOrder.some(col => col.id === id));
      if (filtered.length !== prev.length) {
        // Save the filtered list if it changed
        saveChartVisibilityToBackend(filtered);
      }
      return filtered;
    });
  }, [columnOrder]);

  // Helper function to save chart visibility to backend
  const saveChartVisibilityToBackend = async (visibility) => {
    try {
      await fetch('http://localhost:3001/api/standard-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'chartVisibleColumns',
          data: visibility
        })
      });
    } catch (error) {
      console.error('Failed to save chart visibility to backend:', error);
    }
  };

  // Values to expose in the context
  const value = {
    availableFilters,
    columnOrder,
    updateColumnOrder,
    addColumn,
    removeColumn,
    clearAllColumns,
    generateData,
    dataGenerated,
    fullYear,
    quarters,
    saveAsStandardSelection,
    clearStandardSelection,
    basePeriodIndex,
    setBasePeriod,
    clearBasePeriod,
    chartVisibleColumns,
    toggleChartColumnVisibility,
    isColumnVisibleInChart,
    // New multi-month range functions
    areMonthsSequential,
    formatMonthRange,
    createCustomRange,
    selectedColumnIndex,
    setSelectedColumnIndex,
    setSelectedColumn
  };
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}; 
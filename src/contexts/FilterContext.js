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
  const [columnOrder, setColumnOrder] = useState(() => {
    // Try to load standard selection from localStorage on initial load
    const savedStandard = localStorage.getItem('standardColumnSelection');
    return savedStandard ? JSON.parse(savedStandard) : [];
  });
  
  // Chart visible columns - track which columns are visible in charts
  const [chartVisibleColumns, setChartVisibleColumns] = useState(() => {
    // By default, all columns are visible
    const savedVisibility = localStorage.getItem('chartVisibleColumns');
    return savedVisibility ? JSON.parse(savedVisibility) : [];
  });
  
  // Update chart visibility when columnOrder changes
  useEffect(() => {
    // Make sure all columns have a visibility setting
    setChartVisibleColumns(prev => {
      // Find any columns that aren't in the visibility list yet
      const newColumns = columnOrder.filter(col => !prev.includes(col.id));
      
      // If there are any new columns, add them to the visibility list
      if (newColumns.length > 0) {
        const updatedVisibility = [...prev, ...newColumns.map(col => col.id)];
        // Save to localStorage immediately
        localStorage.setItem('chartVisibleColumns', JSON.stringify(updatedVisibility));
        return updatedVisibility;
      }
      
      // If all columns already have visibility settings, just return the current list
      // But filter out any columns that no longer exist
      const filtered = prev.filter(id => columnOrder.some(col => col.id === id));
      if (filtered.length !== prev.length) {
        // Save the filtered list if it changed
        localStorage.setItem('chartVisibleColumns', JSON.stringify(filtered));
      }
      return filtered;
    });
  }, [columnOrder]);
  
  // Base period index state
  const [basePeriodIndex, setBasePeriodIndex] = useState(() => {
    const savedBase = localStorage.getItem('basePeriodIndex');
    return savedBase !== null ? JSON.parse(savedBase) : null;
  });
  
  // State to track if data has been generated
  const [dataGenerated, setDataGenerated] = useState(false);
  
  // Full year and quarters mapping for aggregation
  const fullYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const quarters = {
    'Q1': ['January', 'February', 'March'],
    'Q2': ['April', 'May', 'June'],
    'Q3': ['July', 'August', 'September'],
    'Q4': ['October', 'November', 'December']
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
        const extendedMonths = ["Year", "Q1", "Q2", "Q3", "Q4", ...months];
        
        // Extract data types from row 3 (index 2)
        const types = [...new Set(sheet[2].slice(1).filter(Boolean))];
        
        setAvailableFilters({ years, months: extendedMonths, types });
      }
    }
  }, [excelData, selectedDivision]);
  
  // Maximum number of columns allowed
  const MAX_COLUMNS = 5;
  
  // Function to add a column
  const addColumn = (year, month, type) => {
    // Check if we've already reached the maximum number of columns
    if (columnOrder.length >= MAX_COLUMNS) {
      console.warn(`Maximum number of columns (${MAX_COLUMNS}) reached`);
      return false; // Return false to indicate failure
    }
    
    // Determine actual months based on period selection
    let actualMonths = [];
    if (month === 'Year') actualMonths = fullYear;
    else if (quarters[month]) actualMonths = quarters[month];
    else actualMonths = [month];
    
    const newColumn = { 
      year, 
      month, 
      type, 
      months: actualMonths,
      id: `${year}-${month}-${type}`
    };
    
    // Check if this column already exists to avoid duplicates
    const exists = columnOrder.some(col => col.id === newColumn.id);
    
    if (!exists) {
      setColumnOrder(prev => [...prev, newColumn]);
      return true; // Return true to indicate success
    }
    
    return false; // Return false if column already exists
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
  const saveAsStandardSelection = () => {
    if (columnOrder.length > 0) {
      localStorage.setItem('standardColumnSelection', JSON.stringify(columnOrder));
      return true;
    }
    return false;
  };

  // Function to clear standard selection
  const clearStandardSelection = () => {
    localStorage.removeItem('standardColumnSelection');
    return true;
  };

  // Function to set base period
  const setBasePeriod = (index) => {
    setBasePeriodIndex(index);
    localStorage.setItem('basePeriodIndex', JSON.stringify(index));
  };

  // Function to clear base period
  const clearBasePeriod = () => {
    setBasePeriodIndex(null);
    localStorage.removeItem('basePeriodIndex');
  };

  // Toggle visibility of a column in charts
  const toggleChartColumnVisibility = (columnId) => {
    setChartVisibleColumns(prev => {
      const newVisibility = prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)  // Remove if present (hide)
        : [...prev, columnId];                // Add if not present (show)
      
      // Save to localStorage
      localStorage.setItem('chartVisibleColumns', JSON.stringify(newVisibility));
      return newVisibility;
    });
  };
  
  // Check if a column is visible in charts
  const isColumnVisibleInChart = (columnId) => {
    return chartVisibleColumns.includes(columnId);
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
    isColumnVisibleInChart
  };
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}; 
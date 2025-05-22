import React, { createContext, useState, useContext, useEffect } from 'react';
import { useExcelData } from './ExcelDataContext';

// Defines the maximum number of columns a user can select.
// Currently set to 5 as a sensible default to prevent overly wide tables/charts
// and potential performance issues with data processing and display.
// This value can be adjusted if different limits are required.
const MAX_COLUMNS = 5;

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
    // Try to load standard column selection from localStorage on initial load (user preference)
    const savedStandard = localStorage.getItem('standardColumnSelection');
    return savedStandard ? JSON.parse(savedStandard) : [];
  });
  
  // Chart visible columns - track which columns are visible in charts
  const [chartVisibleColumns, setChartVisibleColumns] = useState(() => {
    // Try to load chart column visibility from localStorage on initial load (user preference)
    // By default, all columns are visible if no preference is saved.
    const savedVisibility = localStorage.getItem('chartVisibleColumns');
    return savedVisibility ? JSON.parse(savedVisibility) : [];
  });
  
  // useEffect hook to synchronize chartVisibleColumns with columnOrder.
  // Its purpose is to ensure that:
  // 1. New columns added to columnOrder are automatically made visible in charts by default.
  // 2. Columns removed from columnOrder are also removed from chartVisibleColumns.
  useEffect(() => {
    setChartVisibleColumns(prev => {
      // Identify columns present in columnOrder but not in chartVisibleColumns (newly added columns).
      const newColumns = columnOrder.filter(col => !prev.includes(col.id));
      
      let madeChanges = false;
      let updatedVisibility = [...prev];

      // If there are new columns, add them to the visibility list.
      if (newColumns.length > 0) {
        updatedVisibility = [...updatedVisibility, ...newColumns.map(col => col.id)];
        madeChanges = true;
      }
      
      // Filter out any column IDs in chartVisibleColumns that are no longer present in columnOrder (deleted columns).
      const filteredVisibility = updatedVisibility.filter(id => columnOrder.some(col => col.id === id));
      if (filteredVisibility.length !== updatedVisibility.length) {
        updatedVisibility = filteredVisibility;
        madeChanges = true;
      }

      // If any changes were made (new columns added or old ones removed), save the updated list to localStorage.
      if (madeChanges) {
        // Save updated chart column visibility to localStorage (user preference)
        localStorage.setItem('chartVisibleColumns', JSON.stringify(updatedVisibility));
      }
      return updatedVisibility;
    });
  }, [columnOrder]);
  
  // Base period index state
  const [basePeriodIndex, setBasePeriodIndex] = useState(() => {
    // Try to load the base period index from localStorage on initial load (user preference)
    const savedBase = localStorage.getItem('basePeriodIndex');
    return savedBase !== null ? JSON.parse(savedBase) : null;
  });
  
  // State to track if data has been generated
  const [dataGenerated, setDataGenerated] = useState(false);
  
  // fullYear: An array of all months, used for 'Year' aggregation.
  // quarters: An object mapping quarter names (Q1-Q4) to their respective months.
  // These constants are used in `addColumn` to determine the actual months included in a column
  // when "Year" or a quarter is selected as the period.
  const fullYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const quarters = {
    'Q1': ['January', 'February', 'March'],
    'Q2': ['April', 'May', 'June'],
    'Q3': ['July', 'August', 'September'],
    'Q4': ['October', 'November', 'December']
  };
  
  // useEffect hook to extract and set available filter options (years, months, types)
  // from the excelData when it or the selectedDivision changes.
  useEffect(() => {
    if (excelData && selectedDivision && excelData[selectedDivision]) {
      const sheet = excelData[selectedDivision]; // Get the data for the currently selected division.
      
      // Ensure the sheet has the expected structure (at least 3 rows and more than 1 column).
      // Row 0: Years, Row 1: Months, Row 2: Data Types.
      if (sheet.length >= 3 && sheet[0].length > 1) {
        // Extract unique years from the first row (sheet[0]), skipping the header cell (index 0).
        // Filter(Boolean) removes any empty or null values.
        const years = [...new Set(sheet[0].slice(1).filter(Boolean))];
        
        // Extract unique months from the second row (sheet[1]), skipping the header cell.
        const months = [...new Set(sheet[1].slice(1).filter(Boolean))];
        // Create an extended list of months including "Year", "Q1", "Q2", "Q3", "Q4" for aggregation options.
        const extendedMonths = ["Year", "Q1", "Q2", "Q3", "Q4", ...months];
        
        // Extract unique data types from the third row (sheet[2]), skipping the header cell.
        const types = [...new Set(sheet[2].slice(1).filter(Boolean))];
        
        // Update the state with the extracted filter options.
        setAvailableFilters({ years, months: extendedMonths, types });
      }
    }
  }, [excelData, selectedDivision]);
  
  // Function to add a new column to the columnOrder state.
  const addColumn = (year, month, type) => {
    // Check if the current number of columns has reached the defined maximum.
    // If so, log a warning and return false (column not added).
    if (columnOrder.length >= MAX_COLUMNS) {
      console.warn(`Maximum number of columns (${MAX_COLUMNS}) reached`);
      return false; // Indicate failure: maximum columns reached.
    }
    
    // Determine the 'actualMonths' array based on the selected 'month' (period).
    // If 'month' is "Year", actualMonths will be all months in 'fullYear'.
    // If 'month' is a quarter (e.g., "Q1"), actualMonths will be the months in that quarter.
    // Otherwise, actualMonths will be an array containing just the selected 'month'.
    let actualMonths = [];
    if (month === 'Year') actualMonths = fullYear;
    else if (quarters[month]) actualMonths = quarters[month];
    else actualMonths = [month];
    
    // Create the new column object with its properties.
    // 'id' is a unique identifier for the column.
    // 'months' stores the resolved list of actual months for data processing.
    const newColumn = { 
      year, 
      month, // This is the selected period (e.g., "January", "Q1", "Year")
      type, 
      months: actualMonths, // These are the specific months for data aggregation
      id: `${year}-${month}-${type}`
    };
    
    // Check if a column with the same 'id' already exists in columnOrder to prevent duplicates.
    const exists = columnOrder.some(col => col.id === newColumn.id);
    
    // If the column does not exist, add it to the columnOrder state.
    if (!exists) {
      setColumnOrder(prev => [...prev, newColumn]);
      return true; // Indicate success: column added.
    }
    
    return false; // Indicate failure: column already exists.
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
      // Save current column order to localStorage as standard selection (user preference)
      localStorage.setItem('standardColumnSelection', JSON.stringify(columnOrder));
      return true;
    }
    return false;
  };

  // Function to clear standard selection
  const clearStandardSelection = () => {
    // Clear standard column selection from localStorage (user preference)
    localStorage.removeItem('standardColumnSelection');
    return true;
  };

  // Function to set base period
  const setBasePeriod = (index) => {
    setBasePeriodIndex(index);
    // Save selected base period index to localStorage (user preference)
    localStorage.setItem('basePeriodIndex', JSON.stringify(index));
  };

  // Function to clear base period
  const clearBasePeriod = () => {
    setBasePeriodIndex(null);
    // Clear base period index from localStorage (user preference)
    localStorage.removeItem('basePeriodIndex');
  };

  // Toggle visibility of a column in charts
  const toggleChartColumnVisibility = (columnId) => {
    setChartVisibleColumns(prev => {
      const newVisibility = prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)  // Remove if present (hide)
        : [...prev, columnId];                // Add if not present (show)
      
      // Save updated chart column visibility to localStorage (user preference)
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
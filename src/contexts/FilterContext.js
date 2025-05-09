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
    quarters
  };
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}; 
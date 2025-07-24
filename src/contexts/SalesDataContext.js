import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getUniqueProductGroups } from './getUniqueProductGroups';

const SalesDataContext = createContext();

export const useSalesData = () => {
  const context = useContext(SalesDataContext);
  if (!context) {
    throw new Error('useSalesData must be used within a SalesDataProvider');
  }
  return context;
};

export const SalesDataProvider = ({ children }) => {
  const [salesData, setSalesData] = useState({});
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('FP-Product Group'); // Default to FP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Sales rep configuration state
  const [defaultReps, setDefaultReps] = useState([]);
  const [salesRepGroups, setSalesRepGroups] = useState({});
  const [salesRepConfigLoaded, setSalesRepConfigLoaded] = useState(false);
  const [configLoadedForDivision, setConfigLoadedForDivision] = useState(null); // Track which division config is loaded for
  
  // Function to load Sales Excel file from API endpoint
  const loadSalesData = useCallback(async (url = '/api/sales.xlsx') => {
    if (loading || dataLoaded) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const buffer = await res.arrayBuffer();
      
      if (buffer.byteLength === 0) {
        throw new Error('Received empty sales file');
      }
      
      // Parse Excel data using xlsx library
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No sheets found in Sales Excel file');
      }
      
      // Get all sheet names (divisions)
      const sheetNames = workbook.SheetNames;
      setDivisions(sheetNames);
      
      // Convert sheets to JSON
      const parsedData = {};
      sheetNames.forEach(name => {
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
        if (!sheetData || sheetData.length === 0) {
          // Empty sheet - continue
        }
        parsedData[name] = sheetData;
      });
      
      setSalesData(parsedData);
      setDataLoaded(true);
      
      // Set default selected division if none is selected
      if (!selectedDivision && sheetNames.length > 0) {
        setSelectedDivision(sheetNames[0]);
      }
      
      return parsedData;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [loading, dataLoaded, selectedDivision]);

  // Function to load sales rep configuration
  const loadSalesRepConfig = useCallback(async (forceReload = false, division = 'FP') => {
    // Only reload if forced, not loaded yet, or division changed
    if (salesRepConfigLoaded && !forceReload && configLoadedForDivision === division) {
      return;
    }
    
    try {
       const response = await fetch(`http://localhost:3001/api/sales-reps-defaults?division=${division}`);
       if (response.ok) {
         const result = await response.json();
         
         if (result.success) {
           setDefaultReps(result.selection || []);
           setSalesRepGroups(result.groups || {});
           setSalesRepConfigLoaded(true);
           setConfigLoadedForDivision(division);
         } else {
           console.error('API returned error:', result.message);
           setDefaultReps([]);
           setSalesRepGroups({});
           setConfigLoadedForDivision(null);
         }
      } else {
        console.error('Failed to load sales rep configuration');
        setDefaultReps([]);
        setSalesRepGroups({});
        setConfigLoadedForDivision(null);
      }
    } catch (error) {
      console.error('Error loading sales rep configuration:', error);
      setDefaultReps([]);
      setSalesRepGroups({});
      setConfigLoadedForDivision(null);
    }
  }, []); // Empty dependency array since we handle state changes internally

  // Function to refresh sales rep configuration
  const refreshSalesRepConfig = useCallback(async (division = 'FP') => {
    setSalesRepConfigLoaded(false);
    setConfigLoadedForDivision(null);
    await loadSalesRepConfig(true, division);
  }, [loadSalesRepConfig]);

  // Function to get product groups from the selected division
  const getProductGroups = useCallback(() => {
    if (!salesData[selectedDivision]) return [];
    
    const sheetData = salesData[selectedDivision];
    const productGroups = [];
    
    // Extract unique product groups from column A (starting from row 4, index 3)
    for (let i = 3; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row && row[0] && row[3]) { // Product Group name exists and has Figures Heads
        const productGroup = row[0];
        const figuresHead = row[3];
        
        // Group by product name
        if (!productGroups.find(pg => pg.name === productGroup)) {
          productGroups.push({
            name: productGroup,
            material: row[1] || '',
            process: row[2] || '',
            metrics: []
          });
        }
        
        // Add metric to the product group
        const existingGroup = productGroups.find(pg => pg.name === productGroup);
        if (existingGroup && !existingGroup.metrics.find(m => m.type === figuresHead)) {
          existingGroup.metrics.push({
            type: figuresHead,
            rowIndex: i,
            data: row.slice(4) // Data starts from column 5 (index 4)
          });
        }
      }
    }
    
    return productGroups;
  }, [salesData, selectedDivision]);

  // Function to get unique product groups for a specific sales rep and variable
  const getUniqueProductGroupsForRep = useCallback((rep, selectedVariable, divisionCode, salesRepGroups) => {
    return getUniqueProductGroups(rep, selectedVariable, divisionCode, salesData, salesRepGroups);
  }, [salesData]);

  // Load sales rep configuration on mount
  useEffect(() => {
    loadSalesRepConfig();
  }, [loadSalesRepConfig]);

  const value = {
    salesData,
    divisions,
    selectedDivision,
    setSelectedDivision,
    loading,
    error,
    dataLoaded,
    loadSalesData,
    getProductGroups,
    getUniqueProductGroupsForRep,
    defaultReps,
    salesRepGroups,
    loadSalesRepConfig,
    refreshSalesRepConfig,
    salesRepConfigLoaded
  };

  return (
    <SalesDataContext.Provider value={value}>
      {children}
    </SalesDataContext.Provider>
  );
};
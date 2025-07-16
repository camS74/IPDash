const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
require('dotenv').config();

// Database imports
const { testConnection, pool } = require('./database/config');
const fpDataService = require('./database/fpDataService');

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// Enable CORS with specific options
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// File-based persistent storage for standard configurations
const CONFIG_FILE_PATH = path.join(__dirname, 'data', 'standard-configs.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load existing configurations from file
let standardConfigs = new Map();
function loadStandardConfigs() {
  try {
    console.log(`🔍 Loading standard configs from: ${CONFIG_FILE_PATH}`);
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      console.log(`📄 File content length: ${data.length} characters`);
      const configs = JSON.parse(data);
      console.log(`📋 Parsed configs:`, Object.keys(configs));
      standardConfigs = new Map(Object.entries(configs));
      console.log(`✅ Loaded ${standardConfigs.size} standard configurations from file`);
      
      // Debug: Check what's in standardColumnSelection
      if (standardConfigs.has('standardColumnSelection')) {
        const columns = standardConfigs.get('standardColumnSelection');
        console.log(`📊 standardColumnSelection has ${columns.length} columns:`, columns.map(col => col.id));
      }
    } else {
      console.log('❌ No existing standard configurations file found, starting fresh');
    }
  } catch (error) {
    console.error('❌ Error loading standard configurations:', error);
    standardConfigs = new Map(); // Fallback to empty map
  }
}

// Save configurations to file
function saveStandardConfigs() {
  try {
    const configs = Object.fromEntries(standardConfigs);
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(configs, null, 2));
    console.log(`Saved ${standardConfigs.size} standard configurations to file`);
  } catch (error) {
    console.error('Error saving standard configurations:', error);
  }
}

// Load configurations on startup
loadStandardConfigs();

// Root path handler with helpful message
app.get('/', (req, res) => {
  res.send('This is the backend API server. Please access the React application at <a href="http://localhost:3000">http://localhost:3000</a>');
});

// API endpoints for standard configuration management
app.get('/api/standard-config', (req, res) => {
  try {
    console.log('🔍 GET /api/standard-config - Returning all standard configs');
    const allConfigs = {};
    
    // Convert Map to object
    for (const [key, value] of standardConfigs.entries()) {
      allConfigs[key] = value;
    }
    
    console.log('📊 All configs:', Object.keys(allConfigs));
    console.log('📊 standardColumnSelection length:', allConfigs.standardColumnSelection?.length || 0);
    console.log('📊 chartVisibleColumns length:', allConfigs.chartVisibleColumns?.length || 0);
    
    res.json({ success: true, data: allConfigs });
  } catch (error) {
    console.error('❌ Error retrieving all standard configs:', error);
    res.status(500).json({ error: 'Failed to retrieve standard configurations' });
  }
});

app.post('/api/standard-config', (req, res) => {
  try {
    const { key, data } = req.body;
    if (!key || !data) {
      return res.status(400).json({ error: 'Key and data are required' });
    }
    
    standardConfigs.set(key, data);
    saveStandardConfigs(); // Save to file immediately
    console.log(`Saved standard config for key: ${key}`);
    res.json({ success: true, message: 'Standard configuration saved' });
  } catch (error) {
    console.error('Error saving standard config:', error);
    res.status(500).json({ error: 'Failed to save standard configuration' });
  }
});

app.get('/api/standard-config/:key', (req, res) => {
  try {
    const { key } = req.params;
    const data = standardConfigs.get(key);
    
    if (data) {
      console.log(`🔍 Retrieved standard config for key: ${key}`);
      if (Array.isArray(data)) {
        console.log(`📊 Data is array with ${data.length} items:`, data.map(item => item.id || item.year));
      } else {
        console.log(`📊 Data type: ${typeof data}, value:`, data);
      }
      res.json({ success: true, data });
    } else {
      console.log(`❌ No data found for key: ${key}`);
      res.status(404).json({ success: false, message: 'Standard configuration not found' });
    }
  } catch (error) {
    console.error('❌ Error retrieving standard config:', error);
    res.status(500).json({ error: 'Failed to retrieve standard configuration' });
  }
});

app.delete('/api/standard-config/:key', (req, res) => {
  try {
    const { key } = req.params;
    const deleted = standardConfigs.delete(key);
    
    if (deleted) {
      saveStandardConfigs(); // Save to file immediately after deletion
      console.log(`Deleted standard config for key: ${key}`);
      res.json({ success: true, message: 'Standard configuration deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Standard configuration not found' });
    }
  } catch (error) {
    console.error('Error deleting standard config:', error);
    res.status(500).json({ error: 'Failed to delete standard configuration' });
  }
});

// API endpoint to serve the Excel file
app.get('/api/financials.xlsx', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'financials.xlsx');
  
  console.log('Received request for Excel file');
  console.log('Looking for file at:', filePath);
  
  try {
    // Check if file exists
    if (fs.existsSync(filePath)) {
      console.log('File found, sending to client');
      // Set appropriate headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'inline; filename=financials.xlsx');
      
      // Create read stream and pipe to response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Error reading file:', error);
        if (!res.headersSent) {
          res.status(500).send('Error reading Excel file');
        }
      });
      
      fileStream.on('end', () => {
        console.log('File sent successfully');
      });
    } else {
      console.error('Excel file not found at path:', filePath);
      res.status(404).send('Excel file not found');
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Internal server error');
  }
});

// Add a new endpoint for API/excel-data that redirects to the correct endpoint
app.get('/api/excel-data', (req, res) => {
  console.log('Received request to /api/excel-data, redirecting to /api/financials.xlsx');
  res.redirect('/api/financials.xlsx');
});

// API endpoint to serve the Sales Excel file
app.get('/api/sales.xlsx', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'Sales.xlsx');
  
  console.log('Received request for Sales Excel file');
  console.log('Looking for file at:', filePath);
  
  try {
    // Check if file exists
    if (fs.existsSync(filePath)) {
      console.log('Sales file found, sending to client');
      // Set appropriate headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'inline; filename=sales.xlsx');
      
      // Create read stream and pipe to response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Error reading Sales file:', error);
        if (!res.headersSent) {
          res.status(500).send('Error reading Sales Excel file');
        }
      });
      
      fileStream.on('end', () => {
        console.log('Sales file sent successfully');
      });
    } else {
      console.error('Sales Excel file not found at path:', filePath);
      res.status(404).send('Sales Excel file not found');
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Internal server error');
  }
});

// Master Data endpoints for material percentages
const MASTER_DATA_FILE_PATH = path.join(__dirname, 'data', 'master-data.json');

// Load master data from file
function loadMasterData() {
  try {
    let existingData = {};
    
    if (fs.existsSync(MASTER_DATA_FILE_PATH)) {
      const data = fs.readFileSync(MASTER_DATA_FILE_PATH, 'utf8');
      existingData = JSON.parse(data);
    }
    
    // Get dynamic product groups from Sales.xlsx
    const dynamicGroups = getProductGroupsFromSalesData();
    
    // Merge existing data with dynamic product groups
    if (Object.keys(dynamicGroups).length > 0) {
      return mergeMasterDataWithDynamicGroups(existingData, dynamicGroups);
    } else {
      // Fallback to default if no dynamic data available
      return Object.keys(existingData).length > 0 ? existingData : getDefaultMasterData();
    }
  } catch (error) {
    console.error('Error loading master data:', error);
    return getDefaultMasterData();
  }
}

// Save master data to file
function saveMasterData(data) {
  try {
    fs.writeFileSync(MASTER_DATA_FILE_PATH, JSON.stringify(data, null, 2));
    console.log('Master data saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving master data:', error);
    return false;
  }
}

// Default master data structure based on the provided table
function getDefaultMasterData() {
  return {
    FP: {
      'Commercial Items Plain': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Commercial Items Printed': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Industrial Items Plain': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Industrial Items Printed': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Laminates': { PE: 50, BOPP: 5, PET: 15, Alu: 20, Paper: 10, 'PVC/PET': 0 },
      'Mono Film Printed': { PE: 40, BOPP: 5, PET: 0, Alu: 0, Paper: 55, 'PVC/PET': 0 },
      'Shrink Film Plain': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Shrink Film Printed': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Shrink Sleeves': { PE: 0, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 100 },
      'Wide Film': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Wrap Around Label': { PE: 0, BOPP: 100, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Services Charges': { PE: 0, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 }
    },
    SB: {
      // Default structure for SB division (Shopping Bags)
      'Shopping Bags Plain': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Shopping Bags Printed': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 }
    },
    TF: {
      // Default structure for TF division (Thermoforming)
      'Thermoforming Plain': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Thermoforming Printed': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 }
    },
    HCM: {
      // Default structure for HCM division (Harwal Container Manufacturing)
      'Preforms': { PE: 0, BOPP: 0, PET: 100, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Closures': { PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 }
    }
  };
}

// Function to extract product groups from Sales.xlsx dynamically
function getProductGroupsFromSalesData() {
  const XLSX = require('xlsx');
  const salesFilePath = path.join(__dirname, 'data', 'Sales.xlsx');
  
  if (!fs.existsSync(salesFilePath)) {
    console.log('Sales.xlsx not found, using default product groups');
    return {};
  }

  try {
    const workbook = XLSX.readFile(salesFilePath);
    const divisions = ['FP', 'SB', 'TF', 'HCM'];
    const productGroupsByDivision = {};

    divisions.forEach(division => {
      const sheetName = `${division}-Product Group`;
      if (workbook.SheetNames.includes(sheetName)) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const productGroups = [];
        // Extract unique product groups from column A (starting from row 4, index 3)
        for (let i = 3; i < data.length; i++) {
          const row = data[i];
          if (row && row[0] && row[3]) { // Product Group name exists and has Figures Heads
            const productGroup = row[0];
            if (!productGroups.includes(productGroup)) {
              productGroups.push(productGroup);
            }
          }
        }
        
        productGroupsByDivision[division] = productGroups;
      }
    });

    return productGroupsByDivision;
  } catch (error) {
    console.error('Error reading Sales.xlsx for product groups:', error);
    return {};
  }
}

// Function to merge existing master data with dynamic product groups
function mergeMasterDataWithDynamicGroups(existingData, dynamicGroups) {
  const defaultData = getDefaultMasterData();
  const mergedData = { ...existingData };

  Object.keys(dynamicGroups).forEach(division => {
    if (!mergedData[division]) {
      mergedData[division] = {};
    }

    dynamicGroups[division].forEach(productGroup => {
      if (!mergedData[division][productGroup]) {
        // Use default values if available, otherwise default to 100% PE
        if (defaultData[division] && defaultData[division][productGroup]) {
          mergedData[division][productGroup] = { ...defaultData[division][productGroup] };
        } else {
          mergedData[division][productGroup] = { 
            PE: 100, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 0 
          };
        }
      }
    });
  });

  return mergedData;
}

// API endpoint to get sales data for country reference
app.get('/api/sales-data', (req, res) => {
  try {
    console.log('Received request for sales data');
    const XLSX = require('xlsx');
    const salesFilePath = path.join(__dirname, 'data', 'Sales.xlsx');
    
    if (!fs.existsSync(salesFilePath)) {
      console.log('Sales.xlsx not found');
      return res.json({ success: true, data: [] });
    }

    const workbook = XLSX.readFile(salesFilePath);
    const salesData = [];
    
    // Process all sheets in the workbook
    workbook.SheetNames.forEach(sheetName => {
      console.log('Processing sheet:', sheetName);
      
      try {
        const worksheet = workbook.Sheets[sheetName];
        
        // For Countries sheets, also provide raw data to help with country extraction
        let data, rawData;
        
        if (sheetName.includes('-Countries')) {
          // Get both JSON and raw array data for Countries sheets
          data = XLSX.utils.sheet_to_json(worksheet);
          rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          console.log(`✓ Countries sheet ${sheetName}: ${data.length} rows, raw structure available`);
        } else {
          // Regular processing for other sheets
          data = XLSX.utils.sheet_to_json(worksheet);
        }
        
        salesData.push({
          sheetName: sheetName,
          data: data,
          rawData: rawData // Available for Countries sheets
        });
        
        console.log(`✓ Sheet ${sheetName}: ${data.length} rows`);
      } catch (sheetError) {
        console.error(`Error processing sheet ${sheetName}:`, sheetError);
      }
    });
    
    console.log(`Loaded ${salesData.length} sheets from Sales.xlsx`);
    res.json({ success: true, data: salesData });
    
  } catch (error) {
    console.error('Error retrieving sales data:', error);
    res.status(500).json({ error: 'Failed to retrieve sales data' });
  }
});

// API endpoint to get master data
app.get('/api/master-data', (req, res) => {
  try {
    console.log('Received request for master data');
    const masterData = loadMasterData();
    res.json({ success: true, data: masterData });
  } catch (error) {
    console.error('Error retrieving master data:', error);
    res.status(500).json({ error: 'Failed to retrieve master data' });
  }
});

// API endpoint to save master data
app.post('/api/master-data', (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Master data is required' });
    }
    
    console.log('Received request to save master data');
    const success = saveMasterData(data);
    
    if (success) {
      res.json({ success: true, message: 'Master data saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save master data' });
    }
  } catch (error) {
    console.error('Error saving master data:', error);
    res.status(500).json({ error: 'Failed to save master data' });
  }
});

// toProperCase function removed - was only used for sales rep functionality

// Sales Rep Configuration Management
const SALES_REP_CONFIG_FILE = path.join(__dirname, 'data', 'sales-reps-config.json');

// Load sales rep configurations
function loadSalesRepConfig() {
  try {
    if (fs.existsSync(SALES_REP_CONFIG_FILE)) {
      const data = fs.readFileSync(SALES_REP_CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error loading sales rep config:', error);
    return {};
  }
}

// Save sales rep configurations
function saveSalesRepConfig(config) {
  try {
    fs.writeFileSync(SALES_REP_CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('Sales rep configuration saved successfully');
  } catch (error) {
    console.error('Error saving sales rep config:', error);
    throw error;
  }
}

// Get sales rep defaults and groups for a division
app.get('/api/sales-reps-defaults', (req, res) => {
  try {
    const { division } = req.query;
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division parameter is required' });
    }
    
    const config = loadSalesRepConfig();
    const divisionConfig = config[division] || {
      defaults: [],
      selection: [],
      groups: {}
    };
    
    res.json({ 
      success: true, 
      defaults: divisionConfig.defaults,
      selection: divisionConfig.selection,
      groups: divisionConfig.groups
    });
  } catch (error) {
    console.error('Error fetching sales rep defaults:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales rep defaults' });
  }
});

// Save sales rep defaults and groups for a division
app.post('/api/sales-reps-defaults', (req, res) => {
  try {
    const { division, defaults, selection, groups } = req.body;
    
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division is required' });
    }
    
    const config = loadSalesRepConfig();
    config[division] = {
      defaults: defaults || [],
      selection: selection || [],
      groups: groups || {}
    };
    
    saveSalesRepConfig(config);
    
    res.json({ success: true, message: 'Sales rep configuration saved successfully' });
  } catch (error) {
    console.error('Error saving sales rep defaults:', error);
    res.status(500).json({ success: false, message: 'Failed to save sales rep defaults' });
  }
});

// Create or update a sales rep group
app.post('/api/sales-rep-groups', (req, res) => {
  try {
    const { division, groupName, members, originalGroupName } = req.body;
    
    if (!division || !groupName || !members || !Array.isArray(members)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Division, group name, and members array are required' 
      });
    }
    
    const config = loadSalesRepConfig();
    if (!config[division]) {
      config[division] = { defaults: [], selection: [], groups: {} };
    }
    
    // If updating an existing group with a new name, remove the old one
    if (originalGroupName && originalGroupName !== groupName && config[division].groups[originalGroupName]) {
      delete config[division].groups[originalGroupName];
    }
    
    config[division].groups[groupName] = members;
    saveSalesRepConfig(config);
    
    res.json({ success: true, message: 'Sales rep group saved successfully' });
  } catch (error) {
    console.error('Error saving sales rep group:', error);
    res.status(500).json({ success: false, message: 'Failed to save sales rep group' });
  }
});

// Delete a sales rep group
app.delete('/api/sales-rep-groups', (req, res) => {
  try {
    const { division, groupName } = req.query;
    
    if (!division || !groupName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Division and group name are required' 
      });
    }
    
    const config = loadSalesRepConfig();
    if (config[division] && config[division].groups && config[division].groups[groupName]) {
      delete config[division].groups[groupName];
      saveSalesRepConfig(config);
      res.json({ success: true, message: 'Sales rep group deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Sales rep group not found' });
    }
  } catch (error) {
    console.error('Error deleting sales rep group:', error);
    res.status(500).json({ success: false, message: 'Failed to delete sales rep group' });
  }
});

// --- Confirmed Customer Merges API ---
const confirmedMergesPath = path.join(__dirname, 'data', 'confirmed-merges.json');

// Helper to read merges
function readConfirmedMerges() {
  try {
    if (!fs.existsSync(confirmedMergesPath)) return [];
    const data = fs.readFileSync(confirmedMergesPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to write merges
function writeConfirmedMerges(merges) {
  fs.writeFileSync(confirmedMergesPath, JSON.stringify(merges, null, 2), 'utf8');
}

// GET all confirmed merges
app.get('/api/confirmed-merges', (req, res) => {
  res.json({ success: true, data: readConfirmedMerges() });
});

// POST a new confirmed merge
app.post('/api/confirmed-merges', (req, res) => {
  const { group } = req.body;
  if (!Array.isArray(group) || group.length < 2) {
    return res.status(400).json({ success: false, message: 'Group must be an array of at least 2 customer names.' });
  }
  const merges = readConfirmedMerges();
  const sortedGroup = [...group].sort();
  if (!merges.some(g => JSON.stringify(g) === JSON.stringify(sortedGroup))) {
    merges.push(sortedGroup);
    writeConfirmedMerges(merges);
  }
  res.json({ success: true, message: 'Merge confirmed and saved.' });
});

// PUT to update all confirmed merges (for deletion)
app.put('/api/confirmed-merges', (req, res) => {
  const { merges } = req.body;
  if (!Array.isArray(merges)) {
    return res.status(400).json({ success: false, message: 'Merges must be an array.' });
  }
  writeConfirmedMerges(merges);
  res.json({ success: true, message: 'Merges updated successfully.' });
});

// PostgreSQL Database API Endpoints

// Test database connection
app.get('/api/db/test', async (req, res) => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      res.json({ success: true, message: 'Database connection successful' });
    } else {
      res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ success: false, message: 'Database connection error', error: error.message });
  }
});

// Get all sales representatives (legacy endpoint - now uses fp_data table)
app.get('/api/fp/sales-reps', async (req, res) => {
  try {
    console.log('🔍 Getting sales reps from fp_data table (legacy endpoint)...');
    
    const client = await pool.connect();
    
    // Get unique sales rep names from fp_data table
    const salesRepsResult = await client.query(`
      SELECT DISTINCT salesrepname 
      FROM fp_data 
      WHERE salesrepname IS NOT NULL 
      AND TRIM(salesrepname) != ''
      AND salesrepname != '(blank)'
      ORDER BY salesrepname
    `);
    
    const salesReps = salesRepsResult.rows.map(row => row.salesrepname);
    
    console.log(`✅ Found ${salesReps.length} unique sales reps from fp_data`);
    
    client.release();
    
    res.json({ success: true, data: salesReps });
  } catch (error) {
    console.error('Error fetching sales reps:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales representatives', error: error.message });
  }
});



// Get all product groups (optionally filtered by sales rep or group)
app.get('/api/fp/product-groups', async (req, res) => {
  try {
    const salesRep = req.query.salesRep;
    let productGroups;
    
    if (salesRep) {
      // Check if salesRep is actually a group name
      const config = loadSalesRepConfig();
      const fpConfig = config.FP || { groups: {} };
      
      if (fpConfig.groups && fpConfig.groups[salesRep]) {
        // It's a group - get product groups for all members
        const groupMembers = fpConfig.groups[salesRep];
        console.log(`Fetching product groups for group '${salesRep}' with members:`, groupMembers);
        
        // Get product groups for each member and combine them
        const allProductGroups = new Set();
        
        for (const member of groupMembers) {
          try {
            const memberProductGroups = await fpDataService.getProductGroupsBySalesRep(member);
            memberProductGroups.forEach(pg => {
              allProductGroups.add(pg.pgcombine || pg.product_group || pg);
            });
          } catch (memberError) {
            console.warn(`Failed to fetch product groups for member '${member}':`, memberError.message);
          }
        }
        
        // Convert Set back to array format expected by frontend
        productGroups = Array.from(allProductGroups).map(pgName => ({
          pgcombine: pgName,
          product_group: pgName
        }));
        
        console.log(`Found ${productGroups.length} unique product groups for group '${salesRep}'`);
      } else {
        // It's an individual sales rep
        productGroups = await fpDataService.getProductGroupsBySalesRep(salesRep);
      }
    } else {
      // Get all product groups
      productGroups = await fpDataService.getProductGroups();
    }
    
    res.json({ success: true, data: productGroups });
  } catch (error) {
    console.error('Error fetching product groups:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product groups', error: error.message });
  }
});

// Get sales data for a specific sales rep, product group, and period
app.get('/api/fp/sales-data', async (req, res) => {
  try {
    const { salesRep, productGroup, valueType, year, month, dataType = 'actual' } = req.query;
    
    if (!salesRep || !productGroup || !year || !month) {
      return res.status(400).json({ 
        success: false, 
        message: 'salesRep, productGroup, year, and month are required' 
      });
    }
    
    // Check if salesRep is actually a group name
    const config = loadSalesRepConfig();
    const fpConfig = config.FP || { groups: {} };
    
    let salesData;
    
    if (fpConfig.groups && fpConfig.groups[salesRep]) {
      // It's a group - get sales data for all members
      const groupMembers = fpConfig.groups[salesRep];
      
      if (valueType) {
        // Use value type specific query for groups
        salesData = 0;
        for (const member of groupMembers) {
          const memberData = await fpDataService.getSalesDataByValueType(member, productGroup, valueType, year, month, dataType);
          salesData += memberData;
        }
      } else {
        salesData = await fpDataService.getSalesDataForGroup(groupMembers, productGroup, dataType, year, month);
      }
    } else {
      // It's an individual sales rep
      if (valueType) {
        salesData = await fpDataService.getSalesDataByValueType(salesRep, productGroup, valueType, year, month, dataType);
      } else {
        salesData = await fpDataService.getSalesData(salesRep, productGroup, dataType, year, month);
      }
    }
    
    res.json({ success: true, data: salesData });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales data', error: error.message });
  }
});

// API endpoint to get sales reps from fp_data table for FP division
app.get('/api/fp/sales-reps-from-db', async (req, res) => {
  try {
    console.log('🔍 Getting sales reps from fp_data table...');
    
    const client = await pool.connect();
    
    // Get unique sales rep names from fp_data table
    const salesRepsResult = await client.query(`
      SELECT DISTINCT salesrepname 
      FROM fp_data 
      WHERE salesrepname IS NOT NULL 
      AND TRIM(salesrepname) != ''
      AND salesrepname != '(blank)'
      ORDER BY salesrepname
    `);
    
    const salesReps = salesRepsResult.rows.map(row => row.salesrepname);
    
    console.log(`✅ Found ${salesReps.length} unique sales reps from fp_data`);
    
    client.release();
    
    res.json({
      success: true,
      data: salesReps,
      message: `Retrieved ${salesReps.length} sales representatives from fp_data table`
    });
    
  } catch (error) {
    console.error('❌ Error getting sales reps from fp_data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sales representatives from database',
      message: error.message
    });
  }
});

// Optimized batch API endpoint for sales rep dashboard data
app.post('/api/fp/sales-rep-dashboard', async (req, res) => {
  try {
    const { salesRep, valueTypes = ['KGS', 'Amount'], periods = [] } = req.body;
    
    if (!salesRep) {
      return res.status(400).json({ 
        success: false, 
        message: 'salesRep is required' 
      });
    }
    
    console.log(`🔍 Getting dashboard data for sales rep: ${salesRep}`);
    
    // Check if salesRep is actually a group name
    const config = loadSalesRepConfig();
    const fpConfig = config.FP || { groups: {} };
    
    let productGroups;
    
    if (fpConfig.groups && fpConfig.groups[salesRep]) {
      // It's a group - get product groups for all members
      const groupMembers = fpConfig.groups[salesRep];
      console.log(`Fetching data for group '${salesRep}' with members:`, groupMembers);
      
      const allProductGroups = new Set();
      for (const member of groupMembers) {
        try {
          const memberProductGroups = await fpDataService.getProductGroupsBySalesRep(member);
          memberProductGroups.forEach(pg => allProductGroups.add(pg));
        } catch (memberError) {
          console.warn(`Failed to fetch product groups for member '${member}':`, memberError.message);
        }
      }
      productGroups = Array.from(allProductGroups);
    } else {
      // It's an individual sales rep
      productGroups = await fpDataService.getProductGroupsBySalesRep(salesRep);
    }
    
    // Get batch sales data for all combinations
    const dashboardData = {};
    
    for (const productGroup of productGroups) {
      dashboardData[productGroup] = {};
      
      for (const valueType of valueTypes) {
        dashboardData[productGroup][valueType] = {};
        
        for (const period of periods) {
          const { year, month, type = 'Actual' } = period;
          
          let salesData;
          if (fpConfig.groups && fpConfig.groups[salesRep]) {
            // Group data
            const groupMembers = fpConfig.groups[salesRep];
            salesData = await fpDataService.getSalesDataForGroup(groupMembers, productGroup, valueType, year, month, type);
          } else {
            // Individual sales rep data
            salesData = await fpDataService.getSalesDataByValueType(salesRep, productGroup, valueType, year, month, type);
          }
          
          dashboardData[productGroup][valueType][`${year}-${month}-${type}`] = salesData;
        }
      }
    }
    
    console.log(`✅ Retrieved dashboard data for ${productGroups.length} product groups`);
    
    res.json({
      success: true,
      data: {
        salesRep,
        productGroups,
        dashboardData,
        isGroup: !!(fpConfig.groups && fpConfig.groups[salesRep])
      },
      message: `Retrieved dashboard data for ${salesRep}`
    });
    
  } catch (error) {
    console.error('❌ Error getting sales rep dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sales rep dashboard data',
      message: error.message
    });
  }
});

// Optimized batch API endpoint for customer dashboard data (KGS only)
app.post('/api/fp/customer-dashboard', async (req, res) => {
  try {
    const { salesRep, periods = [] } = req.body;
    
    if (!salesRep) {
      return res.status(400).json({ 
        success: false, 
        message: 'salesRep is required' 
      });
    }
    
    console.log(`🔍 Getting customer dashboard data for sales rep: ${salesRep}`);
    
    // Check if salesRep is actually a group name
    const config = loadSalesRepConfig();
    const fpConfig = config.FP || { groups: {} };
    
    let customers;
    
    if (fpConfig.groups && fpConfig.groups[salesRep]) {
      // It's a group - get customers for all members
      const groupMembers = fpConfig.groups[salesRep];
      console.log(`Fetching customers for group '${salesRep}' with members:`, groupMembers);
      
      customers = await fpDataService.getCustomersForGroup(groupMembers);
    } else {
      // It's an individual sales rep
      customers = await fpDataService.getCustomersBySalesRep(salesRep);
    }
    
    // Get batch customer sales data for KGS only
    const dashboardData = {};
    
    for (const customer of customers) {
      dashboardData[customer] = {};
      
      for (const period of periods) {
        const { year, month, type = 'Actual' } = period;
        
        let salesData;
        if (fpConfig.groups && fpConfig.groups[salesRep]) {
          // Group data
          const groupMembers = fpConfig.groups[salesRep];
          salesData = await fpDataService.getCustomerSalesDataForGroup(groupMembers, customer, 'KGS', year, month, type);
        } else {
          // Individual sales rep data
          salesData = await fpDataService.getCustomerSalesDataByValueType(salesRep, customer, 'KGS', year, month, type);
        }
        
        dashboardData[customer][`${year}-${month}-${type}`] = salesData;
      }
    }
    
    console.log(`✅ Retrieved customer dashboard data for ${customers.length} customers`);
    
    res.json({
      success: true,
      data: {
        salesRep,
        customers,
        dashboardData,
        isGroup: !!(fpConfig.groups && fpConfig.groups[salesRep])
      },
      message: `Retrieved customer dashboard data for ${salesRep}`
    });
    
  } catch (error) {
    console.error('❌ Error getting customer dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer dashboard data',
      message: error.message
    });
  }
});

// Get all customers for a division (for centralized merging)
app.get('/api/fp/all-customers', async (req, res) => {
  try {
    const { division } = req.query;
    
    if (!division) {
      return res.status(400).json({ 
        success: false, 
        message: 'division parameter is required' 
      });
    }
    
    console.log(`🔍 Getting all customers for division: ${division}`);
    
    // For now, only FP division is supported
    if (division !== 'FP') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only FP division is currently supported for customer merging' 
      });
    }
    
    // Get all unique customers from the fp_data table
    const customers = await fpDataService.getAllCustomers();
    
    console.log(`✅ Retrieved ${customers.length} customers for ${division} division`);
    
    res.json({
      success: true,
      data: customers,
      message: `Retrieved ${customers.length} customers for ${division} division`
    });
    
  } catch (error) {
    console.error('❌ Error getting all customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve all customers',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Something broke!');
});

// Test database connection and start the server
const startServer = async () => {
  console.log('🚀 Starting IPDashboard Backend Server...');
  
  // Test database connection
  console.log('🔍 Testing database connection...');
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    console.log('✅ Database connection successful');
  } else {
    console.log('⚠️  Database connection failed - server will start but database features may not work');
    console.log('💡 Please check your .env file and ensure PostgreSQL is running');
  }
  
  app.listen(PORT, () => {
    console.log(`🌟 Backend server running on http://localhost:${PORT}`);
    console.log('📊 Available endpoints:');
    console.log('   - Excel data: /api/financials.xlsx, /api/sales.xlsx');
    console.log('   - Database test: /api/db/test');
    console.log('   - FP data: /api/fp/* (sales-reps, customers, countries, etc.)');
  });
};

startServer();

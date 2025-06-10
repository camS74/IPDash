const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());

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
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      const configs = JSON.parse(data);
      standardConfigs = new Map(Object.entries(configs));
      console.log(`Loaded ${standardConfigs.size} standard configurations from file`);
    } else {
      console.log('No existing standard configurations file found, starting fresh');
    }
  } catch (error) {
    console.error('Error loading standard configurations:', error);
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
      console.log(`Retrieved standard config for key: ${key}`);
      res.json({ success: true, data });
    } else {
      res.status(404).json({ success: false, message: 'Standard configuration not found' });
    }
  } catch (error) {
    console.error('Error retrieving standard config:', error);
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
      // Default structure for HCM division (Preforms and Closures)
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
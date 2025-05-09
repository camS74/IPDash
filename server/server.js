const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors());

// Serve static files from the 'data' directory
app.use('/data', express.static(path.join(__dirname, 'data')));

// Root path handler with helpful message
app.get('/', (req, res) => {
  res.send('This is the backend API server. Please access the React application at <a href="http://localhost:3000">http://localhost:3000</a>');
});

// API endpoint to serve the Excel file
app.get('/api/financials.xlsx', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'financials.xlsx');
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Excel file not found');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
}); 
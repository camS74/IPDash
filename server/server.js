const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors());

// Root path handler with helpful message
app.get('/', (req, res) => {
  res.send('This is the backend API server. Please access the React application at <a href="http://localhost:3000">http://localhost:3000</a>');
});

// API endpoint to serve the Excel file
app.get('/api/financials.xlsx', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'financials.xlsx');
  
  console.log('Received request for Excel file');
  console.log('Looking for file at:', filePath);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    console.log('File found, sending to client');
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'inline; filename=financials.xlsx');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending Excel file');
      } else {
        console.log('File sent successfully');
      }
    });
  } else {
    console.error('Excel file not found at path:', filePath);
    res.status(404).send('Excel file not found');
  }
});

// Add a new endpoint for API/excel-data that redirects to the correct endpoint
app.get('/api/excel-data', (req, res) => {
  console.log('Received request to /api/excel-data, redirecting to /api/financials.xlsx');
  res.redirect('/api/financials.xlsx');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
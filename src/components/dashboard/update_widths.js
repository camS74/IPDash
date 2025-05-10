// This script updates all remaining 57px width values to 48px (for % of Sales column)
// and leaves width values for Sales per Kg column at 57px

const fs = require('fs');
const path = require('path');

// Path to the TableView.js file
const filePath = path.join(__dirname, 'TableView.js');

// Read the file content
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Update all percent column width to 48px
  // This regex matches width: '57px' in td elements with percent in the key
  const percentRegex = /(key={\`percent-.*?style={{.*?width: )'57px'(.*?}})/g;
  const updatedContent = data.replace(percentRegex, '$148px$2');

  // Write the file back
  fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Successfully updated % of Sales column widths from 57px to 48px');
  });
});

import React, { useState } from 'react';
import { useFilter } from '../../contexts/FilterContext';
import './ColumnConfigGrid.css';

const ColumnConfigGrid = () => {
  const { columnOrder, updateColumnOrder, removeColumn, clearAllColumns, generateData, dataGenerated } = useFilter();
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(null);
  
  // Handle Clear All with resetting selection
  const handleClearAll = () => {
    clearAllColumns();
    setSelectedColumnIndex(null); // Reset selected column when clearing all
  };
  
  // Handle data generation
  const handleGenerate = () => {
    if (columnOrder.length > 0) {
      generateData();
    }
  };
  
  // Move a column left in the order
  const moveLeft = (index) => {
    if (index > 0) {
      const newOrder = [...columnOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      updateColumnOrder(newOrder);
    }
  };
  
  // Move a column right in the order
  const moveRight = (index) => {
    if (index < columnOrder.length - 1) {
      const newOrder = [...columnOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      updateColumnOrder(newOrder);
    }
  };
  
  // Get CSS class for column based on its config
  const getColumnClass = (column) => {
    const baseClass = 'config-column';
    if (column.customColor) {
      return `${baseClass} scheme-${column.customColor}`;
    }
    
    // Default to classic blue if no custom color
    return `${baseClass} scheme-classicBlue`;
  };
  
  // Get background color for column (for inline styling)
  const getColumnStyle = (column, isSelected = false) => {
    // Start with bold font style for all columns
    const baseStyle = { fontWeight: 'bold' };
    
    if (column.customColor) {
      const scheme = colorSchemes.find(s => s.name === column.customColor);
      if (scheme) {
        return { 
          ...baseStyle,
          backgroundColor: scheme.primary, 
          color: scheme.isDark ? '#FFFFFF' : '#000000',
          boxShadow: isSelected ? '0 0 5px 2px rgba(0,0,0,0.3)' : 'none'
        };
      }
    }
    
    // Default to blue if no custom color
    const defaultScheme = colorSchemes[0];
    return { 
      ...baseStyle,
      backgroundColor: defaultScheme.primary, 
      color: defaultScheme.isDark ? '#FFFFFF' : '#000000',
      boxShadow: isSelected ? '0 0 5px 2px rgba(0,0,0,0.3)' : 'none'
    };
  };
  
  // Handle column click to select it
  const handleColumnClick = (index) => {
    setSelectedColumnIndex(index === selectedColumnIndex ? null : index);
  };
  
  // Handle remove column
  const handleRemoveColumn = () => {
    if (selectedColumnIndex !== null) {
      removeColumn(columnOrder[selectedColumnIndex].id);
      setSelectedColumnIndex(null);
    }
  };
  
  // Color scheme definitions - updated to the requested colors
  const colorSchemes = [
    { name: 'blue', label: 'Blue', primary: '#288cfa', secondary: '#103766', isDark: true },
    { name: 'green', label: 'Green', primary: '#2E865F', secondary: '#C6F4D6', isDark: true },
    { name: 'yellow', label: 'Yellow', primary: '#FFEA00', secondary: '#FFFDE7', isDark: false }, // Brighter yellow
    { name: 'orange', label: 'Orange', primary: '#FF9800', secondary: '#FFE0B2', isDark: false }, // New orange
    { name: 'boldContrast', label: 'Bold Contrast', primary: '#003366', secondary: '#FF0000', isDark: true }
  ];
  
  // Function to determine text color based on background brightness
  const getTextColor = (colorScheme) => {
    // If we know the color is dark or light through our predefined property
    if (colorScheme && colorSchemes.find(s => s.name === colorScheme)) {
      const scheme = colorSchemes.find(s => s.name === colorScheme);
      return scheme.isDark ? '#FFFFFF' : '#000000';
    }
    
    // Default to white text
    return '#FFFFFF';
  };
  
  // Set custom color for the selected column
  const setColumnColor = (colorScheme) => {
    if (selectedColumnIndex !== null) {
      const newOrder = [...columnOrder];
      newOrder[selectedColumnIndex] = {
        ...newOrder[selectedColumnIndex],
        customColor: colorScheme
      };
      updateColumnOrder(newOrder);
    }
  };
  
  return (
    <div className="column-config-container">
      <div className="column-config-header">
        <div className="header-title-actions">
          <h3>Column Configuration</h3>
          <div className="header-buttons">
            {columnOrder.length > 0 && (
              <>
                <button onClick={handleGenerate} className="generate-btn" disabled={dataGenerated}>
                  {dataGenerated ? 'Generated' : 'Generate'}
                </button>
                <button onClick={handleClearAll} className="clear-all-btn">
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>
        {selectedColumnIndex !== null && (
          <div className="column-actions">
            <button onClick={() => moveLeft(selectedColumnIndex)} disabled={selectedColumnIndex === 0}>
              ← Move Left
            </button>
            <button onClick={() => moveRight(selectedColumnIndex)} disabled={selectedColumnIndex === columnOrder.length - 1}>
              Move Right →
            </button>
            <button onClick={handleRemoveColumn} className="remove-btn">
              Remove
            </button>
            <div className="color-selector">
              <span>Color Scheme:</span>
              <div className="color-options">
                {colorSchemes.map((scheme) => (
                  <div 
                    key={scheme.name} 
                    className="color-option"
                    style={{ backgroundColor: scheme.primary, border: `1px solid ${scheme.secondary}` }}
                    onClick={() => setColumnColor(scheme.name)}
                    title={scheme.label}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="config-grid">
        {columnOrder.length > 0 ? (
          <>
            <div className="config-row year-row">
              {columnOrder.map((column, index) => (
                <div 
                  key={`year-${index}`} 
                  className={`config-column ${selectedColumnIndex === index ? 'selected' : ''}`}
                  style={getColumnStyle(column, selectedColumnIndex === index)}
                  onClick={() => handleColumnClick(index)}
                >
                  {column.year}
                </div>
              ))}
            </div>
            <div className="config-row period-row">
              {columnOrder.map((column, index) => (
                <div 
                  key={`period-${index}`} 
                  className={`config-column ${selectedColumnIndex === index ? 'selected' : ''}`}
                  style={getColumnStyle(column, selectedColumnIndex === index)}
                  onClick={() => handleColumnClick(index)}
                >
                  {column.month}
                </div>
              ))}
            </div>
            <div className="config-row type-row">
              {columnOrder.map((column, index) => (
                <div 
                  key={`type-${index}`} 
                  className={`config-column ${selectedColumnIndex === index ? 'selected' : ''}`}
                  style={getColumnStyle(column, selectedColumnIndex === index)}
                  onClick={() => handleColumnClick(index)}
                >
                  {column.type}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-columns-message">
            No columns configured. Please select options from above and click "Add Column".
          </div>
        )}
      </div>
    </div>
  );
};

export default ColumnConfigGrid;

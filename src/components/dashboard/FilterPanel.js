import React, { useState } from 'react';
import { useFilter } from '../../contexts/FilterContext';
import './FilterPanel.css';

// Maximum number of columns allowed - must match with the value in FilterContext
const MAX_COLUMNS = 5;

const FilterPanel = () => {
  const { 
    availableFilters, 
    addColumn,
    columnOrder
  } = useFilter();
  
  // Local state for the current selections
  const [currentSelection, setCurrentSelection] = useState({
    year: '',
    month: '',
    type: ''
  });
  
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSelectionChange = (filterType, e) => {
    setCurrentSelection({
      ...currentSelection,
      [filterType]: e.target.value
    });
  };
  
  const handleAddColumn = () => {
    // Clear any previous error message
    setErrorMessage('');
    
    // Check if all selections are made
    if (currentSelection.year && currentSelection.month && currentSelection.type) {
      // Check if we've already reached the limit
      if (columnOrder.length >= MAX_COLUMNS) {
        setErrorMessage(`Maximum limit of ${MAX_COLUMNS} columns reached. Please remove a column before adding more.`);
        return;
      }
      
      // Try to add the column
      const success = addColumn(currentSelection.year, currentSelection.month, currentSelection.type);
      
      if (!success) {
        // If column already exists
        setErrorMessage('This column combination already exists.');
      } else {
        // Clear selections after successfully adding
        setCurrentSelection({ year: '', month: '', type: '' });
      }
    }
  };
  
  const isAddButtonDisabled = !currentSelection.year || !currentSelection.month || !currentSelection.type;
  
  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3>Year</h3>
        <select
          value={currentSelection.year}
          onChange={(e) => handleSelectionChange('year', e)}
          className="filter-select single"
        >
          <option value="">Select Year</option>
          {availableFilters.years
            .slice()
            .sort((a, b) => b - a)
            .map(year => (
              <option key={year} value={year}>
                {year}
              </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <h3>Period</h3>
        <select
          value={currentSelection.month}
          onChange={(e) => handleSelectionChange('month', e)}
          className="filter-select single"
        >
          <option value="">Select Period</option>
          {availableFilters.months.map(month => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <h3>Type</h3>
        <select
          value={currentSelection.type}
          onChange={(e) => handleSelectionChange('type', e)}
          className="filter-select single"
        >
          <option value="">Select Type</option>
          {availableFilters.types.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      
      <div className="filter-actions">
        <button 
          className="add-column-btn" 
          onClick={handleAddColumn}
          disabled={isAddButtonDisabled || columnOrder.length >= MAX_COLUMNS}
        >
          Add Column
        </button>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {columnOrder.length > 0 && (
          <div className="column-count">
            Columns: {columnOrder.length}/{MAX_COLUMNS}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
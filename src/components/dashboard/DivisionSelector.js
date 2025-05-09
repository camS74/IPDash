import React from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import './DivisionSelector.css';

const DivisionSelector = () => {
  const { divisions, selectedDivision, setSelectedDivision } = useExcelData();

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
  };

  return (
    <div className="division-selector">
      <label htmlFor="division-select">Select Division:</label>
      <select 
        id="division-select"
        value={selectedDivision}
        onChange={handleDivisionChange}
        className="division-select"
      >
        {divisions.map(division => (
          <option key={division} value={division}>
            {division}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DivisionSelector;

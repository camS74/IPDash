import React from 'react';
import { ExcelDataProvider } from './contexts/ExcelDataContext';
import { FilterProvider } from './contexts/FilterContext';
import Dashboard from './components/dashboard/Dashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <ExcelDataProvider>
        <FilterProvider>
          <Dashboard />
        </FilterProvider>
      </ExcelDataProvider>
    </div>
  );
}

export default App;

import React from 'react';
import { ExcelDataProvider } from './contexts/ExcelDataContext';
import { SalesDataProvider } from './contexts/SalesDataContext';
import { FilterProvider } from './contexts/FilterContext';
import Dashboard from './components/dashboard/Dashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <ExcelDataProvider>
        <SalesDataProvider>
          <FilterProvider>
            <Dashboard />
          </FilterProvider>
        </SalesDataProvider>
      </ExcelDataProvider>
    </div>
  );
}

export default App;

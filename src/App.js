import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ExcelDataProvider } from './contexts/ExcelDataContext';
import { SalesDataProvider } from './contexts/SalesDataContext';
import { FilterProvider } from './contexts/FilterContext';
import Dashboard from './components/dashboard/Dashboard';
import TestOracleData from './components/dashboard/TestOracleData';
import './App.css';

function App() {
  return (
    <div className="App">
      <ExcelDataProvider>
        <SalesDataProvider>
          <FilterProvider>
            <Router>
              <Routes>
                <Route path="/testdata" element={<TestOracleData />} />
                <Route path="/*" element={<Dashboard />} />
              </Routes>
            </Router>
          </FilterProvider>
        </SalesDataProvider>
      </ExcelDataProvider>
    </div>
  );
}

export default App;

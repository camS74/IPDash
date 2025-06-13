
import React, { useState } from 'react';
import SalesCountryCesium from './SalesCountryCesium';
import SalesCountryLeafletMap from './SalesCountryLeafletMap';
import './MapSwitcher.css';

const MapSwitcher = () => {
  const [viewMode, setViewMode] = useState('3D');

  return (
    <div>
      <div className="map-toggle-buttons">
        <button onClick={() => setViewMode('2D')} className={viewMode === '2D' ? 'active' : ''}>2D Map</button>
        <button onClick={() => setViewMode('3D')} className={viewMode === '3D' ? 'active' : ''}>3D Globe</button>
      </div>
      {viewMode === '2D' ? <SalesCountryLeafletMap /> : <SalesCountryCesium />}
    </div>
  );
};

export default MapSwitcher;

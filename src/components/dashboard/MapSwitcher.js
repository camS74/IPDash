import React, { useState } from 'react';
import SalesCountryCesium from './SalesCountryCesium';
import SalesCountryLeafletMap from './SalesCountryLeafletMap';
import RealWorld2DMap from './RealWorld2DMap';
import './MapSwitcher.css';

const MapSwitcher = () => {
  const [viewMode, setViewMode] = useState('3D');

  return (
    <div>
      <div className="map-toggle-buttons">
        <button onClick={() => setViewMode('2D')} className={viewMode === '2D' ? 'active' : ''}>2D Map</button>
        <button onClick={() => setViewMode('2DREAL')} className={viewMode === '2DREAL' ? 'active' : ''}>2D Real</button>
        <button onClick={() => setViewMode('3D')} className={viewMode === '3D' ? 'active' : ''}>3D Globe</button>
      </div>
      {viewMode === '2D' && <SalesCountryLeafletMap />}
      {viewMode === '2DREAL' && <RealWorld2DMap />}
      {viewMode === '3D' && <SalesCountryCesium />}
    </div>
  );
};

export default MapSwitcher;

import React, { useState, useEffect } from 'react';
import './ModernMarginGauge.css';

// Color scheme definitions (matching the config grid and other components)
const colorSchemes = {
  blue: '#288cfa',
  green: '#2E865F',
  yellow: '#FFCC33',
  orange: '#FF9800',
  boldContrast: '#003366',
};

// Default fallback colors in order
const defaultColors = ['#FFCC33', '#288cfa', '#003366', '#91cc75', '#5470c6'];

// Single Gauge Component
const SingleGauge = ({ value, absoluteValue, perKgValue, title, color, index }) => {
  // Calculate the angle for the needle
  const needleAngle = -120 + (value / 100) * 240;
  const progressOffset = 418 - (value / 100) * 418;
  
  // Calculate the tip of the needle
  const angleRad = (Math.PI / 180) * needleAngle;
  const tipX = 100 + 70 * Math.sin(angleRad); // 70 is the needle length
  const tipY = 100 - 70 * Math.cos(angleRad); // SVG y axis is down
  const PERCENT_OFFSET = 32; // Increase this value for more space
  const percentY = tipY - PERCENT_OFFSET;
  
  // Log the exact values for debugging
  console.log(`Gauge ${index} (${title}): Value=${value}%, Angle=${needleAngle}, Offset=${progressOffset}`);
  
  return (
    <div className="modern-gauge-card" style={{ minHeight: 340 }}>
      <div className="gauge-body">
        {/* Gauge visualization with percentage at needle tip */}
        <div className="gauge-container">
          {/* SVG Gauge with Arc, Needle, and Percentage */}
          <svg viewBox="0 0 200 110" className="gauge-svg">
            {/* Arc background */}
            <path
              d="M20,100 A80,80 0 0,1 180,100"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="18"
              strokeLinecap="round"
              className="gauge-track"
            />
            {/* Arc progress */}
            <path
              d="M20,100 A80,80 0 0,1 180,100"
              fill="none"
              stroke={color}
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray="418"
              strokeDashoffset={progressOffset}
              className="gauge-progress"
            />
            {/* Needle */}
            <g transform={`rotate(${needleAngle} 100 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                stroke="#333"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="8" fill="#fff" stroke="#333" strokeWidth="4" />
            </g>
            {/* Percentage value at the tip, always horizontal */}
            <text
              x={tipX}
              y={percentY}
              textAnchor="middle"
              fontSize="18"
              fontWeight="bold"
              fill={color}
              style={{ userSelect: 'none' }}
            >
              {value.toFixed(2)}%
            </text>
          </svg>
        </div>
        
        {/* Absolute value as main display */}
        <div className="gauge-absolute" style={{ fontSize: 28, fontWeight: 'bold', color: color, marginBottom: 5 }}>
          {absoluteValue}
        </div>
        {/* Per kg value below the amount */}
        <div className="gauge-perkg" style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: 5 }}>
          {perKgValue} <span style={{ fontSize: 16, color: color, fontWeight: 'bold' }}>per kg</span>
        </div>
      </div>
      
      {/* Title bar */}
      <div
        className="gauge-title"
        style={{
          backgroundColor: color, // solid color, not faded
          color: color.toLowerCase() === '#ffcc33' ? '#333' : '#fff', // dark text for yellow, white for others
          borderColor: color,
          fontSize: 20,
          fontWeight: 'bold',
          letterSpacing: 0.5
        }}
      >
        <span>{title}</span>
      </div>
    </div>
  );
};

// ModernMarginGauge - Main Component
const ModernMarginGauge = ({ data, periods, basePeriod, style }) => {
  console.log('ModernMarginGauge received data:', {
    periodCount: periods.length,
    dataKeys: Object.keys(data),
    sampleData: Object.entries(data).map(([key, value]) => ({ 
      period: key, 
      sales: value.sales,
      materialCost: value.materialCost,
      calculatedMargin: value.sales - value.materialCost
    }))
  });

  // Process data for gauges
  const gaugeData = periods.map((period, index) => {
    const periodKey = `${period.year}-${period.month || 'Year'}-${period.type}`;
    // Get raw values from data object
    const salesValue = data[periodKey]?.sales || 0;
    const materialCost = data[periodKey]?.materialCost || 0;
    const marginPerKg = data[periodKey]?.marginPerKg;
    const perKgValue = (typeof marginPerKg === 'number' && !isNaN(marginPerKg)) ? marginPerKg.toFixed(2) : '--';
    // Calculate Margin over Material - Sales minus Material
    const marginOverMaterial = salesValue - materialCost;
    // Calculate it as a percentage of Sales for the gauge
    let marginPercentage = 0;
    if (salesValue > 0) {
      marginPercentage = (marginOverMaterial / salesValue) * 100;
      // Round to 2 decimal places
      marginPercentage = Math.round(marginPercentage * 100) / 100;
    }
    // Format the absolute value for display without $ sign
    const formattedValue = `${(marginOverMaterial / 1000000).toFixed(1)}M`;
    // Determine the color based on period's customColor property
    let color;
    if (period.customColor && colorSchemes[period.customColor]) {
      color = colorSchemes[period.customColor];
    } else {
      // Fall back to default colors
      color = defaultColors[index % defaultColors.length];
    }
    return {
      title: `${period.year} ${period.month || ''} ${period.type}`,
      value: marginPercentage,
      absoluteValue: formattedValue,
      absRaw: marginOverMaterial, // for variance calculation
      perKgValue,
      color
    };
  });

  // Calculate variances between cards (absolute value, as % of previous)
  const variances = gaugeData.map((g, idx) => {
    if (idx === 0) return null;
    const prev = gaugeData[idx - 1];
    if (!prev || prev.absRaw === 0) return null;
    return ((g.absRaw - prev.absRaw) / Math.abs(prev.absRaw)) * 100;
  });

  return (
    <div className="modern-margin-gauge-panel" style={{ 
      marginTop: 30, 
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      ...(style || {}) // Apply any style props passed from parent component
    }}>
      <h2 className="modern-gauge-heading">Margin over Material</h2>
      <div className="modern-gauge-container" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8 }}>
        {gaugeData.map((gauge, idx) => (
          <React.Fragment key={gauge.title}>
            <SingleGauge
              value={gauge.value}
              absoluteValue={gauge.absoluteValue}
              perKgValue={gauge.perKgValue}
              title={gauge.title}
              color={gauge.color}
              index={idx}
            />
            {/* Variance badge between cards */}
            {idx < gaugeData.length - 1 && (() => {
              const variance = variances[idx + 1];
              let badgeColor = '#888', arrow = '–';
              if (variance !== null && !isNaN(variance)) {
                if (variance > 0) { badgeColor = '#2E865F'; arrow = '▲'; }
                else if (variance < 0) { badgeColor = '#cf1322'; arrow = '▼'; }
              }
              return (
                <div style={{
                  alignSelf: 'center',
                  margin: '0 2px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 40,
                  width: 40,
                  height: 60,
                  justifyContent: 'center',
                }}>
                  {variance === null || isNaN(variance) ? (
                    <span style={{ color: '#888', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>N/A</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 22, fontWeight: 'bold', color: badgeColor, lineHeight: 1 }}>{arrow}</span>
                      <span style={{ fontSize: 18, fontWeight: 'bold', color: badgeColor, lineHeight: 1.1 }}>{Math.abs(variance).toFixed(1)}</span>
                      <span style={{ fontSize: 16, fontWeight: 'bold', color: badgeColor, lineHeight: 1.1 }}>%</span>
                    </>
                  )}
                </div>
              );
            })()}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ModernMarginGauge; 
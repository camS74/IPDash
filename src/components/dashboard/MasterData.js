import React, { useState, useEffect } from 'react';
import CountryReference from './CountryReference';
import './MasterData.css';

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('materials');
  const [masterData, setMasterData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Sales Rep Selection state
  const [salesReps, setSalesReps] = useState([]);
  const [selectedReps, setSelectedReps] = useState([]);
  const [defaultReps, setDefaultReps] = useState([]);
  const [editDefault, setEditDefault] = useState(false);
  const [loadingReps, setLoadingReps] = useState(false);
  const [errorReps, setErrorReps] = useState(null);
  const [savingReps, setSavingReps] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Material columns for the table
  const materialColumns = ['PE', 'BOPP', 'PET', 'Alu', 'Paper', 'PVC/PET'];

  // Load master data on component mount
  useEffect(() => {
    loadMasterData();
  }, []);

  // Load sales reps and defaults
  useEffect(() => {
    if (activeTab === 'salesreps') {
      setLoadingReps(true);
      Promise.all([
        fetch('/api/sales-reps').then(res => res.json()),
        fetch('/api/sales-reps-defaults').then(res => res.json())
      ])
        .then(([repsRes, configRes]) => {
          if (repsRes.success && configRes.success) {
            setSalesReps(repsRes.data);
            setDefaultReps(configRes.defaults);
            setSelectedReps(configRes.selection);
          } else {
            setErrorReps('Failed to load sales reps/config');
          }
        })
        .catch(() => setErrorReps('Failed to load sales reps/config'))
        .finally(() => setLoadingReps(false));
    }
  }, [activeTab]);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/master-data');
      const result = await response.json();
      
      if (result.success) {
        setMasterData(result.data);
      } else {
        throw new Error('Failed to load master data');
      }
    } catch (err) {
      console.error('Error loading master data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveMasterData = async () => {
    try {
      setSaving(true);
      setSaveMessage('');
      
      const response = await fetch('/api/master-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: masterData }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSaveMessage('Master data saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        throw new Error('Failed to save master data');
      }
    } catch (err) {
      console.error('Error saving master data:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePercentageChange = (division, productGroup, material, value) => {
    const numValue = parseFloat(value) || 0;
    
    setMasterData(prev => ({
      ...prev,
      [division]: {
        ...prev[division],
        [productGroup]: {
          ...prev[division][productGroup],
          [material]: numValue
        }
      }
    }));
  };

  const calculateRowTotal = (division, productGroup) => {
    if (!masterData[division] || !masterData[division][productGroup]) return 0;
    
    return materialColumns.reduce((total, material) => {
      return total + (masterData[division][productGroup][material] || 0);
    }, 0);
  };

  const calculateColumnTotal = (material) => {
    let total = 0;
    let totalRows = 0;
    
    Object.keys(masterData).forEach(division => {
      Object.keys(masterData[division]).forEach(productGroup => {
        if (masterData[division][productGroup][material] !== undefined) {
          total += masterData[division][productGroup][material] || 0;
          totalRows++;
        }
      });
    });
    
    return totalRows > 0 ? Math.round(total / totalRows) : 0;
  };

  const resetRow = (division, productGroup) => {
    const resetValues = {};
    materialColumns.forEach(material => {
      resetValues[material] = 0;
    });
    
    setMasterData(prev => ({
      ...prev,
      [division]: {
        ...prev[division],
        [productGroup]: resetValues
      }
    }));
  };

  const normalizeRow = (division, productGroup) => {
    const currentTotal = calculateRowTotal(division, productGroup);
    
    if (currentTotal === 0 || currentTotal === 100) return;
    
    const normalizedValues = {};
    materialColumns.forEach(material => {
      const currentValue = masterData[division][productGroup][material] || 0;
      normalizedValues[material] = Math.round((currentValue / currentTotal) * 100);
    });
    
    // Ensure total equals 100 by adjusting the largest value
    const newTotal = Object.values(normalizedValues).reduce((sum, val) => sum + val, 0);
    if (newTotal !== 100) {
      const difference = 100 - newTotal;
      const maxMaterial = Object.keys(normalizedValues).reduce((a, b) => 
        normalizedValues[a] > normalizedValues[b] ? a : b
      );
      normalizedValues[maxMaterial] += difference;
    }
    
    setMasterData(prev => ({
      ...prev,
      [division]: {
        ...prev[division],
        [productGroup]: normalizedValues
      }
    }));
  };

  // Handle selection
  const handleRepSelect = (rep) => {
    if (!editDefault && defaultReps.includes(rep)) return; // Can't deselect default in normal mode
    setSelectedReps(prev =>
      prev.includes(rep)
        ? prev.filter(r => r !== rep)
        : [...prev, rep]
    );
  };

  // Handle default selection in edit mode
  const handleDefaultToggle = (rep) => {
    setDefaultReps(prev =>
      prev.includes(rep)
        ? prev.filter(r => r !== rep)
        : [...prev, rep]
    );
    // Also update selectedReps to always include all defaults
    setSelectedReps(prev =>
      prev.includes(rep)
        ? prev.filter(r => r !== rep)
        : [...prev, rep]
    );
  };

  // Save config
  const handleSave = async () => {
    setSavingReps(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/sales-reps-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaults: defaultReps, selection: selectedReps })
      });
      const result = await res.json();
      if (result.success) {
        setSaveMsg('Saved!');
        setEditDefault(false);
      } else {
        setSaveMsg('Save failed');
      }
    } catch {
      setSaveMsg('Save failed');
    } finally {
      setSavingReps(false);
      setTimeout(() => setSaveMsg(''), 2000);
    }
  };

  if (loading) {
    return <div className="loading">Loading master data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="master-data-container">
      <div className="master-data-header">
        <h2>Master Data Management</h2>
        <p>Configure material percentages and manage country reference data</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          📊 Material Percentages
        </button>
        <button 
          className={`tab-button ${activeTab === 'countries' ? 'active' : ''}`}
          onClick={() => setActiveTab('countries')}
        >
          🌍 Country Reference
        </button>
        <button
          className={`tab-button ${activeTab === 'salesreps' ? 'active' : ''}`}
          onClick={() => setActiveTab('salesreps')}
        >
          🧑‍💼 Sales Rep Selection
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'materials' && (
          <div className="materials-tab">
            <div className="materials-header">
              <h3>Material Composition Percentages</h3>
              <p>Configure material composition percentages for each product group by division</p>
              <div className="master-data-actions">
                <button 
                  onClick={saveMasterData} 
                  disabled={saving}
                  className="save-button"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {saveMessage && <span className="save-message">{saveMessage}</span>}
              </div>
            </div>

            {Object.keys(masterData).map(division => (
              <div key={division} className="division-section">
                <h4 className="division-title">{division} Division</h4>
                
                <div className="table-container">
                  <table className="master-data-table">
                    <thead>
                      <tr>
                        <th className="product-group-header">Product Groups</th>
                        {materialColumns.map(material => (
                          <th key={material} className="material-header">{material}</th>
                        ))}
                        <th className="total-header">Total</th>
                        <th className="actions-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(masterData[division]).map(productGroup => (
                        <tr key={productGroup} className="product-row">
                          <td className="product-group-cell">{productGroup}</td>
                          {materialColumns.map(material => {
                            const value = masterData[division][productGroup][material] || 0;
                            return (
                              <td key={material} className="material-cell">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={value}
                                  onChange={(e) => handlePercentageChange(division, productGroup, material, e.target.value)}
                                  className="percentage-input"
                                />
                                <span className="percentage-symbol">%</span>
                              </td>
                            );
                          })}
                          <td className={`total-cell ${calculateRowTotal(division, productGroup) === 100 ? 'total-correct' : 'total-incorrect'}`}>
                            {calculateRowTotal(division, productGroup).toFixed(1)}%
                          </td>
                          <td className="actions-cell">
                            <button 
                              onClick={() => resetRow(division, productGroup)}
                              className="reset-button"
                              title="Reset to 0%"
                            >
                              Reset
                            </button>
                            <button 
                              onClick={() => normalizeRow(division, productGroup)}
                              className="normalize-button"
                              title="Normalize to 100%"
                            >
                              Normalize
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="totals-row">
                        <td className="footer-label">Averages</td>
                        {materialColumns.map(material => (
                          <td key={material} className="footer-total">
                            {calculateColumnTotal(material)}%
                          </td>
                        ))}
                        <td className="footer-total">-</td>
                        <td className="footer-actions">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}

            <div className="master-data-notes">
              <h4>Usage Notes:</h4>
              <ul>
                <li>Each row should total 100% for accurate material composition</li>
                <li>Use "Reset" to clear all percentages in a row to 0%</li>
                <li>Use "Normalize" to proportionally adjust percentages to total 100%</li>
                <li>Changes are saved automatically when you click "Save Changes"</li>
                <li>Red totals indicate rows that don't sum to 100%</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'countries' && (
          <CountryReference />
        )}

        {activeTab === 'salesreps' && (
          <div className="sales-reps-tab">
            <h3>Sales Rep Selection</h3>
            <div style={{ marginBottom: 12 }}>
              <button onClick={() => setEditDefault(e => !e)} className="edit-default-btn">
                {editDefault ? 'Finish Editing Defaults' : 'Edit Default'}
              </button>
              <button onClick={handleSave} className="save-reps-btn" disabled={savingReps} style={{ marginLeft: 8 }}>
                {savingReps ? 'Saving...' : 'Save'}
              </button>
              {saveMsg && <span className="save-msg">{saveMsg}</span>}
            </div>
            {loadingReps && <div>Loading sales reps...</div>}
            {errorReps && <div className="error">{errorReps}</div>}
            {!loadingReps && !errorReps && (
              <ul className="sales-rep-list">
                {salesReps.length === 0 && <li>No sales reps found.</li>}
                {salesReps.map(rep => (
                  <li key={rep} className="sales-rep-item">
                    <label style={{ fontWeight: defaultReps.includes(rep) ? 'bold' : 'normal' }}>
                      <input
                        type="checkbox"
                        checked={selectedReps.includes(rep)}
                        disabled={!editDefault && defaultReps.includes(rep)}
                        onChange={() => editDefault ? handleDefaultToggle(rep) : handleRepSelect(rep)}
                      />
                      <span className="sales-rep-name">
                        {rep} {defaultReps.includes(rep) && <span title="Default" style={{ color: '#f5b400' }}>★</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterData; 
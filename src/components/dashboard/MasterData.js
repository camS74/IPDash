import React, { useState, useEffect } from 'react';
import CountryReference from './CountryReference';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useSalesData } from '../../contexts/SalesDataContext';
import './MasterData.css';

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('materials');
  const [masterData, setMasterData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Get current division from ExcelDataContext
  const { selectedDivision } = useExcelData();
  
  // Get refresh function from SalesDataContext
  const { refreshSalesRepConfig } = useSalesData();
  
  // Get division code (FP, SB, TF, HCM) - handle both formats
  const getDivisionCode = (division) => {
    if (!division) return '';
    // If it's already just a division code (FP, SB, TF, HCM)
    if (['FP', 'SB', 'TF', 'HCM'].includes(division)) {
      return division;
    }
    // If it's a full sheet name (FP-Product Group), extract the division code
    return division.split('-')[0];
  };
  
  const divisionCode = getDivisionCode(selectedDivision);
  
  // Debug logging
  console.log('MasterData: selectedDivision =', selectedDivision);
  console.log('MasterData: divisionCode =', divisionCode);
  console.log('MasterData: activeTab =', activeTab);

  // Sales Rep Selection state
  const [salesReps, setSalesReps] = useState([]);
  const [selectedReps, setSelectedReps] = useState([]);
  const [defaultReps, setDefaultReps] = useState([]);
  const [editDefault, setEditDefault] = useState(false);
  const [loadingReps, setLoadingReps] = useState(false);
  const [errorReps, setErrorReps] = useState(null);
  const [savingReps, setSavingReps] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  
  // Sales Rep Groups state
  const [salesRepGroups, setSalesRepGroups] = useState({});
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupErrorMsg, setGroupErrorMsg] = useState('');
  const [editingGroup, setEditingGroup] = useState(false);
  const [originalGroupName, setOriginalGroupName] = useState('');

  // Material columns for the table
  const materialColumns = ['PE', 'BOPP', 'PET', 'Alu', 'Paper', 'PVC/PET'];

  // Load master data on component mount
  useEffect(() => {
    loadMasterData();
  }, []);

  // Load sales reps and defaults when division changes
  useEffect(() => {
    if (divisionCode) {
      setLoadingReps(true);
      setErrorReps('');
      
      const fetchSalesReps = async () => {
        try {
          if (divisionCode === 'FP') {
            // Fetch from PostgreSQL database for FP division
            const res = await fetch('http://localhost:3001/api/fp/sales-reps');
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setSalesReps(data.data || []);
          } else {
          // For other divisions, show "Coming Soon" message
          setSalesReps([]);
          setErrorReps('Sales representative configuration for this division is coming soon!');
          return;
        }
      } catch (error) {
        console.error('Error loading sales reps:', error);
        if (divisionCode === 'FP') {
          setErrorReps(`Failed to load sales representatives: ${error.message}`);
        } else {
          setErrorReps('Sales representative configuration for this division is coming soon!');
        }
        setSalesReps([]);
        }
      };
      
      const fetchDefaults = async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/sales-reps-defaults?division=${divisionCode}`);
          if (res.ok) {
            const data = await res.json();
            setDefaultReps(data.defaults || []);
            setSelectedReps(data.selection || []);
            setSalesRepGroups(data.groups || {});
          } else {
            // Initialize with empty defaults if endpoint doesn't exist
            setDefaultReps([]);
            setSelectedReps([]);
            setSalesRepGroups({});
          }
        } catch (error) {
          console.error('Error loading sales rep defaults:', error);
          // Initialize with empty defaults on error
          setDefaultReps([]);
          setSelectedReps([]);
          setSalesRepGroups({});
        }
      };
      
      fetchSalesReps();
      fetchDefaults();
      setLoadingReps(false);
    }
  }, [divisionCode]);

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
    // Simply toggle the selection status
    setSelectedReps(prev => {
      const currentReps = prev || [];
      return currentReps.includes(rep)
        ? currentReps.filter(r => r !== rep)
        : [...currentReps, rep];
    });
  };

  // Handle default selection in edit mode
  const handleDefaultToggle = (rep) => {
    // Update defaults list
    const currentDefaults = defaultReps || [];
    const newDefaults = currentDefaults.includes(rep)
      ? currentDefaults.filter(r => r !== rep)
      : [...currentDefaults, rep];
    
    setDefaultReps(newDefaults);
    
    // When adding to defaults, also add to selection if not already there
    const currentSelected = selectedReps || [];
    if (!currentDefaults.includes(rep) && !currentSelected.includes(rep)) {
      setSelectedReps(prev => [...(prev || []), rep]);
    }
    
    // When removing from defaults, don't remove from selection
    // (let the user decide if they want to keep it selected)
  };

  // Save config
  const handleSave = async () => {
    setSavingReps(true);
    setSaveMsg('');
    
    try {
      const res = await fetch('http://localhost:3001/api/sales-reps-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          division: divisionCode,
          defaults: defaultReps,
          selection: selectedReps,
          groups: salesRepGroups
        })
      });
      
      const result = await res.json();
      
      if (result.success) {
        setSaveMsg('✓ Saved');
        // Refresh the sales rep configuration in other components
        if (refreshSalesRepConfig) {
          await refreshSalesRepConfig();
        }
      } else {
        setSaveMsg('✗ Failed to save');
      }
    } catch (error) {
      console.error('Error saving sales rep config:', error);
      setSaveMsg('✗ Failed to save');
    } finally {
      setSavingReps(false);
      setTimeout(() => setSaveMsg(''), 2000);
    }
  };

  // Create or update a sales rep group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setGroupErrorMsg('Group name is required');
      return;
    }
    
    if (groupMembers.length === 0) {
      setGroupErrorMsg('Please select at least one sales representative');
      return;
    }
    
    setSavingGroup(true);
    setGroupErrorMsg('');
    
    try {
      const res = await fetch('/api/sales-rep-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          division: divisionCode,
          groupName: newGroupName,
          members: groupMembers,
          originalGroupName: editingGroup ? originalGroupName : undefined
        })
      });
      
      const result = await res.json();
      
      if (result.success) {
        // Update local state
        const updatedGroups = { ...salesRepGroups };
        
        // If editing and name changed, remove old group
        if (editingGroup && originalGroupName !== newGroupName && updatedGroups[originalGroupName]) {
          delete updatedGroups[originalGroupName];
        }
        
        updatedGroups[newGroupName] = [...groupMembers];
        setSalesRepGroups(updatedGroups);
        
        // Close modal and reset form
        setShowGroupModal(false);
        setNewGroupName('');
        setGroupMembers([]);
        setEditingGroup(false);
        setOriginalGroupName('');
        
        // Show success message briefly
        setSaveMsg(`✓ Group ${editingGroup ? 'updated' : 'created'} successfully`);
        setTimeout(() => setSaveMsg(''), 2000);
      } else {
        setGroupErrorMsg(result.message || `Failed to ${editingGroup ? 'update' : 'create'} group`);
      }
    } catch (error) {
      console.error(`Error ${editingGroup ? 'updating' : 'creating'} sales rep group:`, error);
      setGroupErrorMsg(`Failed to ${editingGroup ? 'update' : 'create'} group`);
    } finally {
      setSavingGroup(false);
    }
  };

  // Delete a sales rep group
  const handleDeleteGroup = async (groupName) => {
    if (!window.confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/sales-rep-groups?division=${divisionCode}&groupName=${encodeURIComponent(groupName)}`, {
        method: 'DELETE'
      });
      
      const result = await res.json();
      
      if (result.success) {
        // Update local state
        const updatedGroups = { ...salesRepGroups };
        delete updatedGroups[groupName];
        setSalesRepGroups(updatedGroups);
        
        // Show success message
        setSaveMsg('✓ Group deleted successfully');
        setTimeout(() => setSaveMsg(''), 2000);
      } else {
        window.alert(result.message || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting sales rep group:', error);
      window.alert('Failed to delete group');
    }
  };
  
  // Add a group to the selected reps
  const handleAddGroupToSelection = (groupName) => {
    const groupMembers = salesRepGroups[groupName] || [];
    
    // Add all group members to selected reps if they're not already there
    const updatedSelection = [...selectedReps];
    
    groupMembers.forEach(member => {
      if (!updatedSelection.includes(member)) {
        updatedSelection.push(member);
      }
    });
    
    setSelectedReps(updatedSelection);
  };
  
  // Toggle a sales rep for group creation
  const handleGroupMemberToggle = (rep) => {
    setGroupMembers(prev => 
      prev.includes(rep) 
        ? prev.filter(member => member !== rep) 
        : [...prev, rep]
    );
  };

  // Helper function to convert text to proper case
  const toProperCase = (text) => {
    if (!text) return '';
    return text.toString().replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  // Render sales rep items with proper case
  const renderSalesRepItem = (rep) => {
    const normalizedRep = toProperCase(rep);
    const isSelected = selectedReps && selectedReps.includes(rep);
    
    return (
      <li key={rep} className={isSelected ? 'selected' : ''}>
        <label>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleRepSelect(rep)}
          />
          {normalizedRep}
        </label>
      </li>
    );
  };

  // Helper to chunk array into columns of 10 rows each
  function chunkArray(array, chunkSize) {
    const results = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      results.push(array.slice(i, i + chunkSize));
    }
    return results;
  }

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
            {divisionCode ? (
              <>
                <h3>{divisionCode}-Sales Representatives</h3>
                <div style={{ marginBottom: 12 }}>
                  <button onClick={handleSave} className="save-reps-btn" disabled={savingReps}>
                    {savingReps ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setShowGroupModal(true)} 
                    className="create-group-btn"
                    style={{ marginLeft: '10px' }}
                  >
                    Create Group
                  </button>
                  {saveMsg && <span className="save-msg">{saveMsg}</span>}
                </div>
                {loadingReps && <div>Loading sales reps...</div>}
                {errorReps && <div className="error">{errorReps}</div>}
                {!loadingReps && !errorReps && (
                  <>
                    {(!salesReps || salesReps.length === 0) ? (
                      <div className="no-sales-reps-message">
                        <p><strong>List not available</strong></p>
                        <p>No sales representatives are configured for {divisionCode} division.</p>
                        <p>Please configure sales representatives data for this division.</p>
                      </div>
                    ) : (
                      <>
                        {/* Sales Rep Groups Section */}
                        {Object.keys(salesRepGroups).length > 0 && (
                          <div className="sales-rep-groups-section">
                            <h4>Sales Rep Groups</h4>
                            <div className="sales-rep-groups-list">
                              {Object.entries(salesRepGroups).map(([groupName, members]) => (
                                <div key={groupName} className="sales-rep-group-item">
                                  <div className="group-header">
                                    <span className="group-name">{groupName}</span>
                                    <span className="group-count">({members.length} members)</span>
                                    <div className="group-actions">
                                      <button 
                                        onClick={() => handleAddGroupToSelection(groupName)}
                                        className="add-group-btn"
                                        title="Add all group members to selection"
                                      >
                                        Add to Selection
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setNewGroupName(groupName);
                                          setGroupMembers([...members]);
                                          setEditingGroup(true);
                                          setOriginalGroupName(groupName);
                                          setShowGroupModal(true);
                                        }}
                                        className="edit-group-btn"
                                        title="Edit this group"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteGroup(groupName)}
                                        className="delete-group-btn"
                                        title="Delete this group"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                  <div className="group-members">
                                    {members.map(member => (
                                      <span key={member} className="group-member-name">
                                        {toProperCase(member)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Individual Sales Reps Section */}
                        <div className="sales-rep-list-grid">
                          {chunkArray(salesReps, 10).map((col, colIdx) => (
                            <ul className="sales-rep-list-col" key={colIdx}>
                              {col.map(renderSalesRepItem)}
                            </ul>
                          ))}
                        </div>
                      </>
                    )}
                    
                    {/* Create/Edit Group Modal */}
                                    {showGroupModal && (
                                      <div className="modal-overlay">
                                        <div className="modal-content">
                                          <div className="modal-header">
                                            <h3>{editingGroup ? 'Edit Sales Rep Group' : 'Create Sales Rep Group'}</h3>
                                            <button 
                                              onClick={() => {
                                                setShowGroupModal(false);
                                                setNewGroupName('');
                                                setGroupMembers([]);
                                                setGroupErrorMsg('');
                                                setEditingGroup(false);
                                                setOriginalGroupName('');
                                              }}
                                              className="close-modal-btn"
                                            >
                                              &times;
                                            </button>
                                          </div>
                                          <div className="modal-body">
                                            <div className="form-group">
                                              <label htmlFor="groupName">Group Name:</label>
                                              <input
                                                type="text"
                                                id="groupName"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                placeholder="Enter group name"
                                              />
                                            </div>
                                            
                                            <div className="form-group">
                                              <label>Select Group Members:</label>
                                              <div className="group-members-selection">
                                                {salesReps.map(rep => (
                                                  <div key={rep} className="group-member-checkbox">
                                                    <label>
                                                      <input
                                                        type="checkbox"
                                                        checked={groupMembers.includes(rep)}
                                                        onChange={() => handleGroupMemberToggle(rep)}
                                                      />
                                                      {toProperCase(rep)}
                                                    </label>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                            
                                            {groupErrorMsg && <div className="error-message">{groupErrorMsg}</div>}
                                            
                                            <div className="modal-actions">
                                              <button 
                                                onClick={handleCreateGroup}
                                                disabled={savingGroup}
                                                className="create-group-submit-btn"
                                              >
                                                {savingGroup 
                                                  ? (editingGroup ? 'Updating...' : 'Creating...') 
                                                  : (editingGroup ? 'Update Group' : 'Create Group')}
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  setShowGroupModal(false);
                                                  setNewGroupName('');
                                                  setGroupMembers([]);
                                                  setGroupErrorMsg('');
                                                  setEditingGroup(false);
                                                  setOriginalGroupName('');
                                                }}
                                                className="cancel-btn"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                  </>
                )}
              </>
            ) : (
              <div className="no-division-message">
                <p>Please select a division to view and configure sales representatives.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterData;
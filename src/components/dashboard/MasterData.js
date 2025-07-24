import React, { useState, useEffect } from 'react';
import { useExcelData } from '../../contexts/ExcelDataContext';
import './MasterData.css';

const MasterData = () => {
  const { selectedDivision } = useExcelData();
  const [activeTab, setActiveTab] = useState('materials');
  const [saveMessage, setSaveMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');

  // Sales Rep Management State
  const [availableReps, setAvailableReps] = useState([]);
  const [selectedReps, setSelectedReps] = useState([]);
  const [salesRepGroups, setSalesRepGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    members: [],
    isEditing: false,
    originalName: ''
  });

  // Material Percentages State (existing)
  const [masterData, setMasterData] = useState({
    'FP': {
      'Laminates': { PE: 45, BOPP: 25, PET: 20, Alu: 5, Paper: 5, 'PVC/PET': 0 },
      'Films': { PE: 60, BOPP: 30, PET: 10, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Bags': { PE: 70, BOPP: 20, PET: 0, Alu: 0, Paper: 10, 'PVC/PET': 0 },
      'Pouches': { PE: 40, BOPP: 30, PET: 15, Alu: 10, Paper: 5, 'PVC/PET': 0 }
    },
    'SB': {
      'Stretch Films': { PE: 90, BOPP: 5, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 5 },
      'Shrink Films': { PE: 85, BOPP: 10, PET: 5, Alu: 0, Paper: 0, 'PVC/PET': 0 },
      'Agricultural Films': { PE: 95, BOPP: 0, PET: 0, Alu: 0, Paper: 0, 'PVC/PET': 5 }
    },
    'TF': {
      'Technical Films': { PE: 30, BOPP: 20, PET: 40, Alu: 5, Paper: 0, 'PVC/PET': 5 },
      'Barrier Films': { PE: 35, BOPP: 15, PET: 25, Alu: 20, Paper: 0, 'PVC/PET': 5 },
      'Specialty Films': { PE: 25, BOPP: 25, PET: 30, Alu: 15, Paper: 0, 'PVC/PET': 5 }
    },
    'HCM': {
      'Hygiene Films': { PE: 80, BOPP: 10, PET: 5, Alu: 0, Paper: 5, 'PVC/PET': 0 },
      'Medical Films': { PE: 40, BOPP: 20, PET: 30, Alu: 5, Paper: 0, 'PVC/PET': 5 },
      'Pharmaceutical': { PE: 35, BOPP: 25, PET: 25, Alu: 10, Paper: 0, 'PVC/PET': 5 }
    }
  });

  const materialColumns = ['PE', 'BOPP', 'PET', 'Alu', 'Paper', 'PVC/PET'];

  const divisionInfo = {
    'FP': { name: 'Flexible Packaging', description: 'Laminates, Films, Bags & Pouches', database: 'fp_data' },
    'SB': { name: 'Stretch & Barrier', description: 'Stretch, Shrink & Agricultural Films', database: 'sb_data' },
    'TF': { name: 'Technical Films', description: 'Technical, Barrier & Specialty Films', database: 'tf_data' },
    'HCM': { name: 'Healthcare & Medical', description: 'Hygiene, Medical & Pharmaceutical', database: 'hcm_data' }
  };

  // Load sales rep data when division changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedDivision && activeTab === 'test2') {
      loadSalesRepData();
    }
  }, [selectedDivision, activeTab]);

  const loadSalesRepData = async () => {
    if (!selectedDivision) return;
    
    setLoading(true);
    try {
      let reps = [];
      
      if (selectedDivision === 'FP') {
        // For FP, use PostgreSQL fp_data table
        const response = await fetch('http://localhost:3001/api/fp/sales-reps-from-db');
        if (response.ok) {
      const result = await response.json();
          reps = result.data || [];
        }
      } else {
        // For SB/TF/HCM, will connect to their respective PostgreSQL databases later
        // For now, use placeholder data to demonstrate the concept
        reps = getPlaceholderRepsForDivision(selectedDivision);
        setTestMessage(`📝 Note: ${selectedDivision} will connect to ${divisionInfo[selectedDivision]?.database} PostgreSQL table (not implemented yet)`);
      }
      
      setAvailableReps(reps);
      
      // Load current configuration
      const configResponse = await fetch(`http://localhost:3001/api/sales-reps-defaults?division=${selectedDivision}`);
      if (configResponse.ok) {
        const configResult = await configResponse.json();
        if (configResult.success) {
          setSelectedReps(configResult.selection || []);
          setSalesRepGroups(configResult.groups || {});
        }
      }
      
    } catch (error) {
      console.error('Error loading sales rep data:', error);
      setTestMessage('❌ Error loading sales rep data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholderRepsForDivision = (division) => {
    // Placeholder data for each division - will be replaced with PostgreSQL queries later
    const placeholderData = {
      'SB': [
        'Ahmed Al-Rashid',
        'Maria Santos',
        'David Chen',
        'Sarah Johnson',
        'Mohammed Hassan',
        'Lisa Rodriguez',
        'James Wilson'
      ],
      'TF': [
        'Yuki Tanaka',
        'Hans Mueller',
        'Priya Sharma',
        'Roberto Silva',
        'Anna Kowalski',
        'Zhang Wei',
        'Elena Petrov'
      ],
      'HCM': [
        'Dr. Michael Brown',
        'Fatima Al-Zahra',
        'Thomas Anderson',
        'Raj Patel',
        'Sophie Martin',
        'Carlos Mendez',
        'Aisha Okafor'
      ]
    };
    
    return placeholderData[division] || [];
  };

  const filteredAvailableReps = availableReps.filter(rep =>
    rep.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedReps.includes(rep) &&
    !Object.values(salesRepGroups).flat().includes(rep)
  );

  const addToSelection = (rep) => {
    if (!selectedReps.includes(rep)) {
      setSelectedReps([...selectedReps, rep]);
    }
  };

  const removeFromSelection = (rep) => {
    setSelectedReps(selectedReps.filter(r => r !== rep));
  };

  const saveRepConfiguration = async () => {
    if (!selectedDivision) return;
    
    setLoading(true);
    setSaveMessage('⏳ Saving...');
    
    try {
      const response = await fetch('http://localhost:3001/api/sales-reps-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          division: selectedDivision,
          defaults: [],
          selection: selectedReps,
          groups: salesRepGroups
        })
      });
      
      if (response.ok) {
        setSaveMessage('✅ Configuration saved!');
        setTestMessage(`✅ Sales rep configuration saved for ${selectedDivision} division`);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      setSaveMessage('❌ Save failed');
      setTestMessage('❌ Error saving configuration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!groupFormData.name || groupFormData.members.length === 0) {
      setTestMessage('❌ Group name and members are required');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/sales-rep-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          division: selectedDivision,
          groupName: groupFormData.name,
          members: groupFormData.members,
          originalGroupName: groupFormData.isEditing ? groupFormData.originalName : undefined
        })
      });
      
      if (response.ok) {
        // Update local state
        const newGroups = { ...salesRepGroups };
        if (groupFormData.isEditing && groupFormData.originalName !== groupFormData.name) {
          delete newGroups[groupFormData.originalName];
        }
        newGroups[groupFormData.name] = groupFormData.members;
        setSalesRepGroups(newGroups);
        
        // Reset form
        setGroupFormData({ name: '', members: [], isEditing: false, originalName: '' });
        setTestMessage(`✅ Group "${groupFormData.name}" ${groupFormData.isEditing ? 'updated' : 'created'} successfully`);
      } else {
        throw new Error('Failed to save group');
      }
    } catch (error) {
      setTestMessage('❌ Error saving group: ' + error.message);
    }
  };

  const editGroup = (groupName) => {
    setGroupFormData({
      name: groupName,
      members: [...salesRepGroups[groupName]],
      isEditing: true,
      originalName: groupName
    });
  };

  const deleteGroup = async (groupName) => {
    if (!window.confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/sales-rep-groups?division=${selectedDivision}&groupName=${encodeURIComponent(groupName)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const newGroups = { ...salesRepGroups };
        delete newGroups[groupName];
        setSalesRepGroups(newGroups);
        setTestMessage(`✅ Group "${groupName}" deleted successfully`);
      } else {
        throw new Error('Failed to delete group');
      }
    } catch (error) {
      setTestMessage('❌ Error deleting group: ' + error.message);
    }
  };

  // Material percentage functions (existing)
  const handlePercentageChange = (division, productGroup, material, value) => {
    const numValue = Math.max(0, Math.min(100, parseFloat(value) || 0));
    
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
    const productData = masterData[division]?.[productGroup] || {};
    return materialColumns.reduce((sum, material) => sum + (productData[material] || 0), 0);
  };

  const saveMasterData = async () => {
    setSaveMessage('⏳ Saving...');
    
    setTimeout(() => {
      setSaveMessage('✅ Saved successfully!');
      setTestMessage('✅ Material percentages saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 1000);
  };

  const handleTestButton3 = () => {
    setTestMessage('🔄 Button 3 clicked - Country Reference management');
    alert('PLACEHOLDER: Country Reference - Future implementation for geographic groupings');
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ background: 'white', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
        <h2>Master Data Management</h2>
        <p>Manage material percentages, sales rep configurations, and country references</p>
        {testMessage && (
          <div style={{
            background: '#e3f2fd',
            border: '1px solid #2196f3',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '4px',
            color: '#1976d2'
          }}>
            <strong>Status:</strong> {testMessage}
      </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button 
          style={{
            padding: '15px 25px',
            backgroundColor: activeTab === 'materials' ? '#007bff' : 'white',
            color: activeTab === 'materials' ? 'white' : '#007bff',
            border: '2px solid #007bff',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('materials')}
        >
          📊 Material Percentages
        </button>
        <button 
          style={{
            padding: '15px 25px',
            backgroundColor: activeTab === 'test2' ? '#007bff' : 'white',
            color: activeTab === 'test2' ? 'white' : '#007bff',
            border: '2px solid #007bff',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('test2')}
        >
          🧑‍💼 Sales Rep Selection
        </button>
        <button
          style={{
            padding: '15px 25px',
            backgroundColor: activeTab === 'test3' ? '#007bff' : 'white',
            color: activeTab === 'test3' ? 'white' : '#007bff',
            border: '2px solid #007bff',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('test3')}
        >
          🌍 Country Reference
        </button>
      </div>

      {/* Tab 1: Material Percentages */}
        {activeTab === 'materials' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3>Material Percentages by Product Group</h3>
            <p>Configure the material composition percentages for the selected division: <strong>{selectedDivision || 'No division selected'}</strong></p>
            
            {!selectedDivision && (
              <div style={{ 
                background: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                padding: '15px', 
                borderRadius: '8px',
                color: '#856404',
                marginBottom: '20px'
              }}>
                <strong>⚠️ No Division Selected</strong><br/>
                Please select a division from the main dashboard's division selector to view and edit material percentages.
              </div>
            )}

                <button 
                  onClick={saveMasterData} 
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginRight: '15px',
                opacity: selectedDivision ? 1 : 0.5
              }}
              disabled={!selectedDivision}
            >
              💾 Save All Changes
                </button>
            {saveMessage && (
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                {saveMessage}
              </span>
            )}
              </div>

          {selectedDivision && masterData[selectedDivision] && (
            <div style={{ 
              backgroundColor: 'white', 
              border: '3px solid #007bff', 
              marginBottom: '30px',
              borderRadius: '8px',
              overflow: 'visible'
            }}>
              <h3 style={{ 
                backgroundColor: '#007bff', 
                color: 'white', 
                margin: '0', 
                padding: '15px 20px',
                borderRadius: '5px 5px 0 0'
              }}>
                {selectedDivision} - {divisionInfo[selectedDivision]?.name || selectedDivision} ({Object.keys(masterData[selectedDivision]).length} Products)
              </h3>
              
              <div style={{ padding: '20px', overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                  border: '2px solid #dee2e6'
                }}>
                    <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Product Group</th>
                        {materialColumns.map(material => (
                        <th key={material} style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>{material}</th>
                        ))}
                      <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>Total</th>
                      <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                    {Object.entries(masterData[selectedDivision]).map(([productGroup, materials], prodIndex) => {
                      const rowTotal = calculateRowTotal(selectedDivision, productGroup);
                      const isCorrectTotal = Math.abs(rowTotal - 100) < 0.1;
                      
                                return (
                        <tr key={productGroup} style={{ 
                          backgroundColor: prodIndex % 2 === 0 ? '#f8f9fa' : 'white'
                        }}>
                          <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                            {productGroup}
                          </td>
                          {materialColumns.map(material => (
                            <td key={material} style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                value={materials[material] || 0}
                                onChange={(e) => handlePercentageChange(selectedDivision, productGroup, material, e.target.value)}
                                style={{ 
                                  width: '60px', 
                                  padding: '4px', 
                                  border: '2px solid #007bff',
                                  borderRadius: '4px',
                                  textAlign: 'center'
                                }}
                              />
                              <span style={{ marginLeft: '4px', color: '#6c757d' }}>%</span>
                                  </td>
                          ))}
                          <td style={{ 
                            padding: '12px', 
                            border: '1px solid #dee2e6', 
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: isCorrectTotal ? '#28a745' : '#dc3545',
                            backgroundColor: isCorrectTotal ? '#d4edda' : '#f8d7da'
                          }}>
                            {rowTotal.toFixed(1)}%
                              </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                <button 
                              onClick={() => {
                                setMasterData(prev => ({
                                  ...prev,
                                  [selectedDivision]: {
                                    ...prev[selectedDivision],
                                    [productGroup]: materialColumns.reduce((acc, material) => ({
                                      ...acc,
                                      [material]: 0
                                    }), {})
                                  }
                                }));
                              }}
                              style={{
                                padding: '4px 8px',
                                margin: '2px',
                                border: '1px solid #dc3545',
                                backgroundColor: 'white',
                                color: '#dc3545',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                                >
                                  Reset
                                </button>
                                <button 
                              onClick={() => {
                                const currentTotal = calculateRowTotal(selectedDivision, productGroup);
                                if (currentTotal === 0) return;

                                const productData = masterData[selectedDivision][productGroup];
                                const normalizedData = {};
                                
                                materialColumns.forEach(material => {
                                  const currentValue = productData[material] || 0;
                                  normalizedData[material] = Math.round((currentValue / currentTotal) * 100 * 10) / 10;
                                });

                                setMasterData(prev => ({
                                  ...prev,
                                  [selectedDivision]: {
                                    ...prev[selectedDivision],
                                    [productGroup]: normalizedData
                                  }
                                }));
                              }}
                              style={{
                                padding: '4px 8px',
                                margin: '2px',
                                border: '1px solid #007bff',
                                backgroundColor: 'white',
                                color: '#007bff',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              100%
                                </button>
                              </td>
                            </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
            </div>
      )}

      {/* Tab 2: Sales Rep Selection */}
      {activeTab === 'test2' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>🧑‍💼 Sales Rep Selection for {selectedDivision || 'No Division Selected'}</h3>
          
          {!selectedDivision && (
            <div style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              padding: '15px', 
              borderRadius: '8px',
              color: '#856404',
              marginBottom: '20px'
            }}>
              <strong>⚠️ No Division Selected</strong><br/>
              Please select a division from the main dashboard's division selector to manage sales representatives.
          </div>
        )}

          {selectedDivision && (
            <>
              {/* Data Source Information */}
              <div style={{ 
                background: selectedDivision === 'FP' ? '#d4edda' : '#fff3cd', 
                border: selectedDivision === 'FP' ? '1px solid #c3e6cb' : '1px solid #ffeaa7', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <strong>📊 Data Source:</strong> {divisionInfo[selectedDivision]?.database || 'unknown'} PostgreSQL table
                {selectedDivision === 'FP' ? (
                  <span style={{ color: '#155724' }}> ✅ Connected and Active</span>
                ) : (
                  <span style={{ color: '#856404' }}> ⏳ Will be implemented later (using placeholder data)</span>
                )}
              </div>

              {loading && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#007bff' }}>
                  ⏳ Loading sales representatives...
                </div>
              )}

              {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  {/* Available Sales Reps */}
                  <div style={{ border: '2px solid #17a2b8', borderRadius: '8px', padding: '15px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#17a2b8' }}>
                      Available Sales Reps ({availableReps.length})
                      {selectedDivision !== 'FP' && <span style={{ fontSize: '12px', color: '#6c757d' }}> (placeholder)</span>}
                    </h4>
                    
                    <input
                      type="text"
                      placeholder="Search representatives..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        marginBottom: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                    
                    <div style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '10px'
                    }}>
                      {filteredAvailableReps.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                          {searchTerm ? 'No matching representatives found' : 'All representatives are selected or in groups'}
                        </div>
                      ) : (
                        filteredAvailableReps.map(rep => (
                          <div
                            key={rep}
                            style={{
                              padding: '8px',
                              margin: '5px 0',
                              backgroundColor: '#f8f9fa',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onClick={() => addToSelection(rep)}
                          >
                            <span>{rep}</span>
                  <button 
                              style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            >
                              Add →
                  </button>
                </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Selected Sales Reps */}
                  <div style={{ border: '2px solid #28a745', borderRadius: '8px', padding: '15px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#28a745' }}>
                      Selected Sales Reps ({selectedReps.length})
                    </h4>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <h5 style={{ color: '#495057', marginBottom: '10px' }}>Individual Representatives:</h5>
                      <div style={{ 
                        maxHeight: '150px', 
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '10px'
                      }}>
                        {selectedReps.length === 0 ? (
                          <div style={{ textAlign: 'center', color: '#666', padding: '10px' }}>
                            No representatives selected
                      </div>
                    ) : (
                          selectedReps.map(rep => (
                            <div
                              key={rep}
                              style={{
                                padding: '8px',
                                margin: '5px 0',
                                backgroundColor: '#d4edda',
                                border: '1px solid #c3e6cb',
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <span>{rep}</span>
                                      <button 
                                onClick={() => removeFromSelection(rep)}
                                style={{
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}
                              >
                                Remove
                                      </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ color: '#495057', marginBottom: '10px' }}>Groups:</h5>
                      <div style={{ 
                        maxHeight: '120px', 
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '10px'
                      }}>
                        {Object.keys(salesRepGroups).length === 0 ? (
                          <div style={{ textAlign: 'center', color: '#666', padding: '10px' }}>
                            No groups created
                          </div>
                        ) : (
                          Object.entries(salesRepGroups).map(([groupName, members]) => (
                            <div
                              key={groupName}
                              style={{
                                padding: '8px',
                                margin: '5px 0',
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '4px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                <strong>📁 {groupName}</strong>
                                <div>
                                      <button 
                                    onClick={() => editGroup(groupName)}
                                    style={{
                                      background: '#17a2b8',
                                      color: 'white',
                                      border: 'none',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      marginRight: '5px'
                                    }}
                                      >
                                        Edit
                                      </button>
                                      <button 
                                    onClick={() => deleteGroup(groupName)}
                                    style={{
                                      background: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '10px'
                                    }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                              <div style={{ fontSize: '12px', color: '#666', marginLeft: '15px' }}>
                                {members.join(', ')}
                                  </div>
                                </div>
                          ))
                        )}
                            </div>
                          </div>
                        </div>
                          </div>
              )}

              {/* Group Creation Form */}
              {!loading && (
                <div style={{ border: '2px solid #ffc107', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#856404' }}>
                    {groupFormData.isEditing ? '✏️ Edit Group' : '➕ Create New Group'}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '15px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Group Name:</label>
                              <input
                                type="text"
                        value={groupFormData.name}
                        onChange={(e) => setGroupFormData({...groupFormData, name: e.target.value})}
                        placeholder="Enter group name..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                              />
                            </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Members:</label>
                      <select
                        multiple
                        value={groupFormData.members}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setGroupFormData({...groupFormData, members: selected});
                        }}
                        style={{
                          width: '100%',
                          height: '80px',
                          padding: '5px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      >
                        {availableReps.filter(rep => !selectedReps.includes(rep) && !Object.values(salesRepGroups).flat().includes(rep))
                                    .map(rep => (
                          <option key={rep} value={rep}>{rep}</option>
                        ))}
                        {groupFormData.isEditing && groupFormData.members.map(member => (
                          <option key={member} value={member} selected>{member}</option>
                        ))}
                      </select>
                      <small style={{ color: '#666' }}>Hold Ctrl/Cmd to select multiple</small>
                              </div>
                    
                    <div>
                              <button 
                        onClick={createGroup}
                        disabled={!groupFormData.name || groupFormData.members.length === 0}
                        style={{
                          background: groupFormData.isEditing ? '#17a2b8' : '#ffc107',
                          color: groupFormData.isEditing ? 'white' : '#212529',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: groupFormData.name && groupFormData.members.length > 0 ? 'pointer' : 'not-allowed',
                          opacity: groupFormData.name && groupFormData.members.length > 0 ? 1 : 0.5
                        }}
                      >
                        {groupFormData.isEditing ? '💾 Update Group' : '➕ Create Group'}
                              </button>
                      
                      {groupFormData.isEditing && (
                              <button 
                          onClick={() => setGroupFormData({ name: '', members: [], isEditing: false, originalName: '' })}
                          style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            marginLeft: '10px',
                            cursor: 'pointer'
                          }}
                              >
                                Cancel
                              </button>
                      )}
                            </div>
                          </div>
                        </div>
              )}

              {/* Actions */}
              {!loading && (
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button 
                    onClick={saveRepConfiguration}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    💾 Save Configuration
                  </button>
                  
                  <button 
                    onClick={() => loadSalesRepData()}
                    style={{
                      background: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Refresh Data
                  </button>
                  
                  <button 
                    onClick={() => {
                      setSelectedReps([]);
                      setSalesRepGroups({});
                      setTestMessage('🔄 Configuration reset');
                    }}
                    style={{
                      background: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Reset All
                  </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

      {/* Tab 3: Country Reference */}
      {activeTab === 'test3' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '2px solid #ffc107' }}>
          <h3>🌍 Country Reference</h3>
          <p>Manage country groupings and regional classifications</p>
          
          <button 
            onClick={handleTestButton3}
            style={{
              background: '#ffc107',
              color: '#212529',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 Create Group
          </button>

          <div style={{ background: '#f8f9fa', padding: '15px', marginTop: '15px', borderRadius: '4px' }}>
            <p><strong>This section will contain:</strong></p>
            <ul>
              <li>Country to region mapping</li>
              <li>Custom regional groupings</li>
              <li>Geographic classification management</li>
            </ul>
          </div>
          </div>
        )}
    </div>
  );
};

export default MasterData;
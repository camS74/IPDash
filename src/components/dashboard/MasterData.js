import React, { useState, useEffect } from 'react';
import CountryReference from './CountryReference';
import { useExcelData } from '../../contexts/ExcelDataContext';
import { useSalesData } from '../../contexts/SalesDataContext';
import './MasterData.css';

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('materials');
  const [mergedCustomers, setMergedCustomers] = useState([]);
  const [loadingMergedCustomers, setLoadingMergedCustomers] = useState(false);
  const [masterData, setMasterData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Centralized Customer Merging State
  const [possibleMerges, setPossibleMerges] = useState([]);
  const [selectedPossibleMerges, setSelectedPossibleMerges] = useState(new Set());
  const [selectedCustomersInPossibleGroup, setSelectedCustomersInPossibleGroup] = useState({});
  const [rejectedMerges, setRejectedMerges] = useState([]);

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

  // Load merged customers when division changes
  useEffect(() => {
    if (divisionCode) {
      loadMergedCustomers();
    }
  }, [divisionCode]);

  const loadMergedCustomers = async () => {
    try {
      setLoadingMergedCustomers(true);
      const response = await fetch('/api/confirmed-merges');
      const result = await response.json();
      
      if (result.success) {
        setMergedCustomers(result.data || []);
      } else {
        console.error('Failed to load merged customers:', result.message);
        setMergedCustomers([]);
      }
    } catch (error) {
      console.error('Error loading merged customers:', error);
      setMergedCustomers([]);
    } finally {
      setLoadingMergedCustomers(false);
    }
  };

  // Load all possible customer merges for the division
  const loadAllPossibleMerges = async () => {
    try {
      setLoadingMergedCustomers(true);
      
      // First load confirmed merges
      await loadMergedCustomers();
      
      // Then fetch all customers for the division and find possible merges
      const response = await fetch(`/api/fp/all-customers?division=${divisionCode}`);
      const result = await response.json();
      
      if (result.success) {
        const allCustomers = result.data || [];
        const possibleMerges = findPossibleCustomerMerges(allCustomers);
        setPossibleMerges(possibleMerges);
      } else {
        console.error('Failed to load all customers:', result.message);
        setPossibleMerges([]);
      }
    } catch (error) {
      console.error('Error loading possible merges:', error);
      setPossibleMerges([]);
    } finally {
      setLoadingMergedCustomers(false);
    }
  };

  // Helper function to calculate similarity between two customer names
  const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (s1 === s2) return 1.0;
    
    // Check if shorter name is contained within longer name
    const shorter = s1.length <= s2.length ? s1 : s2;
    const longer = s1.length <= s2.length ? s2 : s1;
    const isContained = longer.includes(shorter);
    
    if (isContained && shorter.length >= 4) {
      return 0.9; // High similarity for contained names
    }
    
    // Calculate Levenshtein distance
    const matrix = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1
          );
        }
      }
    }
    
    const distance = matrix[s1.length][s2.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLength);
  };

  // Find all possible customer merges
  const findPossibleCustomerMerges = (customers) => {
    const groups = [];
    const processed = new Set();
    const confirmedCustomerNames = new Set();
    
    // Add all confirmed customers to the set
    mergedCustomers.forEach(group => {
      group.forEach(customer => confirmedCustomerNames.add(customer));
    });

    customers.forEach(customer => {
      if (processed.has(customer) || confirmedCustomerNames.has(customer)) return;

      const group = [customer];
      const similarities = [100]; // First customer has 100% similarity with itself
      processed.add(customer);

      // Find similar customer names
      customers.forEach(otherCustomer => {
        if (processed.has(otherCustomer) || confirmedCustomerNames.has(otherCustomer)) return;

        // Skip if this pair was previously rejected
        if (rejectedMerges.some(pair => pair.includes(customer) && pair.includes(otherCustomer))) return;

        const similarity = calculateSimilarity(customer, otherCustomer);
        
        // Smart grouping rules
        const s1 = customer.toLowerCase().replace(/[^a-z0-9]/g, '');
        const s2 = otherCustomer.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const shorter = s1.length <= s2.length ? s1 : s2;
        const longer = s1.length <= s2.length ? s2 : s1;
        const isContained = longer.includes(shorter);
        
        const shouldGroup = (
          similarity > 0.8 || // High similarity
          (isContained && shorter.length >= 4) || // Shorter name contained in longer name
          (similarity > 0.6 && s1.length >= 8 && s2.length >= 8) // Medium similarity for longer names
        );
        
        if (shouldGroup) {
          group.push(otherCustomer);
          similarities.push(Math.round(similarity * 100));
          processed.add(otherCustomer);
        }
      });

      // Only add groups with more than one customer
      if (group.length > 1) {
        groups.push({
          members: group,
          similarities: similarities,
          totalMembers: group.length
        });
      }
    });

    return groups;
  };

  // Handler for selecting/deselecting a possible merge group
  const handlePossibleGroupSelection = (groupIndex) => {
    setSelectedPossibleMerges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupIndex)) {
        newSet.delete(groupIndex);
        // Also clear individual selections for this group
        setSelectedCustomersInPossibleGroup(prevCustomers => {
          const newCustomers = { ...prevCustomers };
          delete newCustomers[groupIndex];
          return newCustomers;
        });
      } else {
        newSet.add(groupIndex);
        // Select all customers in this group
        const group = possibleMerges[groupIndex];
        setSelectedCustomersInPossibleGroup(prevCustomers => ({
          ...prevCustomers,
          [groupIndex]: new Set(group.members)
        }));
      }
      return newSet;
    });
  };

  // Handler for selecting/deselecting customers within a possible group
  const handleCustomerSelectionInPossibleGroup = (groupIndex, customerName) => {
    setSelectedCustomersInPossibleGroup(prev => {
      const newState = { ...prev };
      if (!newState[groupIndex]) {
        newState[groupIndex] = new Set();
      }
      
      const groupSet = new Set(newState[groupIndex]);
      if (groupSet.has(customerName)) {
        groupSet.delete(customerName);
      } else {
        groupSet.add(customerName);
      }
      
      newState[groupIndex] = groupSet;
      return newState;
    });
  };

  // Handler for selecting all possible merges
  const handleSelectAllPossible = () => {
    const allIndices = possibleMerges.map((_, index) => index);
    setSelectedPossibleMerges(new Set(allIndices));
    
    // Select all customers in all groups
    const allCustomers = {};
    possibleMerges.forEach((group, index) => {
      allCustomers[index] = new Set(group.members);
    });
    setSelectedCustomersInPossibleGroup(allCustomers);
  };

  // Handler for deselecting all possible merges
  const handleDeselectAllPossible = () => {
    setSelectedPossibleMerges(new Set());
    setSelectedCustomersInPossibleGroup({});
  };

  // Handler for approving an entire group
  const handleApproveGroup = async (groupIndex) => {
    const group = possibleMerges[groupIndex];
    await approveCustomerMerge(group.members);
    
    // Remove from possible merges
    setPossibleMerges(prev => prev.filter((_, index) => index !== groupIndex));
    
    // Clear selections
    setSelectedPossibleMerges(prev => {
      const newSet = new Set(prev);
      newSet.delete(groupIndex);
      return newSet;
    });
    setSelectedCustomersInPossibleGroup(prev => {
      const newState = { ...prev };
      delete newState[groupIndex];
      return newState;
    });
  };

  // Handler for rejecting an entire group
  const handleRejectGroup = async (groupIndex) => {
    const group = possibleMerges[groupIndex];
    
    // Add all pairs to rejected merges
    const newRejectedMerges = [...rejectedMerges];
    for (let i = 0; i < group.members.length; i++) {
      for (let j = i + 1; j < group.members.length; j++) {
        newRejectedMerges.push([group.members[i], group.members[j]].sort());
      }
    }
    setRejectedMerges(newRejectedMerges);
    
    // Remove from possible merges
    setPossibleMerges(prev => prev.filter((_, index) => index !== groupIndex));
    
    // Clear selections
    setSelectedPossibleMerges(prev => {
      const newSet = new Set(prev);
      newSet.delete(groupIndex);
      return newSet;
    });
    setSelectedCustomersInPossibleGroup(prev => {
      const newState = { ...prev };
      delete newState[groupIndex];
      return newState;
    });
  };

  // Handler for approving a partial group (only selected customers)
  const handleApprovePartialGroup = async (groupIndex) => {
    const selectedCustomers = selectedCustomersInPossibleGroup[groupIndex];
    if (!selectedCustomers || selectedCustomers.size < 2) return;
    
    const customersToMerge = Array.from(selectedCustomers);
    await approveCustomerMerge(customersToMerge);
    
    // Remove selected customers from the group
    const group = possibleMerges[groupIndex];
    const remainingCustomers = group.members.filter(customer => !selectedCustomers.has(customer));
    
    if (remainingCustomers.length <= 1) {
      // Remove entire group if no customers left or only one customer
      setPossibleMerges(prev => prev.filter((_, index) => index !== groupIndex));
    } else {
      // Update group with remaining customers
      setPossibleMerges(prev => prev.map((g, index) => 
        index === groupIndex 
          ? { ...g, members: remainingCustomers, totalMembers: remainingCustomers.length }
          : g
      ));
    }
    
    // Clear selections for this group
    setSelectedCustomersInPossibleGroup(prev => {
      const newState = { ...prev };
      delete newState[groupIndex];
      return newState;
    });
  };

  // Handler for bulk approving selected possible merges
  const handleBulkApprovePossible = async () => {
    const selectedGroups = Array.from(selectedPossibleMerges);
    
    for (const groupIndex of selectedGroups) {
      const group = possibleMerges[groupIndex];
      await approveCustomerMerge(group.members);
    }
    
    // Remove approved groups from possible merges
    setPossibleMerges(prev => prev.filter((_, index) => !selectedGroups.includes(index)));
    
    // Clear all selections
    setSelectedPossibleMerges(new Set());
    setSelectedCustomersInPossibleGroup({});
  };

  // Handler for bulk rejecting selected possible merges
  const handleBulkRejectPossible = async () => {
    const selectedGroups = Array.from(selectedPossibleMerges);
    
    for (const groupIndex of selectedGroups) {
      const group = possibleMerges[groupIndex];
      
      // Add all pairs to rejected merges
      const newRejectedMerges = [...rejectedMerges];
      for (let i = 0; i < group.members.length; i++) {
        for (let j = i + 1; j < group.members.length; j++) {
          newRejectedMerges.push([group.members[i], group.members[j]].sort());
        }
      }
      setRejectedMerges(newRejectedMerges);
    }
    
    // Remove rejected groups from possible merges
    setPossibleMerges(prev => prev.filter((_, index) => !selectedGroups.includes(index)));
    
    // Clear all selections
    setSelectedPossibleMerges(new Set());
    setSelectedCustomersInPossibleGroup({});
  };

  // Helper function to approve a customer merge
  const approveCustomerMerge = async (customers) => {
    try {
      const response = await fetch('/api/confirmed-merges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: customers })
      });
      
      const result = await response.json();
      if (result.success) {
        // Reload confirmed merges
        await loadMergedCustomers();
        setSaveMessage('Customer merge approved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        throw new Error('Failed to approve customer merge');
      }
    } catch (error) {
      console.error('Error approving customer merge:', error);
      setError(error.message);
    }
  };

  const deleteMergedCustomerGroup = async (groupIndex) => {
    try {
      const updatedMerges = mergedCustomers.filter((_, index) => index !== groupIndex);
      
      const response = await fetch('/api/confirmed-merges', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merges: updatedMerges }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMergedCustomers(updatedMerges);
        setSaveMessage('Merged customer group deleted successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        throw new Error('Failed to delete merged customer group');
      }
    } catch (error) {
      console.error('Error deleting merged customer group:', error);
      setError(error.message);
    }
  };

  // Load sales reps and defaults when division changes
  useEffect(() => {
    if (divisionCode) {
      setLoadingReps(true);
      setErrorReps('');
      
      const fetchSalesReps = async () => {
        try {
          if (divisionCode === 'FP') {
            // Fetch from fp_data table for FP division
            const res = await fetch('http://localhost:3001/api/fp/sales-reps-from-db');
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            if (data.success) {
              setSalesReps(data.data || []);
            } else {
              throw new Error(data.message || 'Failed to load sales reps');
            }
          } else {
            // For other divisions, show "Not Available" message
            setSalesReps([]);
            setErrorReps('Sales Rep data Not Available');
            return;
          }
        } catch (error) {
          console.error('Error loading sales reps:', error);
          if (divisionCode === 'FP') {
            setErrorReps(`Failed to load sales representatives: ${error.message}`);
          } else {
            setErrorReps('Sales Rep data Not Available');
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
        <button
          className={`tab-button ${activeTab === 'mergedcustomers' ? 'active' : ''}`}
          onClick={() => setActiveTab('mergedcustomers')}
        >
          🔗 Merged Customers
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
                        <p><strong>Sales Rep data Not Available</strong></p>
                        <p>No sales representatives are available for {divisionCode} division.</p>
                        {divisionCode === 'FP' ? (
                          <p>Please check the database connection or fp_data table.</p>
                        ) : (
                          <p>Sales representative data is not configured for this division.</p>
                        )}
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

        {activeTab === 'mergedcustomers' && (
          <div className="merged-customers-tab">
            <div className="merged-customers-header">
              <h3>{divisionCode}-Merged Customer Groups</h3>
              <p>Centralized customer merging for {divisionCode} division - Review and approve customer name matches</p>
              <div className="merged-customers-actions">
                <button 
                  onClick={loadAllPossibleMerges} 
                  disabled={loadingMergedCustomers}
                  className="refresh-button"
                >
                  {loadingMergedCustomers ? 'Refreshing...' : '🔄 Refresh All Possible Merges'}
                </button>
                {saveMessage && <span className="save-message">{saveMessage}</span>}
              </div>
            </div>

            {loadingMergedCustomers ? (
              <div className="loading-message">Loading all possible customer merges...</div>
            ) : (
              <div className="customer-merging-interface">
                {/* Confirmed Merges Section */}
                <div className="confirmed-merges-section">
                  <h4>✅ Confirmed Customer Groups ({mergedCustomers.length})</h4>
                  {mergedCustomers.length === 0 ? (
                    <p className="no-data-message">No customer groups have been confirmed yet.</p>
                  ) : (
                    <div className="confirmed-merges-list">
                      {mergedCustomers.map((group, index) => (
                        <div key={index} className="confirmed-group">
                          <div className="group-header">
                            <span className="group-name">{group[0]}</span>
                            <button
                              onClick={() => deleteMergedCustomerGroup(index)}
                              className="delete-group-btn"
                              title="Delete this merged group"
                            >
                              🗑️
                            </button>
                          </div>
                          <div className="group-members">
                            {group.map((customer, customerIndex) => (
                              <span key={customerIndex} className="customer-tag confirmed">
                                {customer}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Possible Merges Section */}
                <div className="possible-merges-section">
                  <h4>🔍 Possible Customer Merges ({possibleMerges.length})</h4>
                  {possibleMerges.length === 0 ? (
                    <p className="no-data-message">No potential customer merges found. All customers appear to be unique.</p>
                  ) : (
                    <div className="possible-merges-interface">
                      {/* Bulk Actions */}
                      <div className="bulk-actions">
                        <button
                          onClick={handleSelectAllPossible}
                          className="select-all-btn"
                        >
                          Select All
                        </button>
                        <button
                          onClick={handleDeselectAllPossible}
                          className="deselect-all-btn"
                        >
                          Deselect All
                        </button>
                        <button
                          onClick={handleBulkApprovePossible}
                          disabled={selectedPossibleMerges.size === 0}
                          className="bulk-approve-btn"
                        >
                          Approve Selected ({selectedPossibleMerges.size})
                        </button>
                        <button
                          onClick={handleBulkRejectPossible}
                          disabled={selectedPossibleMerges.size === 0}
                          className="bulk-reject-btn"
                        >
                          Reject Selected ({selectedPossibleMerges.size})
                        </button>
                      </div>

                      {/* Merges List */}
                      <div className="possible-merges-list">
                        {possibleMerges.map((mergeGroup, groupIndex) => (
                          <div key={groupIndex} className="possible-merge-group">
                            <div className="merge-group-header">
                              <input
                                type="checkbox"
                                checked={selectedPossibleMerges.has(groupIndex)}
                                onChange={() => handlePossibleGroupSelection(groupIndex)}
                                className="group-checkbox"
                              />
                              <span className="merge-group-title">
                                Potential Merge Group {groupIndex + 1} ({mergeGroup.members.length} customers)
                              </span>
                              <div className="merge-group-actions">
                                <button
                                  onClick={() => handleApproveGroup(groupIndex)}
                                  className="approve-group-btn"
                                  title="Approve entire group"
                                >
                                  ✅ Approve All
                                </button>
                                <button
                                  onClick={() => handleRejectGroup(groupIndex)}
                                  className="reject-group-btn"
                                  title="Reject entire group"
                                >
                                  ❌ Reject All
                                </button>
                              </div>
                            </div>
                            
                            <div className="merge-group-members">
                              {mergeGroup.members.map((customer, customerIndex) => (
                                <div key={customerIndex} className="customer-selection-item">
                                  <input
                                    type="checkbox"
                                    checked={selectedCustomersInPossibleGroup[groupIndex]?.has(customer) || false}
                                    onChange={() => handleCustomerSelectionInPossibleGroup(groupIndex, customer)}
                                    className="customer-checkbox"
                                  />
                                  <span className="customer-name">{customer}</span>
                                  <span className="customer-similarity">
                                    Similarity: {mergeGroup.similarities[customerIndex]}%
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="partial-actions">
                              <button
                                onClick={() => handleApprovePartialGroup(groupIndex)}
                                disabled={!selectedCustomersInPossibleGroup[groupIndex] || selectedCustomersInPossibleGroup[groupIndex].size === 0}
                                className="approve-partial-btn"
                              >
                                Approve Selected ({selectedCustomersInPossibleGroup[groupIndex]?.size || 0})
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="merging-instructions">
                  <h4>📋 How to Use Customer Merging:</h4>
                  <ul>
                    <li><strong>Review:</strong> All potential customer name matches are automatically detected</li>
                    <li><strong>Select:</strong> Use checkboxes to select specific customers or entire groups</li>
                    <li><strong>Approve:</strong> Merge selected customers into a single entity</li>
                    <li><strong>Reject:</strong> Keep selected customers as separate entities</li>
                    <li><strong>Partial Approval:</strong> Select only some customers in a group to merge them while keeping others separate</li>
                    <li><strong>Confirmed Groups:</strong> Successfully merged customers appear in the top section</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterData;
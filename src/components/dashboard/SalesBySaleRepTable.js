import React, { useEffect, useState } from 'react';
import TabsComponent, { Tab } from './TabsComponent';
import './SalesBySaleRepTable.css';

const SalesBySaleRepTable = () => {
  const [defaultReps, setDefaultReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/sales-reps-defaults')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setDefaultReps(result.defaults);
        } else {
          setError('Failed to load sales rep defaults');
        }
      })
      .catch(() => setError('Failed to load sales rep defaults'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading sales reps...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="sales-rep-tabs-container">
      {defaultReps.length > 0 ? (
        <TabsComponent variant="secondary">
          {defaultReps.map(rep => (
            <Tab key={rep} label={rep}>
              <div style={{ padding: 32, minHeight: 200, textAlign: 'center' }}>
                <h2>{rep}</h2>
              </div>
            </Tab>
          ))}
        </TabsComponent>
      ) : (
        <div>No default sales reps configured.</div>
      )}
    </div>
  );
};

export default SalesBySaleRepTable; 
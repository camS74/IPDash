import React, { useState } from 'react';

const TestOracleData = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState([]);
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData([]);
    setRaw(null);
    setSubmitted(true);
    try {
      const res = await fetch('/api/test-oracle-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await res.json();
      setRaw(result);
      if (result.success) {
        setData(result.data);
        console.log('Oracle data:', result.data);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!submitted || error) {
    return (
      <div style={{ padding: 32, maxWidth: 400, margin: '0 auto' }}>
        <h2>Oracle Test Data Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>Username:<br />
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%' }} />
            </label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Password:<br />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%' }} />
            </label>
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Loading...' : 'Login & Load Data'}
          </button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 16 }}>Error: {error}</div>}
      </div>
    );
  }

  if (loading) return <div style={{ padding: 32 }}>Loading Oracle data...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h2>Oracle Test Data</h2>
      {raw && (
        <div style={{ marginBottom: 24 }}>
          <h4>Raw JSON Response</h4>
          <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 4, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(raw, null, 2)}</pre>
        </div>
      )}
      {Array.isArray(data) && data.length > 0 ? (
        <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {Object.keys(data[0]).map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {Object.keys(data[0]).map(h => <td key={h}>{row[h]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ marginTop: 24 }}>No data returned or data is not in table format.</div>
      )}
    </div>
  );
};

export default TestOracleData; 
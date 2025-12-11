import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function Card({ children, style }) {
  return (
    <div className="card-dark" style={style}>{children}</div>
  );
}

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [user, setUser] = useState(null);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState([]); // Admin logs
  const [myHistory, setMyHistory] = useState([]); // Member history
  const [output, setOutput] = useState(null);

  // Login
  const login = async () => {
    try {
      const res = await axios.get(`${API_URL}/me`, { headers: { 'x-api-key': apiKey } });
      setUser(res.data);
      localStorage.setItem('apiKey', apiKey);
    } catch (err) {
      alert('Invalid API Key (Key resets on server restart. Try admin-secret-123)');
      localStorage.removeItem('apiKey');
      setUser(null);
    }
  };

  // Fetch Member History (New Feature)
  const fetchMyHistory = async () => {
    if (!apiKey) return;
    try {
      const res = await axios.get(`${API_URL}/my-history`, { headers: { 'x-api-key': apiKey } });
      setMyHistory(res.data);
    } catch (err) { console.error(err); }
  };

  // Run Command
  const runCommand = async () => {
    try {
      const res = await axios.post(`${API_URL}/commands`, { command }, { headers: { 'x-api-key': apiKey } });
      setOutput(res.data);
      login(); // Refresh credits
      fetchMyHistory(); // Refresh history
    } catch (err) {
      setOutput({ status: 'error', message: err.response?.data?.message || 'Error' });
    }
  };

  // Admin: Fetch All Logs
  const fetchLogs = async () => {
    const res = await axios.get(`${API_URL}/admin/logs`, { headers: { 'x-api-key': apiKey } });
    setLogs(res.data);
  };

  // Admin: Add Rule
  const addRule = async (e) => {
    e.preventDefault();
    const pattern = e.target.pattern.value;
    const action = e.target.action.value;
    try {
      await axios.post(`${API_URL}/admin/rules`, { pattern, action }, { headers: { 'x-api-key': apiKey } });
      alert('Rule Added Successfully!');
    } catch (err) {
      alert('Error adding rule: ' + (err.response?.data?.error || err.message));
    }
  };

  // Admin: Create User
  const createUser = async () => {
    const name = prompt('Enter new username:');
    if (!name) return;
    const res = await axios.post(`${API_URL}/admin/users`, { username: name }, { headers: { 'x-api-key': apiKey } });
    alert(`User Created! Their API Key is: ${res.data.apiKey}`);
  };

  // Load history on login
  useEffect(() => {
    if (user) {
        fetchMyHistory();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="login-dark">
        <Card style={{ maxWidth: 400, margin: '80px auto', padding: 32 }}>
          <h1 style={{ marginBottom: 24 }}>Command Gateway</h1>
          <input
            className="input-dark"
            placeholder="Enter API Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{ marginBottom: 16, width: '100%' }}
          />
          <button className="btn-dark" onClick={login} style={{ width: '100%', marginBottom: 16 }}>Login</button>
          <p style={{ color: '#aaa' }}>Hint: Use <b>admin-secret-123</b> for Admin</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-dark">
      <header className="header-dark">
        <div>
          <h2 style={{ margin: 0 }}>Welcome, {user.username} <span style={{ color: '#888', fontWeight: 400 }}>({user.role})</span></h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span className="credits-dark">Credits: {user.credits}</span>
          <button className="btn-dark" onClick={() => { setUser(null); localStorage.removeItem('apiKey'); }}>Logout</button>
        </div>
      </header>

      <main className="main-dark">
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '320px', marginRight: '24px'}}>
            {/* Terminal Section */}
            <Card>
            <h3>Terminal</h3>
            <input
                className="input-dark"
                type="text"
                placeholder="Type command (e.g., ls -la, rm -rf /)"
                value={command}
                onChange={e => setCommand(e.target.value)}
                style={{ marginBottom: 12, width: '100%' }}
            />
            <button className="btn-dark" onClick={runCommand} style={{ width: '100%' }}>Run Command</button>
            {output && (
                <div className="output-dark" style={{ marginTop: 16, border: output.status === 'rejected' ? '1px solid red' : '1px solid green' }}>
                <b style={{ color: output.status === 'rejected' ? 'red' : 'lightgreen' }}>Status: {output.status.toUpperCase()}</b><br />
                <span style={{ color: '#ccc' }}>Message: {output.message}</span>
                </div>
            )}
            </Card>

            {/* Member History Section (Requirement Check!) */}
            <Card>
                <h3>My Command History</h3>
                {myHistory.length === 0 ? <p style={{color:'#666'}}>No commands run yet.</p> : (
                    <ul style={{ paddingLeft: 16, maxHeight: '200px', overflowY: 'auto' }}>
                    {myHistory.map((log, idx) => (
                        <li key={idx} style={{ marginBottom: 4, color: '#ccc', fontSize: 14 }}>
                            <code>{log.command}</code> 
                            <span style={{color: log.actionTaken==='REJECTED'?'red':'lightgreen', marginLeft:'10px', fontSize:'0.8em'}}>
                                {log.actionTaken}
                            </span>
                        </li>
                    ))}
                    </ul>
                )}
            </Card>
        </div>

        {/* Admin Panel */}
        {user.role === 'admin' && (
          <Card style={{ flex: 1, minWidth: 320 }}>
            <h3>Admin Panel</h3>
            <div style={{display:'flex', gap: '10px', marginBottom: '12px'}}>
                <button className="btn-dark" onClick={fetchLogs} style={{ flex:1 }}>Fetch Logs</button>
                <button className="btn-dark" onClick={createUser} style={{ flex:1 }}>Create User</button>
            </div>
            
            <form onSubmit={addRule} style={{ marginBottom: 12, padding: '10px', border: '1px solid #444', borderRadius: '4px' }}>
              <label style={{display:'block', marginBottom:'5px', color:'#aaa'}}>Add New Rule:</label>
              <input className="input-dark" name="pattern" placeholder="Regex (e.g. ^rm -rf)" required style={{ marginBottom: 8, width: '100%' }} />
              <select className="input-dark" name="action" style={{ marginBottom: 8, width: '100%' }}>
                <option value="AUTO_REJECT">Block (AUTO_REJECT)</option>
                <option value="AUTO_ACCEPT">Allow (AUTO_ACCEPT)</option>
              </select>
              <button className="btn-dark" type="submit" style={{ width: '100%' }}>Save Rule</button>
            </form>

            {logs.length > 0 && (
              <div className="logs-dark" style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
                <h4 style={{ margin: '8px 0' }}>All User Logs</h4>
                <ul style={{ paddingLeft: 16 }}>
                  {logs.map((log, idx) => (
                    <li key={idx} style={{ marginBottom: 4, color: '#ccc', fontSize: 14 }}>
                        [{new Date(log.timestamp).toLocaleTimeString()}] <b>{log.user}</b>: {log.command} 
                        <span style={{color: log.actionTaken==='REJECTED'?'red':'lightgreen', marginLeft:'10px'}}>
                             {log.actionTaken}
                        </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}

export default App;
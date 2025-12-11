import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('terminal'); 
  
  // Data States
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [output, setOutput] = useState(null);

  // Form States (No Popups!)
  const [usernameInput, setUsernameInput] = useState('');
  const [createdUserKey, setCreatedUserKey] = useState(null);

  // --- ACTIONS ---
  const login = async () => {
    try {
      const res = await axios.get(`${API_URL}/me`, { headers: { 'x-api-key': apiKey } });
      setUser(res.data);
      localStorage.setItem('apiKey', apiKey);
    } catch (err) {
      alert('Invalid API Key');
      localStorage.removeItem('apiKey');
      setUser(null);
    }
  };

  const fetchMyHistory = async () => {
    if (!apiKey) return;
    try {
      const res = await axios.get(`${API_URL}/my-history`, { headers: { 'x-api-key': apiKey } });
      setMyHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const runCommand = async () => {
    try {
      const res = await axios.post(`${API_URL}/commands`, { command }, { headers: { 'x-api-key': apiKey } });
      setOutput(res.data);
      login(); 
      fetchMyHistory();
    } catch (err) {
      setOutput({ status: 'error', message: err.response?.data?.message || 'Error' });
    }
  };

  const fetchLogs = async () => {
    const res = await axios.get(`${API_URL}/admin/logs`, { headers: { 'x-api-key': apiKey } });
    setLogs(res.data);
  };

  const addRule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/rules`, { 
        pattern: e.target.pattern.value, 
        action: e.target.action.value 
      }, { headers: { 'x-api-key': apiKey } });
      alert('Rule Added Successfully!'); // Small toast is okay, or remove if prefer
      e.target.reset();
    } catch (err) { alert('Error: ' + err.response?.data?.error); }
  };

  // INLINE Create User
  const createUser = async (e) => {
    e.preventDefault();
    if (!usernameInput) return;
    
    try {
      const res = await axios.post(`${API_URL}/admin/users`, 
        { username: usernameInput }, 
        { headers: { 'x-api-key': apiKey } }
      );
      // Show Key on Screen instead of Alert
      setCreatedUserKey({ name: usernameInput, key: res.data.apiKey });
      setUsernameInput(''); // Clear input
    } catch (err) { 
      alert('Error creating user: ' + (err.response?.data?.error || err.message)); 
    }
  };

  useEffect(() => { if (user) fetchMyHistory(); }, [user]);

  // --- RENDER: LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Command Gateway</h1>
          <p>Secure Role-Based Execution</p>
          <input 
            placeholder="Enter API Key" 
            value={apiKey} 
            onChange={e => setApiKey(e.target.value)} 
          />
          <button className="btn-primary full-width" onClick={login}>Authenticate</button>
          <small>Admin: <b>admin-secret-123</b></small>
        </div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="dashboard">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="logo-area">
          <h3>GATEWAY</h3>
          <span className="role-badge">{user.role}</span>
        </div>
        
        <nav>
          <p className="nav-label">MEMBER</p>
          <button 
            className={activeTab === 'terminal' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveTab('terminal')}
          >
            >_ Terminal
          </button>
          <button 
            className={activeTab === 'history' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveTab('history')}
          >
            ↺ History
          </button>
          
          
          {user.role === 'admin' && (
            <>
              <p className="nav-label">ADMINISTRATION</p>
              <button 
                className={activeTab === 'admin-users' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => { setActiveTab('admin-users'); setCreatedUserKey(null); }}
              >
                👤 Manage Users
              </button>
              <button 
                className={activeTab === 'admin-rules' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveTab('admin-rules')}
              >
                🛡 Manage Rules
              </button>
              <button 
                className={activeTab === 'admin-logs' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => { setActiveTab('admin-logs'); fetchLogs(); }}
              >
                📜 Audit Logs
              </button>
            </>
          )}
        </nav>

        <div className="user-info">
          <div className="credits-box">
            <span>Credits</span>
            <strong>{user.credits}</strong>
          </div>
          <button className="logout-btn" onClick={() => { setUser(null); localStorage.removeItem('apiKey'); }}>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="content-area">
        <header>
          <h2>
            {activeTab === 'terminal' && 'Command Terminal'}
            {activeTab === 'history' && 'Execution History'}
            {activeTab === 'admin-users' && 'User Management'}
            {activeTab === 'admin-rules' && 'Security Rules'}
            {activeTab === 'admin-logs' && 'System Audit Logs'}
          </h2>
          <span className="user-welcome">User: {user.username}</span>
        </header>

        {/* VIEW: TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="card terminal-card">
            <div className="terminal-window">
              <div className="terminal-header">
                <span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span>
                <span className="title">bash -- gateway</span>
              </div>
              <div className="terminal-body">
                {output && (
                   <div className={`output-log ${output.status}`}>
                     <span className="timestamp">[{new Date().toLocaleTimeString()}]</span>
                     <span className="status">{output.status.toUpperCase()}:</span> 
                     {output.message}
                   </div>
                )}
                <div className="input-line">
                  <span className="prompt">$</span>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Enter command..." 
                    value={command} 
                    onChange={e => setCommand(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runCommand()}
                  />
                </div>
              </div>
            </div>
            <button className="btn-primary mt-20" onClick={runCommand}>Execute Command</button>
          </div>
        )}

        {/* VIEW: HISTORY */}
        {activeTab === 'history' && (
          <div className="card">
            <ul className="list-view">
              {myHistory.length === 0 ? <p className="empty">No commands executed yet.</p> : myHistory.map((log, i) => (
                <li key={i} className="list-item">
                  <div className="cmd-info">
                    <code>{log.command}</code>
                    <span className="time">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <span className={`status-badge ${log.actionTaken}`}>
                    {log.actionTaken}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* VIEW: ADMIN - MANAGE USERS */}
        {activeTab === 'admin-users' && (
          <div className="card" style={{ maxWidth: '600px' }}>
            <h3>Create New Member</h3>
            <p style={{ color: '#888', marginBottom: '20px' }}>Generate a new API key for a team member.</p>
            
            <form onSubmit={createUser} className="inline-form">
              <input 
                placeholder="Enter Username (e.g. dev-john)" 
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">Generate Key</button>
            </form>

            {/* THE API KEY DISPLAY (Inline, No Popup) */}
            {createdUserKey && (
              <div className="success-box">
                <h4>✅ User Created Successfully</h4>
                <div className="key-display">
                  <span className="label">Username:</span> <span className="val">{createdUserKey.name}</span><br/>
                  <span className="label">API Key:</span> <code className="val key">{createdUserKey.key}</code>
                </div>
                <p className="warning-text">⚠️ Copy this key now. It will not be shown again.</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW: ADMIN - MANAGE RULES */}
        {activeTab === 'admin-rules' && (
          <div className="card" style={{ maxWidth: '600px' }}>
            <h3>Add Security Rule</h3>
            <p style={{ color: '#888', marginBottom: '20px' }}>Define Regex patterns to block or allow commands.</p>
            
            <form onSubmit={addRule} className="rule-form">
              <label>Regex Pattern</label>
              <input name="pattern" placeholder="e.g. ^rm -rf" required />
              
              <label>Action</label>
              <select name="action">
                <option value="AUTO_REJECT">BLOCK (AUTO_REJECT)</option>
                <option value="AUTO_ACCEPT">ALLOW (AUTO_ACCEPT)</option>
              </select>
              
              <button type="submit" className="btn-primary mt-10">Save Rule</button>
            </form>
          </div>
        )}

        {/* VIEW: ADMIN - LOGS */}
        {activeTab === 'admin-logs' && (
          <div className="card full-width">
            <div className="flex-header">
              <h3>System Audit Logs</h3>
              <button className="sm-btn" onClick={fetchLogs}>Refresh</button>
            </div>
            <div className="logs-table">
                {logs.length === 0 ? <p className="empty">No logs found.</p> : logs.map((log, i) => (
                  <div key={i} className="log-row">
                    <span className="log-user">{log.user}</span>
                    <span className="log-cmd">{log.command}</span>
                    <span className={`log-status ${log.actionTaken}`}>{log.actionTaken}</span>
                    <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
import { useState } from 'react';
import useStore from '../store/useStore';

export default function LoginScreen() {
  const login = useStore(s => s.login);
  const [email, setEmail] = useState('rivalry@retrospotify.com');
  const [password, setPassword] = useState('password123');
  const [connection, setConnection] = useState('dsl');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(connection, email);
  };

  const handleOffline = () => login('offline', email);

  return (
    <div className="login-overlay">
      <div className="xp-window login-window">
        <div className="xp-titlebar">
          <span className="xp-titlebar-text">
            <svg viewBox="0 0 100 100" className="xp-window-icon">
              <circle cx="50" cy="50" r="45" fill="#1DB954"/>
              <path d="M25,35 Q50,20 75,35 M30,50 Q50,38 70,50 M35,65 Q50,55 65,65" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round"/>
            </svg>
            Spotify Login
          </span>
          <div className="xp-titlebar-controls">
            <button className="xp-btn-close" disabled>&times;</button>
          </div>
        </div>
        <div className="xp-window-body login-body">
          <div className="login-header">
            <svg className="login-logo" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="#1DB954"/>
              <path d="M25,32 Q50,17 75,32 M30,48 Q50,35 70,48 M35,64 Q50,53 65,64" stroke="black" strokeWidth="8" fill="none" strokeLinecap="round"/>
            </svg>
            <h2>Spotify 2006</h2>
            <p>Own your music. Sync your devices.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email / Username:</label>
              <input type="text" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="login-remember" defaultChecked />
              <label htmlFor="login-remember">Remember my password</label>
            </div>
            <div className="form-group">
              <label>Connection Type:</label>
              <select value={connection} onChange={e => setConnection(e.target.value)}>
                <option value="dialup">Dial-up (56 Kbps)</option>
                <option value="dsl">DSL (512 Kbps)</option>
                <option value="cable">Cable (2.0 Mbps)</option>
                <option value="lan">LAN (10+ Mbps)</option>
              </select>
            </div>
            <div className="login-actions">
              <button type="submit" className="xp-button primary">Login</button>
              <button type="button" className="xp-button" onClick={handleOffline}>Offline Mode</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

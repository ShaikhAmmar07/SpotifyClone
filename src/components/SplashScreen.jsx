import { useState, useEffect } from 'react';
import useStore from '../store/useStore';

export default function SplashScreen() {
  const setAppPhase = useStore(s => s.setAppPhase);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Loading Music Library...");

  useEffect(() => {
    const steps = [
      { progress: 20, status: "Checking Internet Connection..." },
      { progress: 45, status: "Initializing Audio Engine..." },
      { progress: 75, status: "Loading Music Library..." },
      { progress: 100, status: "System Ready." }
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(interval);
        setTimeout(() => setAppPhase('login'), 600);
        return;
      }
      setProgress(steps[i].progress);
      setStatus(steps[i].status);
      i++;
    }, 700);
    return () => clearInterval(interval);
  }, [setAppPhase]);

  return (
    <div className="splash-overlay" style={{ opacity: progress >= 100 ? 0 : 1, transition: 'opacity 0.5s' }}>
      <div className="splash-box">
        <div className="splash-logo-area">
          <svg className="splash-logo" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#1DB954"/>
            <path d="M25,32 Q50,17 75,32 M30,48 Q50,35 70,48 M35,64 Q50,53 65,64" stroke="black" strokeWidth="8" fill="none" strokeLinecap="round"/>
          </svg>
          <div className="splash-title">Spotify 2006</div>
        </div>
        <div className="splash-loader-container">
          <div className="splash-status-text">{status}</div>
          <div className="xp-progress-bar">
            <div className="xp-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="splash-version">Version 1.0.4 (Build 2006)</div>
      </div>
    </div>
  );
}

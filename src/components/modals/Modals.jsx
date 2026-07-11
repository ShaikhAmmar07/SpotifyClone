import { useState, useRef, useEffect, useCallback } from 'react';
import useStore, { SPEED_PROFILES, LYRICS_DB } from '../../store/useStore';
import { EQ_FREQUENCIES, EQ_PRESETS, setEQGain, applyPreset, getEQGains } from '../../audio/audioEngine';
import { startVisualizer, stopVisualizer, setVisualizerMode } from '../../audio/visualizer';

const EQ_LABELS = ['60Hz', '170Hz', '310Hz', '600Hz', '1K', '3K', '6K', '12K', '14K', '16K'];

function Modal({ id, title, children, className = '' }) {
  const { openModals, closeModal } = useStore();
  if (!openModals[id]) return null;
  return (
    <div className="xp-modal" onClick={(e) => { if (e.target === e.currentTarget) closeModal(id); }}>
      <div className={`xp-window dialog-window ${className}`}>
        <div className="xp-titlebar">
          <span className="xp-titlebar-text">{title}</span>
          <div className="xp-titlebar-controls">
            <button className="xp-btn-close" onClick={() => closeModal(id)}>&times;</button>
          </div>
        </div>
        <div className="xp-window-body">{children}</div>
      </div>
    </div>
  );
}

export function EQModal() {
  const [preset, setPreset] = useState('Flat');
  const [power, setPower] = useState(true);
  const [gains, setGains] = useState(EQ_FREQUENCIES.map(() => 0));

  const handlePresetChange = (val) => {
    setPreset(val);
    applyPreset(val);
    setGains(getEQGains());
  };

  const handleSliderChange = (idx, val) => {
    if (!power) return;
    setEQGain(idx, val);
    const newGains = [...gains];
    newGains[idx] = val;
    setGains(newGains);
    setPreset('Custom');
  };

  const handleReset = () => { applyPreset('Flat'); setPreset('Flat'); setGains(EQ_FREQUENCIES.map(() => 0)); };
  const handlePower = (on) => {
    setPower(on);
    if (!on) { EQ_FREQUENCIES.forEach((_, i) => setEQGain(i, 0)); setGains(EQ_FREQUENCIES.map(() => 0)); }
    else { const g = getEQGains(); setGains(g); g.forEach((v, i) => setEQGain(i, v)); }
  };

  return (
    <Modal id="eq" title="10-Band Graphic Equalizer" className="eq-window">
      <div className="eq-body">
        <div className="eq-controls-top">
          <div className="checkbox-group">
            <input type="checkbox" checked={power} onChange={e => handlePower(e.target.checked)} id="eq-pwr" />
            <label htmlFor="eq-pwr">Equalizer On</label>
          </div>
          <div className="preset-selector-group">
            <label>Preset:</label>
            <select value={preset} onChange={e => handlePresetChange(e.target.value)}>
              {Object.keys(EQ_PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button className="xp-button small" onClick={handleReset}>Reset</button>
        </div>
        <div className="eq-sliders-container">
          {EQ_LABELS.map((label, i) => (
            <div key={i} className="eq-channel-strip">
              <div className="slider-track-vert">
                <input type="range" min="-12" max="12" step="0.5" value={gains[i]} disabled={!power}
                  onChange={e => handleSliderChange(i, parseFloat(e.target.value))}
                  style={{ writingMode: 'vertical-lr', direction: 'rtl', width: 16, height: 120 }} />
              </div>
              <span className="eq-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function VisualizerModal() {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('Spectrum Bars');
  const { openModals } = useStore();

  useEffect(() => {
    if (openModals.visualizer && canvasRef.current) {
      setVisualizerMode(mode);
      startVisualizer(canvasRef.current);
    }
    return () => { if (!openModals.visualizer) stopVisualizer(); };
  }, [openModals.visualizer, mode]);

  return (
    <Modal id="visualizer" title="Music Visualizer v2.1" className="visualizer-window">
      <div className="visualizer-body">
        <div className="vis-controls">
          <div className="selector-group">
            <label>Visual Effect:</label>
            <select value={mode} onChange={e => { setMode(e.target.value); setVisualizerMode(e.target.value); }}>
              <option>Spectrum Bars</option><option>Particles</option><option>Tunnel</option><option>Matrix</option><option>Psychedelic</option>
            </select>
          </div>
          <button className="xp-button small" onClick={() => canvasRef.current?.requestFullscreen?.()}>Toggle Fullscreen</button>
        </div>
        <div className="canvas-container">
          <canvas ref={canvasRef} id="visualizer-canvas" width={600} height={350}></canvas>
        </div>
      </div>
    </Modal>
  );
}

export function CDBurnerModal() {
  const { playlists, allSongs, openModal, closeModal, showConfirm } = useStore();
  const [step, setStep] = useState(1);
  const [selectedPl, setSelectedPl] = useState(0);
  const [burnSpeed, setBurnSpeed] = useState('16');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  const tracks = playlists.find(p => p.id === selectedPl)?.tracks.map(id => allSongs.find(s => s.id === id)).filter(Boolean) || [];

  const startBurn = () => {
    if (!tracks.length) { showConfirm("Empty", "Select a playlist with tracks.", null); return; }
    setStep(3); setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current);
          setTimeout(() => {
            showConfirm("Burn Successful", "CD written successfully.", () => { closeModal('cdBurner'); setStep(1); });
          }, 1200);
          return 100;
        }
        return p + 5;
      });
    }, 1500 / parseInt(burnSpeed));
  };

  const cancelBurn = () => {
    clearInterval(intervalRef.current);
    showConfirm("Aborted", "Burn cancelled.", () => { closeModal('cdBurner'); setStep(1); });
  };

  return (
    <Modal id="cdBurner" title="Windows Audio CD Burner Wizard" className="burner-window">
      <div className="burner-body">
        {step === 1 && (
          <div className="burner-step">
            <h3>Insert Blank CD-R Disc</h3>
            <p>Insert a blank CD-R (700MB / 80 Min) into your CD/DVD drive.</p>
            <div className="drive-anim"><div className="disc-icon rotate-slow">&#128191;</div><div className="drive-tray-label">Drive E: (HL-DT-ST CD-RW)</div></div>
            <div className="burner-actions"><button className="xp-button primary" onClick={() => { setStep(2); if (playlists.length) setSelectedPl(playlists[0].id); }}>Simulate Disc Insert</button></div>
          </div>
        )}
        {step === 2 && (
          <div className="burner-step">
            <h3>Configure Burn Settings</h3>
            <div className="form-grid">
              <div className="form-group"><label>Source Playlist:</label><select value={selectedPl} onChange={e => setSelectedPl(parseInt(e.target.value))}>{playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="form-group"><label>Write Speed:</label><select value={burnSpeed} onChange={e => setBurnSpeed(e.target.value)}><option value="4">4x</option><option value="16">16x</option><option value="32">32x</option><option value="48">48x</option></select></div>
            </div>
            <div className="burner-disc-estimate"><strong>Tracks:</strong> {tracks.length} songs | <strong>Est Time:</strong> {Math.ceil(tracks.length * 15 / parseInt(burnSpeed))} mins</div>
            <div className="burner-actions"><button className="xp-button primary" onClick={startBurn}>Burn CD Now</button><button className="xp-button" onClick={() => setStep(1)}>Eject Disc</button></div>
          </div>
        )}
        {step === 3 && (
          <div className="burner-step">
            <h3>{progress >= 100 ? 'Verifying Disc...' : 'Writing Audio Tracks...'}</h3>
            <p>{progress >= 100 ? 'Verification complete. Ejecting...' : `Track ${Math.min(tracks.length, Math.floor((progress / 100) * tracks.length) + 1)} of ${tracks.length}...`}</p>
            <div className="xp-progress-bar"><div className="xp-progress-fill" style={{ width: `${progress}%` }}></div></div>
            <div className="burner-actions"><button className="xp-button" onClick={cancelBurn}>Cancel Burn</button></div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function DeviceSyncModal() {
  const { playlists, closeModal, showConfirm } = useStore();
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [checkedPls, setCheckedPls] = useState(playlists.map(p => p.id));

  const startSync = () => {
    if (!checkedPls.length) { showConfirm("Selection", "Check at least one playlist.", null); return; }
    setSyncing(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setSyncing(false); showConfirm("Sync Done", "MP3 player updated.", null); return 100; }
        return p + 10;
      });
    }, 400);
  };

  return (
    <Modal id="deviceSync" title="USB Device Synchronization Manager" className="sync-window">
      <div className="sync-body">
        <div className="sync-device-selector-row">
          <label>Target Device:</label>
          <select defaultValue="ipod-nano">
            <option value="ipod-nano">Apple iPod Nano (4.0 GB)</option>
            <option value="creative-zen">Creative Zen Sleek (20 GB)</option>
            <option value="walkman">Sony Walkman NW-HD5 (20 GB)</option>
          </select>
        </div>
        <div className="sync-storage-panel">
          <div className="storage-info-labels"><span>Capacity:</span><span>Used: 2.1 GB / 4.0 GB</span></div>
          <div className="xp-progress-bar device-storage-bar"><div className="xp-progress-fill" style={{ width: '52.5%', background: '#2e7d32' }}></div></div>
        </div>
        <div className="sync-content-panel">
          <div className="sync-pane playlists-pane xp-panel">
            <div className="xp-panel-header">Select Playlists to Sync</div>
            <div className="xp-panel-body">
              {playlists.map(p => (
                <div key={p.id} className="sync-playlists-list-item">
                  <input type="checkbox" checked={checkedPls.includes(p.id)} onChange={e => setCheckedPls(e.target.checked ? [...checkedPls, p.id] : checkedPls.filter(x => x !== p.id))} id={`sync-pl-${p.id}`} />
                  <label htmlFor={`sync-pl-${p.id}`}><strong>{p.name}</strong> ({p.tracks.length} songs)</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="sync-action-bar">
          <div className="sync-status-msg">{syncing ? `Syncing: ${progress}%` : 'Ready to synchronize.'}</div>
          <div className="sync-action-buttons">
            <button className="xp-button primary" onClick={startSync} disabled={syncing}>Sync Now</button>
            <button className="xp-button" onClick={() => closeModal('deviceSync')}>Close</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function PreferencesModal() {
  const { activeTheme, setTheme, closeModal } = useStore();
  const [tab, setTab] = useState('tab-general');
  const [theme, setLocalTheme] = useState(activeTheme);

  const apply = () => setTheme(theme);
  const tabs = ['tab-general', 'tab-playback', 'tab-downloads', 'tab-devices', 'tab-internet', 'tab-appearance'];
  const tabLabels = ['General', 'Playback', 'Downloads', 'Devices', 'Internet', 'Appearance'];

  return (
    <Modal id="preferences" title="Spotify Preferences" className="prefs-window">
      <div className="prefs-body">
        <div className="xp-tabs">
          <div className="xp-tab-headers">
            {tabs.map((t, i) => <button key={t} className={`xp-tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{tabLabels[i]}</button>)}
          </div>
          <div className={`xp-tab-content ${tab === 'tab-general' ? 'active' : ''}`} id="tab-general">
            <h4>Startup Options</h4>
            <div className="checkbox-group"><input type="checkbox" defaultChecked id="pref-launch" /><label htmlFor="pref-launch">Launch Spotify on startup</label></div>
            <div className="checkbox-group"><input type="checkbox" id="pref-tray" /><label htmlFor="pref-tray">Minimize to system tray</label></div>
            <hr /><h4>Language</h4>
            <div className="form-group"><label>Language:</label><select defaultValue="en"><option value="en">English</option><option value="es">Español</option><option value="de">Deutsch</option></select></div>
          </div>
          <div className={`xp-tab-content ${tab === 'tab-playback' ? 'active' : ''}`}>
            <h4>Audio Hardware</h4>
            <div className="form-group"><label>Output:</label><select defaultValue="primary"><option value="primary">Primary Sound Driver</option><option>DirectSound: Realtek AC97</option></select></div>
            <div className="form-group"><label>Buffer:</label><select defaultValue="2000"><option>500ms</option><option>1000ms</option><option>2000ms</option><option>5000ms</option></select></div>
          </div>
          <div className={`xp-tab-content ${tab === 'tab-downloads' ? 'active' : ''}`}>
            <h4>Storage</h4>
            <div className="form-group"><label>Cache Dir:</label><input type="text" defaultValue="C:\Program Files\Spotify\Downloads" style={{width:'100%'}} /></div>
          </div>
          <div className={`xp-tab-content ${tab === 'tab-devices' ? 'active' : ''}`}>
            <h4>MP3 Player</h4>
            <div className="form-group"><label>Auto-detect USB:</label><select defaultValue="yes"><option>Yes</option><option>No</option></select></div>
          </div>
          <div className={`xp-tab-content ${tab === 'tab-internet' ? 'active' : ''}`}>
            <h4>Proxy Settings</h4>
            <div className="checkbox-group"><input type="checkbox" id="pref-proxy" /><label htmlFor="pref-proxy">Use proxy server</label></div>
          </div>
          <div className={`xp-tab-content ${tab === 'tab-appearance' ? 'active' : ''}`}>
            <h4>Themes</h4>
            <div className="form-group"><label>Visual Style:</label>
              <select value={theme} onChange={e => setLocalTheme(e.target.value)}>
                <option value="luna-blue">Windows XP Luna (Blue)</option>
                <option value="luna-olive">Windows XP Luna (Olive)</option>
                <option value="luna-silver">Windows XP Luna (Silver)</option>
                <option value="retro-classic">Windows 98 Classic</option>
              </select>
            </div>
          </div>
        </div>
        <div className="prefs-actions">
          <button className="xp-button primary" onClick={() => { apply(); closeModal('preferences'); }}>OK</button>
          <button className="xp-button" onClick={() => closeModal('preferences')}>Cancel</button>
          <button className="xp-button" onClick={apply}>Apply</button>
        </div>
      </div>
    </Modal>
  );
}

export function PropertiesModal() {
  const { rightClickedTrackId, allSongs, library } = useStore();
  const track = library.find(t => t.id === rightClickedTrackId) || allSongs.find(t => t.id === rightClickedTrackId);
  if (!track) return null;

  return (
    <Modal id="properties" title={`${track.title} Properties`} className="props-window">
      <div className="props-body">
        <div className="props-tab-header">General File Info</div>
        <div className="props-row"><span className="label">File Name:</span><span className="value">{track.id}.mp3</span></div>
        <div className="props-row"><span className="label">Location:</span><span className="value">C:\Program Files\Spotify\Library</span></div>
        <hr />
        <div className="props-row"><span className="label">Title:</span><span className="value">{track.title}</span></div>
        <div className="props-row"><span className="label">Artist:</span><span className="value">{track.artist}</span></div>
        <div className="props-row"><span className="label">Album:</span><span className="value">{track.album}</span></div>
        <div className="props-row"><span className="label">Year:</span><span className="value">{track.year}</span></div>
        <div className="props-row"><span className="label">Genre:</span><span className="value">{track.genre}</span></div>
        <hr />
        <div className="props-row"><span className="label">Length:</span><span className="value">{track.duration}</span></div>
        <div className="props-row"><span className="label">Bitrate:</span><span className="value">{track.bitrate}</span></div>
        <div className="props-row"><span className="label">Size:</span><span className="value">{track.size}</span></div>
        <div className="props-actions"><button className="xp-button primary" onClick={() => useStore.getState().closeModal('properties')}>Close</button></div>
      </div>
    </Modal>
  );
}

export function LyricsModal() {
  const { currentSong } = useStore();
  if (!currentSong) return null;
  const lyrics = LYRICS_DB[currentSong.id] || "Lyrics not available for this track.";

  return (
    <Modal id="lyrics" title="Lyric Viewer" className="lyrics-window">
      <div className="lyrics-body">
        <h3>{currentSong.title}</h3>
        <p>{currentSong.artist}</p>
        <hr />
        <div className="lyrics-text-container">{lyrics.replace(/\n/g, '\n')}</div>
      </div>
    </Modal>
  );
}

export function AboutModal() {
  return (
    <Modal id="about" title="About Spotify" className="about-window">
      <div className="about-body">
        <svg className="about-logo" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1DB954"/><path d="M25,32 Q50,17 75,32 M30,48 Q50,35 70,48 M35,64 Q50,53 65,64" stroke="black" strokeWidth="8" fill="none" strokeLinecap="round"/></svg>
        <h3>Spotify 2006 (Alpha Release)</h3>
        <p>Version 1.0.4.2006</p>
        <p>Copyright &copy; 2006 Spotify AB. All rights reserved.</p>
        <hr />
        <p>A revolutionary local-first music management and device synchronization console.</p>
        <div className="about-actions"><button className="xp-button primary" onClick={() => useStore.getState().closeModal('about')}>OK</button></div>
      </div>
    </Modal>
  );
}

export function ConfirmModal() {
  const { confirmDialog, clearConfirm } = useStore();
  if (!confirmDialog) return null;

  return (
    <div className="xp-modal">
      <div className="xp-window dialog-window confirm-window">
        <div className="xp-titlebar">
          <span className="xp-titlebar-text">{confirmDialog.title}</span>
          <div className="xp-titlebar-controls"><button className="xp-btn-close" onClick={clearConfirm}>&times;</button></div>
        </div>
        <div className="xp-window-body confirm-body">
          <div className="confirm-content-row">
            <span className="confirm-warning-icon">&#9888;</span>
            <p>{confirmDialog.message}</p>
          </div>
          <div className="confirm-actions">
            <button className="xp-button primary" onClick={() => { if (confirmDialog.onConfirm) confirmDialog.onConfirm(); clearConfirm(); }}>Yes</button>
            <button className="xp-button" onClick={clearConfirm}>No</button>
          </div>
        </div>
      </div>
    </div>
  );
}

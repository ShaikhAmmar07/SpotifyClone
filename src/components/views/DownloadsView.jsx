import useStore, { SPEED_PROFILES } from '../../store/useStore';

export default function DownloadsView() {
  const { downloads, connectionSpeed, bandwidthUsed, diskSpaceFree, cancelDownload } = useStore();

  const speedProfile = SPEED_PROFILES[connectionSpeed] || SPEED_PROFILES.dsl;

  return (
    <div className="content-view">
      <div className="downloads-header xp-panel">
        <div className="xp-panel-header">Download Settings & Speed Profile</div>
        <div className="xp-panel-body downloads-status-bar">
          <div className="status-stat"><span className="label">Connection:</span> {speedProfile.name}</div>
          <div className="status-stat"><span className="label">Rate:</span> ~{speedProfile.display}</div>
          <div className="status-stat"><span className="label">Bandwidth Used:</span> {bandwidthUsed.toFixed(1)} MB</div>
        </div>
      </div>
      <div className="downloads-main-panel xp-panel" style={{marginTop: 8}}>
        <div className="xp-panel-header">Current Download Queue</div>
        <div className="xp-panel-body table-container">
          <table className="xp-table">
            <thead><tr><th>Song</th><th>Artist</th><th>Progress</th><th>Speed</th><th>ETA</th><th>Status</th><th style={{textAlign:'center'}}>Actions</th></tr></thead>
            <tbody>
              {downloads.length === 0 ? (
                <tr><td colSpan="7" style={{textAlign:'center'}}>No active downloads. Browse store to purchase music.</td></tr>
              ) : downloads.map(dl => (
                <tr key={dl.id}>
                  <td><strong>{dl.songObj.title}</strong></td>
                  <td>{dl.songObj.artist}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="xp-progress-bar" style={{width:120}}><div className="xp-progress-fill" style={{width:`${dl.progress}%`}}></div></div>
                      <span>{dl.progress}%</span>
                    </div>
                  </td>
                  <td>{dl.speed}</td>
                  <td>{dl.eta}</td>
                  <td>{dl.status}</td>
                  <td style={{textAlign:'center'}}>
                    <button className="xp-button small" onClick={() => cancelDownload(dl.id)}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="downloads-footer xp-panel" style={{marginTop: 8}}>
        <div className="xp-panel-body disk-space-row">
          <div><strong>Storage:</strong> C:\Program Files\Spotify\Library\Downloads</div>
          <div><strong>Free Disk Space:</strong> {diskSpaceFree.toFixed(2)} GB / 80.0 GB</div>
        </div>
      </div>
    </div>
  );
}

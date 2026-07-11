import useStore, { SPEED_PROFILES } from '../../store/useStore';
import { featuredAlbum } from '../../data/songs';

export default function HomeView() {
  const { library, allSongs, userName, connectionSpeed, navigateTo, openModal } = useStore();

  const recentTracks = library.slice(0, 3);
  const topDownloads = allSongs.slice(0, 5);
  const newReleases = allSongs.slice(3, 7);

  const handlePlayTrack = (track) => {
    useStore.getState().setCurrentSong(track);
    useStore.getState().setIsPlaying(true);
  };

  return (
    <div className="content-view">
      <div className="welcome-banner">
        <h3>Welcome Back, {userName}!</h3>
        <p>Your local music hub is initialized. Internet connection: {SPEED_PROFILES[connectionSpeed]?.name || connectionSpeed}.</p>
      </div>
      <div className="home-grid">
        <div className="home-row">
          <div className="home-card featured-album-card xp-panel">
            <div className="xp-panel-header">Featured Album</div>
            <div className="xp-panel-body featured-album-body">
              <div className="featured-cover-container" style={{ background: featuredAlbum.coverColor }}>
                <div className="cd-vinyl"></div>
                <div className="artwork-label">RHCP</div>
              </div>
              <div className="featured-info">
                <h4>{featuredAlbum.title}</h4>
                <p>{featuredAlbum.artist}</p>
                <p>Price: <span className="price-tag">{featuredAlbum.price}</span></p>
                <p>Format: High-quality MP3 (320kbps)</p>
                <div className="featured-actions">
                  <button className="xp-button primary" onClick={() => navigateTo('store')}>Buy & Download</button>
                  <button className="xp-button" onClick={() => handlePlayTrack(allSongs.find(s => s.id === 2))}>Preview</button>
                </div>
              </div>
            </div>
          </div>
          <div className="home-card quick-actions-card xp-panel">
            <div className="xp-panel-header">Quick Utilities</div>
            <div className="xp-panel-body quick-actions-body">
              <button className="xp-button full-width" onClick={() => openModal('cdBurner')}>&#128191; Rip Audio CD...</button>
              <button className="xp-button full-width" onClick={() => openModal('deviceSync')}>&#128241; Sync MP3 Player</button>
              <button className="xp-button full-width" onClick={() => openModal('cdBurner')}>&#128191; Burn Playlist to CD</button>
              <button className="xp-button full-width" onClick={() => navigateTo('downloads')}>&#128190; View Download Queue</button>
            </div>
          </div>
        </div>
        <div className="home-row">
          <div className="home-card recently-played-card xp-panel">
            <div className="xp-panel-header">Recently Played</div>
            <div className="xp-panel-body table-container">
              <table className="xp-table">
                <thead><tr><th>Title</th><th>Artist</th><th>Plays</th></tr></thead>
                <tbody>
                  {recentTracks.length === 0 ? (
                    <tr><td colSpan="3" style={{textAlign:'center'}}>No tracks played yet.</td></tr>
                  ) : recentTracks.map(track => (
                    <tr key={track.id} onDoubleClick={() => handlePlayTrack(track)}>
                      <td><strong>{track.title}</strong></td><td>{track.artist}</td><td>{track.playCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="home-card top-downloads-card xp-panel">
            <div className="xp-panel-header">Top Store Downloads (This Week)</div>
            <div className="xp-panel-body">
              <ol className="xp-list">
                {topDownloads.map((track, idx) => (
                  <li key={track.id} onClick={() => { useStore.getState().setSelectedAlbum(track.album); navigateTo('albumDetails'); }}>
                    #{idx + 1} - <strong>{track.title}</strong> by {track.artist}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <div className="home-row">
          <div className="home-card new-releases-card xp-panel" style={{flex: 1}}>
            <div className="xp-panel-header">Hot New Releases in Store</div>
            <div className="xp-panel-body releases-grid">
              {newReleases.map(track => (
                <div key={track.id} className="release-item-card" onClick={() => { useStore.getState().setSelectedAlbum(track.album); navigateTo('albumDetails'); }}>
                  <div className="release-art" style={{ backgroundColor: track.coverColor }}>CD</div>
                  <div className="release-title">{track.title}</div>
                  <div className="release-artist">{track.artist}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

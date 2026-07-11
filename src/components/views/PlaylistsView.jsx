import useStore from '../../store/useStore';

export default function PlaylistsView() {
  const { playlists, activePlaylistId, allSongs, setActivePlaylist, renamePlaylist, deletePlaylist, removeFromPlaylist, navigateTo, openModal, setCurrentSong, setIsPlaying, showConfirm } = useStore();

  const playlist = playlists.find(p => p.id === activePlaylistId);
  if (!playlist) return <div className="content-view"><p>Select a playlist from the sidebar, or create a new one.</p></div>;

  const tracks = playlist.tracks.map(id => allSongs.find(s => s.id === id)).filter(Boolean);

  const handlePlayAll = () => {
    if (tracks.length > 0) { setCurrentSong(tracks[0]); setIsPlaying(true); }
  };

  const handleRename = () => {
    const name = prompt("Enter new name:", playlist.name);
    if (name && name.trim()) renamePlaylist(playlist.id, name.trim());
  };

  const handleDelete = () => {
    showConfirm("Delete Playlist", `Delete "${playlist.name}"?`, () => {
      deletePlaylist(playlist.id);
      navigateTo('home');
    });
  };

  return (
    <div className="content-view">
      <div className="playlist-header">
        <h3>{playlist.name}</h3>
        <div className="playlist-meta-actions">
          <button className="xp-button" onClick={handlePlayAll}>Play Playlist</button>
          <button className="xp-button" onClick={handleRename}>Rename</button>
          <button className="xp-button" onClick={handleDelete}>Delete</button>
          <button className="xp-button" onClick={() => openModal('cdBurner')}>&#128191; Burn to CD</button>
          <button className="xp-button" onClick={() => openModal('deviceSync')}>&#128241; Sync Device</button>
        </div>
      </div>
      <div className="playlist-songs table-container">
        <table className="xp-table">
          <thead><tr><th style={{width:40}}>#</th><th>Song</th><th>Artist</th><th>Album</th><th>Length</th><th>Actions</th></tr></thead>
          <tbody>
            {tracks.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign:'center'}}>No tracks. Right-click library tracks to add them.</td></tr>
            ) : tracks.map((track, idx) => (
              <tr key={track.id} onDoubleClick={() => { setCurrentSong(track); setIsPlaying(true); }}>
                <td>{idx + 1}</td>
                <td><strong>{track.title}</strong></td>
                <td>{track.artist}</td>
                <td>{track.album}</td>
                <td>{track.duration}</td>
                <td><button className="xp-button small" onClick={() => removeFromPlaylist(playlist.id, track.id)}>&times;</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

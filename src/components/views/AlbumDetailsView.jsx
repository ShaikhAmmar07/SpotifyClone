import useStore from '../../store/useStore';

export default function AlbumDetailsView() {
  const { allSongs, library, selectedAlbumName, navigateTo, walletBalance, deductWallet, addDownload, connectionSpeed, showConfirm, setCurrentSong, setIsPlaying } = useStore();

  const albumSongs = allSongs.filter(s => s.album === selectedAlbumName);
  if (albumSongs.length === 0) return <div>No album selected.</div>;
  const first = albumSongs[0];
  const isOwned = albumSongs.every(s => library.some(lib => lib.id === s.id));

  const handleBuyAlbum = () => {
    if (connectionSpeed === 'offline') { showConfirm("Offline", "Connect to purchase.", null); return; }
    const toBuy = albumSongs.filter(s => !library.some(lib => lib.id === s.id));
    if (!toBuy.length) { showConfirm("Owned", "Already owned.", null); return; }
    const cost = 0.99 * toBuy.length;
    if (walletBalance < cost) { showConfirm("Insufficient", "Not enough funds.", null); return; }
    deductWallet(cost);
    toBuy.forEach(s => addDownload(s));
    navigateTo('downloads');
  };

  const handleBuyTrack = (song) => {
    if (connectionSpeed === 'offline') { showConfirm("Offline", "Connect to purchase.", null); return; }
    if (walletBalance < 0.99) { showConfirm("Insufficient", "Not enough funds.", null); return; }
    deductWallet(0.99);
    addDownload(song);
  };

  const handlePreview = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  return (
    <div className="content-view">
      <button className="xp-button" onClick={() => navigateTo('store')}>&larr; Back to Store</button>
      <div className="album-details-header">
        <div className="album-details-cover" style={{ backgroundColor: first.coverColor }}><div className="cd-vinyl"></div></div>
        <div className="album-details-info">
          <h2>{selectedAlbumName}</h2>
          <h4>{first.artist}</h4>
          <p>Release Year: {first.year} | Genre: {first.genre}</p>
          <p>Price: <strong>{isOwned ? "Purchased" : "$0.99"}</strong> | Total Size: {albumSongs.reduce((a, s) => a + parseFloat(s.size), 0).toFixed(1)} MB</p>
          <div className="album-details-actions">
            <button className="xp-button primary" disabled={isOwned} onClick={handleBuyAlbum}>Buy Album</button>
            <p className="details-wallet-info">Your wallet: ${walletBalance.toFixed(2)}</p>
          </div>
        </div>
      </div>
      <div className="album-details-body">
        <h4>Track Listing</h4>
        <table className="xp-table">
          <thead><tr><th>#</th><th>Song</th><th>Length</th><th>Size</th><th>Bitrate</th><th style={{textAlign:'center'}}>Actions</th></tr></thead>
          <tbody>
            {albumSongs.map((song, idx) => {
              const owned = library.some(lib => lib.id === song.id);
              return (
                <tr key={song.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{song.title}</strong></td>
                  <td>{song.duration}</td>
                  <td>{song.size}</td>
                  <td>{song.bitrate}</td>
                  <td style={{textAlign:'center'}}>
                    <button className="xp-button small" onClick={() => handlePreview(song)}>Preview</button>
                    <button className="xp-button small primary" disabled={owned} onClick={() => handleBuyTrack(song)}>{owned ? "Owned" : "Buy ($0.99)"}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="album-bio-section">
          <h4>Artist Biography</h4>
          <p>{first.description}</p>
        </div>
      </div>
    </div>
  );
}

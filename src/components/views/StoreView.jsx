import useStore from '../../store/useStore';

export default function StoreView() {
  const { allSongs, library, navigateTo, setSelectedAlbum, walletBalance, deductWallet, addDownload, connectionSpeed, showConfirm } = useStore();

  const albums = {};
  allSongs.forEach(song => {
    if (!albums[song.album]) {
      albums[song.album] = { title: song.album, artist: song.artist, year: song.year, genre: song.genre, price: "$0.99", coverColor: song.coverColor, songs: [] };
    }
    albums[song.album].songs.push(song);
  });

  const handleBuyAlbum = (album) => {
    if (connectionSpeed === 'offline') {
      showConfirm("Connection Error", "You are currently offline.", null);
      return;
    }
    const tracksToBuy = album.songs.filter(s => !library.some(lib => lib.id === s.id));
    if (tracksToBuy.length === 0) { showConfirm("Already Owned", "You already own all tracks.", null); return; }
    const cost = 0.99 * tracksToBuy.length;
    if (walletBalance < cost) { showConfirm("Insufficient Balance", `Not enough funds ($${cost.toFixed(2)}).`, null); return; }
    deductWallet(cost);
    tracksToBuy.forEach(s => addDownload(s));
    navigateTo('downloads');
  };

  return (
    <div className="content-view">
      <div className="store-banner">
        <h3>Spotify Digital Music Store</h3>
        <p>Purchase high-quality MP3s with your digital wallet balance.</p>
      </div>
      <div className="store-grid">
        {Object.values(albums).map(album => {
          const isOwned = album.songs.every(s => library.some(lib => lib.id === s.id));
          return (
            <div key={album.title} className="store-album-card xp-panel">
              <div className="store-album-cover" style={{ backgroundColor: album.coverColor }}>
                <div className="cd-vinyl"></div>
                {album.title.substring(0, 4).toUpperCase()}
              </div>
              <div className="store-album-title">{album.title}</div>
              <div className="store-album-artist">{album.artist}</div>
              <div className="store-album-price">{isOwned ? "Purchased" : album.price}</div>
              <div className="store-album-actions">
                <button className="xp-button small" onClick={() => { setSelectedAlbum(album.title); navigateTo('albumDetails'); }}>Details</button>
                <button className="xp-button small primary" disabled={isOwned} onClick={() => handleBuyAlbum(album)}>Buy</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import useStore from '../../store/useStore';

export default function LibraryView() {
  const { library, currentSong, selectedLibraryTrackId, selectLibraryTrack, setCurrentSong, setIsPlaying, removeFromLibrary, openModal, setRightClickedTrack, showConfirm } = useStore();
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState('title');
  const [sortAsc, setSortAsc] = useState(true);

  const tracks = useMemo(() => {
    let t = [...library];
    if (filter) {
      const q = filter.toLowerCase();
      t = t.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.album.toLowerCase().includes(q));
    }
    t.sort((a, b) => {
      const va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
    return t;
  }, [library, filter, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const handlePlay = () => {
    if (selectedLibraryTrackId) {
      const track = library.find(t => t.id === selectedLibraryTrackId);
      if (track) { setCurrentSong(track); setIsPlaying(true); }
    }
  };

  const handleDelete = () => {
    if (selectedLibraryTrackId) {
      const track = library.find(t => t.id === selectedLibraryTrackId);
      if (track) showConfirm("Delete Track", `Delete "${track.title}"?`, () => removeFromLibrary(track.id));
    }
  };

  const handleProperties = () => {
    if (selectedLibraryTrackId) {
      const track = library.find(t => t.id === selectedLibraryTrackId);
      if (track) { useStore.getState().setRightClickedTrack(track.id); openModal('properties'); }
    }
  };

  const handleContextMenu = (e, trackId) => {
    e.preventDefault();
    setRightClickedTrack(trackId);
    const menu = document.getElementById('custom-context-menu');
    if (menu) { menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px'; menu.classList.remove('hidden'); }
  };

  const sortInd = (field) => sortField === field ? (sortAsc ? ' ▲' : ' ▼') : '';

  return (
    <div className="content-view">
      <div className="library-toolbar">
        <button className="xp-button" onClick={handlePlay}>&#9658; Play</button>
        <button className="xp-button" onClick={() => { if (selectedLibraryTrackId) { const t = library.find(x => x.id === selectedLibraryTrackId); if (t) showConfirm("Queue", `"${t.title}" added to queue.`, null); } }}>+ Add to Queue</button>
        <button className="xp-button" onClick={handleDelete}>&times; Delete</button>
        <button className="xp-button" onClick={handleProperties}>Properties</button>
        <div className="lib-search-box">
          <input type="text" placeholder="Filter library..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </div>
      <div className="library-container table-container">
        <table className="xp-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('title')}>Song{sortInd('title')}</th>
              <th className="sortable" onClick={() => handleSort('artist')}>Artist{sortInd('artist')}</th>
              <th className="sortable" onClick={() => handleSort('album')}>Album{sortInd('album')}</th>
              <th className="sortable" onClick={() => handleSort('duration')}>Length{sortInd('duration')}</th>
              <th className="sortable" onClick={() => handleSort('size')}>Size{sortInd('size')}</th>
              <th className="sortable" onClick={() => handleSort('bitrate')}>Bitrate{sortInd('bitrate')}</th>
              <th>Rating</th>
              <th className="sortable" onClick={() => handleSort('playCount')}>Plays{sortInd('playCount')}</th>
            </tr>
          </thead>
          <tbody>
            {tracks.length === 0 ? (
              <tr><td colSpan="8" style={{textAlign:'center', padding: '20px'}}>Library empty. Purchase songs in the Store.</td></tr>
            ) : tracks.map(track => (
              <tr key={track.id}
                className={`${currentSong?.id === track.id ? 'active-track' : ''} ${selectedLibraryTrackId === track.id ? 'selected' : ''}`}
                onClick={() => selectLibraryTrack(track.id)}
                onDoubleClick={() => { setCurrentSong(track); setIsPlaying(true); }}
                onContextMenu={e => handleContextMenu(e, track.id)}
              >
                <td><strong>{track.title}</strong></td>
                <td>{track.artist}</td>
                <td>{track.album}</td>
                <td>{track.duration}</td>
                <td>{track.size}</td>
                <td>{track.bitrate}</td>
                <td style={{color:'#ffb300'}}>{'★'.repeat(track.rating)}{'☆'.repeat(5 - track.rating)}</td>
                <td>{track.playCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

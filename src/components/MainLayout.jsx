import { useState, useRef, useEffect } from 'react';
import useStore, { SPEED_PROFILES } from '../store/useStore';
import HomeView from './views/HomeView';
import StoreView from './views/StoreView';
import AlbumDetailsView from './views/AlbumDetailsView';
import LibraryView from './views/LibraryView';
import DownloadsView from './views/DownloadsView';
import PlaylistsView from './views/PlaylistsView';
import PlayerBar from './PlayerBar';
import { EQModal, VisualizerModal, CDBurnerModal, DeviceSyncModal, PreferencesModal, PropertiesModal, AboutModal, ConfirmModal } from './modals/Modals';
import DJChatWindow from './DJChatWindow';
import MoodMixerDialog from './MoodMixerDialog';
import GuestbookModal from './GuestbookModal';
import useDownloadTick from '../hooks/useDownloadTick';

export default function MainLayout() {
  const audioRef = useRef(null);
  useDownloadTick();

  // Close context menu on any click
  useEffect(() => {
    const handler = () => {
      const menu = document.getElementById('custom-context-menu');
      if (menu) menu.classList.add('hidden');
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
  const {
    currentView, navigateTo, goBack, connectionSpeed, userName, walletBalance, downloads,
    playlists, openModal, closeModal, showConfirm, createPlaylist, setActivePlaylist,
    historyIndex, searchQuery, setSearchQuery, allSongs, library, setCurrentSong, setIsPlaying, setRightClickedTrack, addToPlaylist
  } = useStore();

  const [searchText, setSearchText] = useState('');

  const speedProfile = SPEED_PROFILES[connectionSpeed] || SPEED_PROFILES.dsl;
  const isOffline = connectionSpeed === 'offline';

  const handleSearch = () => {
    if (!searchText.trim()) return;
    navigateTo('store');
    setSearchQuery(searchText.toLowerCase());
  };

  const handleNewPlaylist = () => {
    const name = prompt("Enter Playlist Name:", `New Playlist ${playlists.length + 1}`);
    if (name && name.trim()) createPlaylist(name.trim());
  };

  const handleContextAction = (action) => {
    const menu = document.getElementById('custom-context-menu');
    if (menu) menu.classList.add('hidden');
    const state = useStore.getState();
    const trackId = state.rightClickedTrackId;
    const track = state.library.find(t => t.id === trackId);
    if (action === 'play' && track) { setCurrentSong(track); setIsPlaying(true); }
    if (action === 'queue' && track) showConfirm("Queue", `"${track.title}" added to queue.`, null);
    if (action === 'burn') openModal('cdBurner');
    if (action === 'properties' && track) openModal('properties');
    if (action === 'delete' && track) showConfirm("Delete", `Delete "${track.title}"?`, () => useStore.getState().removeFromLibrary(track.id));
  };

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView />;
      case 'store': return <StoreView />;
      case 'albumDetails': return <AlbumDetailsView />;
      case 'library': return <LibraryView />;
      case 'downloads': return <DownloadsView />;
      case 'playlists': return <PlaylistsView />;
      default: return <HomeView />;
    }
  };

  return (
    <>
      <div className="main-window xp-window" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Title Bar */}
        <div className="xp-titlebar">
          <span className="xp-titlebar-text">
            <svg viewBox="0 0 100 100" className="xp-window-icon"><circle cx="50" cy="50" r="45" fill="#1DB954"/><path d="M25,35 Q50,20 75,35 M30,50 Q50,38 70,50 M35,65 Q50,55 65,65" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round"/></svg>
            Spotify 2006 - Local Library & Store Edition
          </span>
          <div className="xp-titlebar-controls">
            <button className="xp-btn-min">&#9584;</button>
            <button className="xp-btn-max" disabled>&#9633;</button>
            <button className="xp-btn-close" onClick={() => showConfirm("Exit", "Close Spotify 2006?", () => { document.body.innerHTML = "<div style='color:white;text-align:center;margin-top:100px'><h3>Spotify Session Closed.</h3></div>"; })}>&times;</button>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="xp-menubar">
          <div className="xp-menu-item"><span>File</span>
            <div className="xp-dropdown-menu">
              <div className="xp-dropdown-item" onClick={() => openModal('cdBurner')}>Import Audio CD...</div>
              <div className="xp-dropdown-item" onClick={() => showConfirm("Import", "Scanning directory...", () => { const s = { id: 100+library.length, file:`/songs/8.mp3`, title:"Imported Track", artist:"Various", album:"Imported Hits", year:2006, duration:"3:38", size:"4.5 MB", bitrate:"128 kbps", genre:"Various", rating:3, playCount:1, coverColor:"#9e9e9e" }; useStore.getState().addToLibrary(s); })}>Add Files to Library...</div>
              <div className="xp-dropdown-item" onClick={handleNewPlaylist}>New Playlist (Ctrl+N)</div>
              <hr />
              <div className="xp-dropdown-item" onClick={() => showConfirm("Exit", "Close Spotify?", () => {})}>Exit</div>
            </div>
          </div>
          <div className="xp-menu-item"><span>Edit</span>
            <div className="xp-dropdown-menu">
              <div className="xp-dropdown-item" onClick={() => openModal('preferences')}>Preferences...</div>
            </div>
          </div>
          <div className="xp-menu-item"><span>View</span>
            <div className="xp-dropdown-menu">
              <div className="xp-dropdown-item" onClick={() => navigateTo('home')}>Go to Home</div>
              <div className="xp-dropdown-item" onClick={() => navigateTo('store')}>Go to Store</div>
              <div className="xp-dropdown-item" onClick={() => navigateTo('library')}>Go to Library</div>
              <hr />
              <div className="xp-dropdown-item" onClick={() => openModal('visualizer')}>Visualizer Window</div>
              <div className="xp-dropdown-item" onClick={() => openModal('eq')}>Equalizer Window</div>
            </div>
          </div>
          <div className="xp-menu-item"><span>Playback</span>
            <div className="xp-dropdown-menu">
              <div className="xp-dropdown-item" onClick={() => { if (useStore.getState().currentSong) useStore.getState().setIsPlaying(!useStore.getState().isPlaying); else if (library.length) { setCurrentSong(library[0]); setIsPlaying(true); } }}>Play/Pause</div>
              <div className="xp-dropdown-item" onClick={() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } setIsPlaying(false); }}>Stop</div>
            </div>
          </div>
          <div className="xp-menu-item"><span>Tools</span>
            <div className="xp-dropdown-menu">
              <div className="xp-dropdown-item" onClick={() => openModal('cdBurner')}>CD Burner...</div>
              <div className="xp-dropdown-item" onClick={() => openModal('deviceSync')}>Device Sync...</div>
            </div>
          </div>
          <div className="xp-menu-item"><span>Help</span>
            <div className="xp-dropdown-menu">
              <div className="xp-dropdown-item" onClick={() => openModal('about')}>About Spotify 2006</div>
            </div>
          </div>
          <div className="xp-menubar-connection-badge">{isOffline ? 'Offline' : speedProfile.name.split(' (')[0]}</div>
        </div>

        {/* Toolbar */}
        <div className="xp-toolbar">
          <div className="xp-toolbar-buttons">
            <button className="xp-toolbar-btn" onClick={goBack} disabled={historyIndex <= 0}><span className="icon">&larr;</span> Back</button>
            <div className="xp-toolbar-divider"></div>
            <button className={`xp-toolbar-btn ${currentView === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}><span className="icon">&#127968;</span> Home</button>
            <button className={`xp-toolbar-btn ${currentView === 'library' ? 'active' : ''}`} onClick={() => navigateTo('library')}><span className="icon">&#128193;</span> Library</button>
            <button className={`xp-toolbar-btn ${['store', 'albumDetails'].includes(currentView) ? 'active' : ''}`} onClick={() => navigateTo('store')} disabled={isOffline}><span className="icon">💸</span> Store</button>
                <button className={`xp-toolbar-btn ${currentView === 'downloads' ? 'active' : ''}`} onClick={() => navigateTo('downloads')}><span className="icon">📥</span> Downloads {downloads.length > 0 && <span className="badge">{downloads.length}</span>}</button>
                <button className="xp-toolbar-btn" onClick={() => openModal('deviceSync')}><span className="icon">🔄</span> Sync</button>
                <div className="xp-toolbar-divider"></div>
                <button className="xp-toolbar-btn" onClick={() => openModal('djChat')}><span className="icon">🎧</span> Ask the DJ</button>
                <button className="xp-toolbar-btn" onClick={() => openModal('moodMixer')}><span className="icon">🎛️</span> Mood Mixer</button>
                <button className="xp-toolbar-btn" onClick={() => openModal('guestbook')}><span className="icon">📖</span> Guestbook</button>
          </div>
          <div className="xp-toolbar-search">
            <input type="text" placeholder="Search Store or Library..." value={searchText} onChange={e => setSearchText(e.target.value)} onKeyPress={e => { if (e.key === 'Enter') handleSearch(); }} />
            <button className="xp-button search-btn" onClick={handleSearch}>Find</button>
          </div>
        </div>

        {/* Main Body: Sidebar + Content */}
        <div className="xp-main-body" style={{ flex: 1 }}>
          {/* Sidebar */}
          <div className="xp-sidebar">
            <div className="sidebar-group">
              <div className="sidebar-header">My Music Hub</div>
              <ul className="sidebar-list">
                <li className="sidebar-item" onClick={() => navigateTo('library')}><span className="icon">&#9835;</span> Songs</li>
                <li className="sidebar-item" onClick={() => navigateTo('library')}><span className="icon">&#128191;</span> Albums</li>
                <li className="sidebar-item" onClick={() => navigateTo('library')}><span className="icon">&#128100;</span> Artists</li>
                <li className="sidebar-item" onClick={() => navigateTo('library')}><span className="icon">&#127917;</span> Genres</li>
              </ul>
            </div>
            <div className="sidebar-group">
              <div className="sidebar-header">Store</div>
              <ul className="sidebar-list">
                <li className="sidebar-item" onClick={() => navigateTo('store')} style={{ opacity: isOffline ? 0.5 : 1 }}><span className="icon">&#128184;</span> Store Front</li>
                <li className="sidebar-item"><span className="icon">&#128091;</span> Balance: <strong>${walletBalance.toFixed(2)}</strong></li>
              </ul>
            </div>
            <div className="sidebar-group">
              <div className="sidebar-header playlist-header-wrapper">
                <span>Playlists</span>
                <button className="xp-mini-btn" onClick={handleNewPlaylist}>+</button>
              </div>
              <ul className="sidebar-list">
                {playlists.map(pl => (
                  <li key={pl.id} className="sidebar-item" onClick={() => { setActivePlaylist(pl.id); navigateTo('playlists'); }}>
                    <span className="icon">&#9834;</span> {pl.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sidebar-group">
              <div className="sidebar-header">Hardware</div>
              <ul className="sidebar-list">
                <li className="sidebar-item" onClick={() => openModal('cdBurner')}><span className="icon">&#128191;</span> CD Burner</li>
                <li className="sidebar-item" onClick={() => openModal('deviceSync')}><span className="icon">&#128241;</span> MP3 Player</li>
              </ul>
            </div>
            <div className="sidebar-group">
              <div className="sidebar-header">Tools</div>
              <ul className="sidebar-list">
                <li className="sidebar-item" onClick={() => openModal('eq')}><span className="icon">&#127915;</span> 10-Band EQ</li>
                <li className="sidebar-item" onClick={() => openModal('visualizer')}><span className="icon">&#127916;</span> Visualizer</li>
                <li className="sidebar-item" onClick={() => openModal('preferences')}><span className="icon">&#128295;</span> Preferences</li>
              </ul>
            </div>
            <div className="sidebar-group">
              <div className="sidebar-header">Friend Activity</div>
              <ul className="sidebar-list">
                <li>
                  <div className="friend-row"><span className="status online"></span><span className="friend-name">John_XP</span></div>
                  <div className="friend-song">Listening to: Dani California</div>
                </li>
                <li>
                  <div className="friend-row"><span className="status away"></span><span className="friend-name">EmoKid06</span></div>
                  <div className="friend-song">Listening to: Welcome to the...</div>
                </li>
                <li>
                  <div className="friend-row"><span className="status offline"></span><span className="friend-name">Sarah_G</span></div>
                  <div className="friend-song">Offline</div>
                </li>
              </ul>
            </div>
          </div>

          {/* Content Pane */}
          <div className="xp-content-pane" id="main-content-pane">
            {renderView()}
          </div>
        </div>

        {/* Player Bar */}
        <PlayerBar audioRef={audioRef} />
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} id="main-audio" preload="auto"></audio>

      {/* Context Menu */}
      <div className="xp-context-menu hidden" id="custom-context-menu">
        <div className="context-item" onClick={() => handleContextAction('play')}>Play</div>
        <div className="context-item" onClick={() => handleContextAction('queue')}>Add to Queue</div>
        <div className="context-item" onClick={() => {
          const state = useStore.getState();
          const submenu = document.getElementById('ctx-playlists-submenu');
          if (submenu) {
            submenu.innerHTML = '';
            state.playlists.forEach(pl => {
              const div = document.createElement('div');
              div.className = 'context-item';
              div.textContent = pl.name;
              div.onclick = () => { addToPlaylist(pl.id, state.rightClickedTrackId); document.getElementById('custom-context-menu')?.classList.add('hidden'); };
              submenu.appendChild(div);
            });
          }
        }}>
          Add to Playlist &raquo;
          <div className="context-submenu" id="ctx-playlists-submenu"></div>
        </div>
        <hr />
        <div className="context-item" onClick={() => handleContextAction('burn')}>Burn to CD...</div>
        <div className="context-item" onClick={() => handleContextAction('properties')}>Properties</div>
        <hr />
        <div className="context-item delete" onClick={() => handleContextAction('delete')}>Delete Track</div>
      </div>

      {/* All Modals */}
      <EQModal />
      <VisualizerModal />
      <CDBurnerModal />
      <DeviceSyncModal />
      <PreferencesModal />
      <PropertiesModal />
      <AboutModal />
      <ConfirmModal />
      <DJChatWindow />
      <MoodMixerDialog />
      <GuestbookModal />
    </>
  );
}

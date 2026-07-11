import { create } from 'zustand';
import { songs } from '../data/songs';

const SPEED_PROFILES = {
  dialup: { name: "Dial-up (56 Kbps)", rate: 7000, display: "7.0 KB/s" },
  dsl: { name: "DSL (512 Kbps)", rate: 64000, display: "64.0 KB/s" },
  cable: { name: "Cable (2.0 Mbps)", rate: 250000, display: "250.0 KB/s" },
  lan: { name: "LAN (10+ Mbps)", rate: 1250000, display: "1.25 MB/s" },
  offline: { name: "Offline Mode", rate: 0, display: "0 KB/s" }
};

const LYRICS_DB = {
  1: "[00:10] I stretch local files to find something new\n[00:20] Gnarls Barkley is spinning, the soul is in you\n[00:30] Does that make me crazy?\n[00:40] Does that make me crazy?\n[00:50] Probably.",
  2: "[00:15] Gila Monster in the desert sands\n[00:25] Dani California plays across the lands\n[00:35] She's a lover, baby, she's a star\n[00:45] Strumming on her skeuomorphic guitar.",
  3: "[00:12] We'll do it all, everything, on our own\n[00:24] We don't need anything, or anyone\n[00:36] If I lay here, if I just lay here\n[00:48] Would you lie with me and just forget the world?",
  5: "[00:20] When I was a young boy, my father\n[00:30] Took me into the city to see a marching band\n[00:40] He said, Son, when you grow up, would you be\n[00:50] The savior of the broken, the beaten, and the damned?"
};

export { SPEED_PROFILES, LYRICS_DB };

const useStore = create((set, get) => ({
  // App phase
  appPhase: 'splash', // splash | login | main
  connectionSpeed: 'dsl',
  userName: 'Nikhil_XP',
  
  // Navigation
  currentView: 'home',
  viewHistory: ['home'],
  historyIndex: 0,
  
  // Music data
  allSongs: [...songs],
  library: [
    { ...songs[1], downloaded: true },
    { ...songs[6], downloaded: true }
  ],
  playlists: [
    { id: 1, name: "Workout Mix", tracks: [2, 7] },
    { id: 2, name: "Chillout 2006", tracks: [7] }
  ],
  downloads: [],
  
  // Player state
  currentSong: null,
  isPlaying: false,
  playQueue: [],
  
  // Wallet / storage
  walletBalance: 15.00,
  bandwidthUsed: 0.0,
  diskSpaceFree: 74.2,
  
  // Selections
  activePlaylistId: null,
  selectedLibraryTrackId: null,
  rightClickedTrackId: null,
  activeTheme: 'luna-blue',
  
  // Modals
  openModals: {},
  
  // Confirm dialog
  confirmDialog: null,
  
  // Search
  searchQuery: '',
  
  // Details
  selectedAlbumName: null,

  // -- Actions --
  setAppPhase: (phase) => set({ appPhase: phase }),
  
  login: (speed, email) => {
    const userName = (email || 'user').split('@')[0] + "_XP";
    set({ connectionSpeed: speed, userName, appPhase: 'main' });
  },
  
  navigateTo: (view, params = {}) => {
    const state = get();
    let newHistory = state.viewHistory.slice(0, state.historyIndex + 1);
    if (state.currentView !== view) newHistory.push(view);
    set({
      currentView: view,
      viewHistory: newHistory,
      historyIndex: newHistory.length - 1,
      ...(params.selectedAlbumName !== undefined ? { selectedAlbumName: params.selectedAlbumName } : {}),
    });
  },
  
  goBack: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({ historyIndex: newIndex, currentView: state.viewHistory[newIndex] });
    }
  },
  
  openModal: (id) => set((s) => ({ openModals: { ...s.openModals, [id]: true } })),
  closeModal: (id) => set((s) => { const m = { ...s.openModals }; delete m[id]; return { openModals: m }; }),
  
  showConfirm: (title, message, onConfirm) => set({ confirmDialog: { title, message, onConfirm } }),
  clearConfirm: () => set({ confirmDialog: null }),
  
  // Library management
  addToLibrary: (song) => set((s) => {
    if (s.library.some(t => t.id === song.id)) return {};
    return { library: [...s.library, { ...song, downloaded: true }] };
  }),
  
  removeFromLibrary: (songId) => set((s) => ({
    library: s.library.filter(t => t.id !== songId),
    selectedLibraryTrackId: s.selectedLibraryTrackId === songId ? null : s.selectedLibraryTrackId,
    currentSong: s.currentSong && s.currentSong.id === songId ? null : s.currentSong,
  })),
  
  selectLibraryTrack: (id) => set({ selectedLibraryTrackId: id }),
  setRightClickedTrack: (id) => set({ rightClickedTrackId: id }),
  
  // Playlist management
  createPlaylist: (name) => {
    const id = Date.now();
    set((s) => ({ playlists: [...s.playlists, { id, name, tracks: [] }], activePlaylistId: id }));
    return id;
  },
  renamePlaylist: (id, name) => set((s) => ({
    playlists: s.playlists.map(p => p.id === id ? { ...p, name } : p)
  })),
  deletePlaylist: (id) => set((s) => ({
    playlists: s.playlists.filter(p => p.id !== id),
    activePlaylistId: s.activePlaylistId === id ? null : s.activePlaylistId,
  })),
  addToPlaylist: (playlistId, trackId) => set((s) => ({
    playlists: s.playlists.map(p => p.id === playlistId && !p.tracks.includes(trackId) ? { ...p, tracks: [...p.tracks, trackId] } : p)
  })),
  removeFromPlaylist: (playlistId, trackId) => set((s) => ({
    playlists: s.playlists.map(p => p.id === playlistId ? { ...p, tracks: p.tracks.filter(t => t !== trackId) } : p)
  })),
  setActivePlaylist: (id) => set({ activePlaylistId: id }),
  
  // Downloads
  addDownload: (song) => set((s) => {
    if (s.downloads.some(d => d.id === song.id)) return {};
    if (s.library.some(t => t.id === song.id)) return {};
    return {
      downloads: [...s.downloads, {
        id: song.id, songObj: song,
        sizeMB: parseFloat(song.size.replace(' MB', '')),
        bytesDownloaded: 0, progress: 0,
        speed: "Waiting...", eta: "Waiting...", status: "Downloading"
      }]
    };
  }),
  
  updateDownload: (id, updates) => set((s) => ({
    downloads: s.downloads.map(d => d.id === id ? { ...d, ...updates } : d)
  })),
  
  completeDownload: (id) => {
    const state = get();
    const dl = state.downloads.find(d => d.id === id);
    if (!dl) return;
    get().addToLibrary(dl.songObj);
    set((s) => ({
      downloads: s.downloads.filter(d => d.id !== id),
      bandwidthUsed: s.bandwidthUsed + dl.sizeMB,
      diskSpaceFree: s.diskSpaceFree - (dl.sizeMB / 1024),
    }));
  },
  
  cancelDownload: (id) => set((s) => ({ downloads: s.downloads.filter(d => d.id !== id) })),
  
  // Player
  setCurrentSong: (song) => set({ currentSong: song }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  incrementPlayCount: (songId) => set((s) => ({
    library: s.library.map(t => t.id === songId ? { ...t, playCount: (t.playCount || 0) + 1 } : t),
    currentSong: s.currentSong && s.currentSong.id === songId ? { ...s.currentSong, playCount: (s.currentSong.playCount || 0) + 1 } : s.currentSong,
  })),
  rateSong: (songId, rating) => set((s) => ({
    library: s.library.map(t => t.id === songId ? { ...t, rating } : t),
    currentSong: s.currentSong && s.currentSong.id === songId ? { ...s.currentSong, rating } : s.currentSong,
  })),
  
  // Wallet
  deductWallet: (amount) => set((s) => ({ walletBalance: Math.max(0, s.walletBalance - amount) })),
  
  // Theme
  setTheme: (theme) => {
    document.body.className = theme !== 'luna-blue' ? `theme-${theme}` : '';
    set({ activeTheme: theme });
  },
  
  // Search
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedAlbum: (name) => set({ selectedAlbumName: name }),
}));

export default useStore;

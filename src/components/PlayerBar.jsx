import { useRef, useEffect, useCallback } from 'react';
import useStore, { LYRICS_DB } from '../store/useStore';
import { initAudio, resumeAudioContext } from '../audio/audioEngine';

export default function PlayerBar({ audioRef }) {
  const { currentSong, isPlaying, library, setIsPlaying, setCurrentSong, incrementPlayCount, rateSong, openModal } = useStore();
  const timeElapsedRef = useRef(null);
  const timeTotalRef = useRef(null);
  const timelineRef = useRef(null);
  const volumeRef = useRef(null);
  const playIconRef = useRef(null);
  const hasIncrementedRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (currentSong.file && audio.src !== window.location.origin + currentSong.file) {
      initAudio(audio);
      resumeAudioContext();
      audio.src = currentSong.file;
      hasIncrementedRef.current = false;
      audio.play().then(() => {
        setIsPlaying(true);
        if (!hasIncrementedRef.current) {
          incrementPlayCount(currentSong.id);
          hasIncrementedRef.current = true;
        }
      }).catch(() => {});
    }
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { resumeAudioContext(); audio.play().catch(() => {}); }
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      if (timelineRef.current) timelineRef.current.value = pct;
      if (timeElapsedRef.current) timeElapsedRef.current.textContent = formatTime(audio.currentTime);
    };
    const onMeta = () => {
      if (timeTotalRef.current) timeTotalRef.current.textContent = formatTime(audio.duration);
    };
    const onEnded = () => {
      const state = useStore.getState();
      const lib = state.library;
      const curr = state.currentSong;
      if (curr && lib.length > 0) {
        const idx = lib.findIndex(s => s.id === curr.id);
        const next = lib[(idx + 1) % lib.length];
        state.setCurrentSong(next);
        state.setIsPlaying(true);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioRef]);

  const togglePlayback = useCallback(() => {
    if (!currentSong) {
      if (library.length > 0) { setCurrentSong(library[0]); setIsPlaying(true); }
      return;
    }
    setIsPlaying(!isPlaying);
  }, [currentSong, isPlaying, library]);

  const stopTrack = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setIsPlaying(false);
  }, [audioRef]);

  const prevNext = useCallback((dir) => {
    if (library.length === 0 || !currentSong) return;
    const idx = library.findIndex(s => s.id === currentSong.id);
    let next = idx + dir;
    if (next >= library.length) next = 0;
    if (next < 0) next = library.length - 1;
    setCurrentSong(library[next]);
    setIsPlaying(true);
  }, [library, currentSong]);

  const handleTimeline = (e) => {
    const audio = audioRef.current;
    if (audio && audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
  };

  const handleVolume = (e) => {
    const audio = audioRef.current;
    if (audio) audio.volume = e.target.value / 100;
  };

  const handleRatingClick = (e) => {
    if (!currentSong) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    rateSong(currentSong.id, Math.ceil(pct * 5));
  };

  const stars = currentSong ? '★'.repeat(currentSong.rating) + '☆'.repeat(5 - currentSong.rating) : '☆☆☆☆☆';

  return (
    <div className="xp-player-bar">
      <div className="player-track-info">
        <div className="mini-album-art" style={{ background: currentSong?.coverColor || '#ccc' }}>
          <span>{currentSong ? currentSong.title[0] : '♪'}</span>
        </div>
        <div className="mini-track-meta">
          <span className="track-title">{currentSong?.title || 'No track selected'}</span>
          <span className="track-artist">{currentSong?.artist || 'Select a song from Library'}</span>
          <div className="track-extra">
            <span>{currentSong?.bitrate || '192 kbps'}</span>
            <span className="divider">|</span>
            <span className="rating-stars" onClick={handleRatingClick}>{stars}</span>
          </div>
        </div>
      </div>
      <div className="player-controls-panel">
        <div className="player-buttons">
          <button className="player-btn" onClick={() => prevNext(-1)} title="Previous"><span>&#9664;&#9664;</span></button>
          <button className="player-btn primary" onClick={togglePlayback} title="Play/Pause"><span ref={playIconRef}>{isPlaying ? '❚❚' : '▶'}</span></button>
          <button className="player-btn" onClick={stopTrack} title="Stop"><span>&#9632;</span></button>
          <button className="player-btn" onClick={() => prevNext(1)} title="Next"><span>&#9654;&#9654;</span></button>
        </div>
        <div className="player-timeline-wrapper">
          <span className="time-elapsed" ref={timeElapsedRef}>0:00</span>
          <div className="xp-slider-container"><input type="range" ref={timelineRef} defaultValue="0" min="0" max="100" step="0.1" onInput={handleTimeline} /></div>
          <span className="time-total" ref={timeTotalRef}>0:00</span>
        </div>
      </div>
      <div className="player-utils-panel">
        <button className="player-icon-btn" onClick={() => { if (currentSong) openModal('lyrics'); }}>Lyrics</button>
        <button className="player-icon-btn" onClick={() => openModal('eq')}>EQ</button>
        <button className="player-icon-btn" onClick={() => openModal('visualizer')}>Visuals</button>
        <div className="player-volume-wrapper">
          <span className="speaker-icon">&#128266;</span>
          <div className="xp-slider-container"><input type="range" ref={volumeRef} defaultValue="70" min="0" max="100" onInput={handleVolume} /></div>
        </div>
      </div>
    </div>
  );
}

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

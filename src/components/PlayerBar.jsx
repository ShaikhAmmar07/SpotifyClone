import { useRef, useEffect, useCallback, useState } from 'react';
import useStore from '../store/useStore';
import { initAudio, resumeAudioContext } from '../audio/audioEngine';
import { songs } from '../data/songs';
import { GoogleGenAI } from '@google/genai';

export default function PlayerBar({ audioRef }) {
  const { 
    currentSong, isPlaying, library, setIsPlaying, setCurrentSong, incrementPlayCount, rateSong, openModal,
    smartShuffleActive, lastPlayed, addToLastPlayed, toggleSmartShuffle
  } = useStore();
  const timeElapsedRef = useRef(null);
  const timeTotalRef = useRef(null);
  const timelineRef = useRef(null);
  const volumeRef = useRef(null);
  const playIconRef = useRef(null);
  const hasIncrementedRef = useRef(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendationText, setRecommendationText] = useState('');

  useEffect(() => {
    if (currentSong) {
      addToLastPlayed(currentSong);
    }
  }, [currentSong?.id, addToLastPlayed]);

  const getAIRecommendation = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('API Key loaded:', !!apiKey);
    if (!apiKey || !currentSong) {
      // Fallback to random
      const available = songs.filter(s => !lastPlayed.some(p => p.id === s.id));
      const fallback = available.length > 0 
        ? available[Math.floor(Math.random() * available.length)] 
        : songs[Math.floor(Math.random() * songs.length)];
      return { nextSong: fallback, reason: "Random bop for you!" };
    }

    try {
      const client = new GoogleGenAI({ apiKey });
      
      const prompt = `
Current song: ${currentSong.title} by ${currentSong.artist}
Last played: ${lastPlayed.map(s => s.title + " by " + s.artist).join(", ")}
All available songs (id, title, artist, album):
${songs.map(s => `${s.id}: ${s.title} by ${s.artist} from ${s.album}`).join("\n")}

Please pick the next song that flows best! Return ONLY valid JSON like this:
{"nextSongId": song_id, "reason": "one sentence why this fits"}
`;

      console.log('Sending to Gemini:', prompt);

      const result = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      const responseText = result.text ?? '';
      
      let jsonStr = responseText;
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
      }
      const parsed = JSON.parse(jsonStr);
      
      const nextSong = songs.find(s => s.id === parsed.nextSongId) || songs[0];
      return { nextSong, reason: parsed.reason };
    } catch (e) {
      console.error("AI error", e);
      // Fallback
      const available = songs.filter(s => !lastPlayed.some(p => p.id === s.id));
      const fallback = available.length > 0 
        ? available[Math.floor(Math.random() * available.length)] 
        : songs[Math.floor(Math.random() * songs.length)];
      return { nextSong: fallback, reason: "Random bop for you!" };
    }
  }, [currentSong, lastPlayed]);

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
    const onEnded = async () => {
      const state = useStore.getState();
      if (state.smartShuffleActive) {
        setAiLoading(true);
        setRecommendationText('🎧 DJ is mixing...');
        // Fake 2-3s delay
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
        const rec = await getAIRecommendation();
        setCurrentSong(rec.nextSong);
        setRecommendationText(`🎧 DJ recommends: ${rec.nextSong.title} - ${rec.reason}`);
        setIsPlaying(true);
        setAiLoading(false);
      } else {
        const lib = state.library;
        const curr = state.currentSong;
        if (curr && lib.length > 0) {
          const idx = lib.findIndex(s => s.id === curr.id);
          const next = lib[(idx + 1) % lib.length];
          state.setCurrentSong(next);
          state.setIsPlaying(true);
        }
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

  const prevNext = useCallback(async (dir) => {
    if (library.length === 0 || !currentSong) return;

    if (dir === 1 && smartShuffleActive) {
      // Next with AI
      setAiLoading(true);
      setRecommendationText('🎧 DJ is mixing...');
      // Fake 2-3s delay
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      const rec = await getAIRecommendation();
      setCurrentSong(rec.nextSong);
      setRecommendationText(`🎧 DJ recommends: ${rec.nextSong.title} - ${rec.reason}`);
      setIsPlaying(true);
      setAiLoading(false);
    } else {
      // Normal prev/next
      const idx = library.findIndex(s => s.id === currentSong.id);
      let next = idx + dir;
      if (next >= library.length) next = 0;
      if (next < 0) next = library.length - 1;
      setCurrentSong(library[next]);
      setIsPlaying(true);
    }
  }, [library, currentSong, smartShuffleActive, getAIRecommendation]);

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
            {recommendationText && <span className="divider">|</span>}
            {recommendationText && <span style={{ fontSize: '10px', color: '#0066cc' }}>{recommendationText}</span>}
          </div>
        </div>
      </div>
      <div className="player-controls-panel">
        <div className="player-buttons">
          <button className="player-btn" onClick={() => prevNext(-1)} title="Previous"><span>&#9664;&#9664;</span></button>
          <button className="player-btn primary" onClick={togglePlayback} title="Play/Pause"><span ref={playIconRef}>{isPlaying ? '❚❚' : '▶'}</span></button>
          <button className="player-btn" onClick={stopTrack} title="Stop"><span>&#9632;</span></button>
          <button className="player-btn" onClick={(e) => { if (aiLoading) { window.playErrorSound?.(); } else { prevNext(1); } }} title="Next" disabled={aiLoading}>
            {aiLoading ? '...' : '▶▶'}
          </button>
        </div>
        <div className="player-timeline-wrapper">
          <span className="time-elapsed" ref={timeElapsedRef}>0:00</span>
          <div className="xp-slider-container"><input type="range" ref={timelineRef} defaultValue="0" min="0" max="100" step="0.1" onInput={handleTimeline} /></div>
          <span className="time-total" ref={timeTotalRef}>0:00</span>
        </div>
      </div>
      <div className="player-utils-panel">
        <button 
          className={`player-icon-btn ${smartShuffleActive ? 'smart-shuffle-active' : ''}`} 
          onClick={toggleSmartShuffle}
          title="Smart Shuffle"
        >
          🎧 Smart Shuffle
        </button>
        <button className="player-icon-btn" onClick={() => openModal('eq')}>EQ</button>
        <button className="player-icon-btn" onClick={() => openModal('visualizer')}>Visuals</button>
        <div className="player-volume-wrapper">
          <span className="speaker-icon">&#128266;</span>
          <div className="xp-slider-container"><input type="range" ref={volumeRef} defaultValue="70" min="0" max="100" onInput={handleVolume} /></div>
        </div>
      </div>
      <style jsx>{`
        .smart-shuffle-active {
          background: linear-gradient(135deg, #1db954, #1ed760);
          color: white;
          font-weight: bold;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 5px #1db954; }
          50% { box-shadow: 0 0 15px #1db954, 0 0 25px #1ed760; }
        }
      `}</style>
    </div>
  );
}

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

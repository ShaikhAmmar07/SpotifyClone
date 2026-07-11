import { useState } from 'react';
import useStore from '../store/useStore';
import { songs } from '../data/songs';
import { GoogleGenAI } from '@google/genai';

const MoodMixerDialog = () => {
  const { openModals, closeModal, createPlaylist, setCurrentSong, setIsPlaying } = useStore();
  const [step, setStep] = useState(1); // 1: input, 2: loading, 3: results
  const [mood, setMood] = useState('');
  const [progress, setProgress] = useState(0);
  const [generatedSongs, setGeneratedSongs] = useState([]);
  const [loadingText, setLoadingText] = useState('Generating your perfect playlist...');

  const mockFallbackPlaylists = {
    sad: [1, 3, 7, 5],
    happy: [2, 4, 8, 10],
    party: [2, 4, 8, 10, 1],
    study: [3, 1, 7],
    workout: [2, 8, 10]
  };

  const getFallbackPlaylist = (moodDesc) => {
    const lowerMood = moodDesc.toLowerCase();
    let selectedIds = [];
    if (lowerMood.includes('sad') || lowerMood.includes('rainy')) {
      selectedIds = mockFallbackPlaylists.sad;
    } else if (lowerMood.includes('happy') || lowerMood.includes('dance')) {
      selectedIds = mockFallbackPlaylists.happy;
    } else if (lowerMood.includes('party') || lowerMood.includes('rock')) {
      selectedIds = mockFallbackPlaylists.party;
    } else if (lowerMood.includes('study') || lowerMood.includes('chill')) {
      selectedIds = mockFallbackPlaylists.study;
    } else {
      selectedIds = mockFallbackPlaylists.workout;
    }
    return selectedIds.map(id => {
      const song = songs.find(s => s.id === id);
      return {
        ...song,
        reason: 'Perfect for your vibe!'
      };
    });
  };

  const generatePlaylist = async () => {
    if (!mood.trim()) return;
    setStep(2);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      let selectedSongs = [];
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (apiKey) {
        try {
          const client = new GoogleGenAI({ apiKey });
          
          const prompt = `
Given a user's mood: "${mood}"
And available songs (id, title, artist, album, year):
${songs.map(s => `${s.id}: "${s.title}" by ${s.artist} from ${s.album} (${s.year})`).join('\n')}

Please select 10 songs that match the mood. Return ONLY valid JSON with NO extra text. The JSON format should be:
{
  "songs": [
    {
      "id": song_id,
      "title": "song title",
      "artist": "artist name",
      "album": "album name",
      "duration": "duration string",
      "reason": "one sentence why this song fits the mood"
    }
  ]
}
`;
          const result = await client.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
          const responseText = result.text ?? '';
          
          // Try to extract JSON
          let jsonStr = responseText;
          const jsonStart = jsonStr.indexOf('{');
          const jsonEnd = jsonStr.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
          }
          const parsed = JSON.parse(jsonStr);
          selectedSongs = parsed.songs;
        } catch (e) {
          console.error('AI error', e);
          selectedSongs = getFallbackPlaylist(mood);
        }
      } else {
        selectedSongs = getFallbackPlaylist(mood);
      }

      // Ensure all songs are from our database
      selectedSongs = selectedSongs.map(s => {
        const dbSong = songs.find(song => song.id === s.id);
        return dbSong ? { ...dbSong, reason: s.reason || 'Perfect for your vibe!' } : null;
      }).filter(Boolean);

      setGeneratedSongs(selectedSongs);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setStep(3), 500);
    } catch (e) {
      console.error('Error', e);
      clearInterval(interval);
      setGeneratedSongs(getFallbackPlaylist(mood));
      setStep(3);
    }
  };

  const savePlaylist = () => {
    const playlistName = `${mood.substring(0, 20)} Mix`;
    const id = createPlaylist(playlistName);
    generatedSongs.forEach(song => {
      useStore.getState().addToPlaylist(id, song.id);
    });
    closeModal('moodMixer');
    setStep(1);
    setMood('');
    setGeneratedSongs([]);
  };

  const playSong = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const reset = () => {
    setStep(1);
    setMood('');
    setGeneratedSongs([]);
    setProgress(0);
  };

  if (!openModals.moodMixer) return null;

  return (
    <div className="xp-modal" onClick={(e) => { if (e.target === e.currentTarget) closeModal('moodMixer'); }}>
      <div className="xp-window dialog-window" style={{ width: '600px' }}>
        <div className="xp-titlebar">
          <span className="xp-titlebar-text">🎛️ Mood Mixer - Playlist Generator Wizard</span>
          <div className="xp-titlebar-controls">
            <button className="xp-btn-close" onClick={() => closeModal('moodMixer')}>×</button>
          </div>
        </div>
        <div className="xp-window-body" style={{ padding: '20px' }}>
          {step === 1 && (
            <div>
              <h3 style={{ marginBottom: '15px', color: '#003399' }}>Step 1: Describe Your Mood</h3>
              <p style={{ marginBottom: '15px' }}>Tell us what you're feeling, and we'll make a perfect playlist!</p>
              <textarea
                style={{ width: '100%', height: '100px', padding: '8px', fontFamily: 'Tahoma', fontSize: '11px', border: '1px solid #7f9db9' }}
                placeholder="e.g., sad rainy day studying, or party rock anthem night!"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="xp-button" onClick={() => closeModal('moodMixer')}>Cancel</button>
                <button className="xp-button primary" onClick={generatePlaylist} style={{ marginLeft: '8px' }}>Next</button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h3 style={{ marginBottom: '15px', color: '#003399' }}>Step 2: Generating...</h3>
              <p>{loadingText}</p>
              <div className="xp-progress-bar" style={{ marginTop: '15px', height: '20px' }}>
                <div className="xp-progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="xp-button" disabled>Cancel</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h3 style={{ marginBottom: '15px', color: '#003399' }}>Step 3: Your Playlist is Ready!</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #aca899', borderRadius: '2px' }}>
                <table className="xp-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Title</th>
                      <th>Artist</th>
                      <th style={{ width: '80px' }}>Play</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedSongs.map((song, i) => (
                      <tr key={song.id} className={i % 2 === 0 ? '' : 'even-row'}>
                        <td>{i+1}</td>
                        <td>
                          <strong>{song.title}</strong>
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{song.reason}</div>
                        </td>
                        <td>{song.artist}</td>
                        <td><button className="xp-button small" onClick={() => playSong(song)}>Play</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="xp-button" onClick={reset}>Regenerate</button>
                <button className="xp-button" onClick={() => closeModal('moodMixer')} style={{ marginLeft: '8px' }}>Cancel</button>
                <button className="xp-button primary" onClick={savePlaylist} style={{ marginLeft: '8px' }}>Save Playlist</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .even-row { background-color: #f0f0f0; }
      `}</style>
    </div>
  );
};

export default MoodMixerDialog;

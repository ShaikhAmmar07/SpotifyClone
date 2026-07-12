import { useState } from 'react';
import useStore from '../store/useStore';
import { songs } from '../data/songs';
import { GoogleGenAI } from '@google/genai';
import { mapUserMoodToDbMoods, findMatchingSong } from '../utils/moodMapper';

const MoodMixerDialog = () => {
  const { openModals, closeModal, createPlaylist, setCurrentSong, setIsPlaying } = useStore();
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState('');
  const [progress, setProgress] = useState(0);
  const [generatedSongs, setGeneratedSongs] = useState([]);
  const [loadingText, setLoadingText] = useState('Generating your perfect playlist...');

  const localLibraryCatalog = songs.map((song) => {
    return `${song.id}. ${song.title} by ${song.artist} | ${song.genre} | ${song.mood} | ${song.year} | ${song.duration}`;
  }).join('\n');

  const generatePlaylist = async () => {
    if (!mood.trim()) return;
    setStep(2);
    setProgress(0);

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
      let validSongs = [];
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (apiKey) {
        try {
          const client = new GoogleGenAI({ apiKey });
          
          const prompt = `
Given a user's mood: "${mood}"
Only use songs from this local library. Do not invent any songs.

Available songs (id, title, artist, album, genre, mood, year, duration):
${localLibraryCatalog}

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

          // 1. Get target moods based on user input
          const targetMoods = mapUserMoodToDbMoods(mood);

          // 2. Parse AI response
          let aiSongs = [];
          try {
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
            const parsed = JSON.parse(jsonStr);
            aiSongs = parsed.songs || [];
          } catch (e) {
            console.error('JSON parse error:', e);
            aiSongs = [];
          }

          // 3. STRICT FILTER: Only keep songs that exist in our DB AND match target moods
          validSongs = aiSongs
            .map(aiSong => findMatchingSong(aiSong, songs))
            .filter(dbSong => dbSong && targetMoods.includes(dbSong.mood));

          // 4. If AI failed to find enough valid songs, fill from local DB using target moods
          if (validSongs.length < 10) {
            const fallbackSongs = songs
              .filter(s => targetMoods.includes(s.mood) && !validSongs.find(v => v.id === s.id))
              .sort(() => 0.5 - Math.random())
              .slice(0, 10 - validSongs.length);
            validSongs.push(...fallbackSongs);
          }
        } catch (e) {
          console.error('AI error:', e);
          validSongs = getFallbackByMoods(mapUserMoodToDbMoods(mood));
        }
      } else {
        validSongs = getFallbackByMoods(mapUserMoodToDbMoods(mood));
      }

      // Ensure we have songs
      if (validSongs.length === 0) {
        validSongs = getFallbackByMoods(['happy', 'energetic', 'chill', 'calm', 'romantic']);
      }

      // Format for UI
      const formattedSongs = validSongs.map((song, idx) => ({
        ...song,
        reason: song.reason || 'Perfect for your vibe!'
      }));

      setGeneratedSongs(formattedSongs);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setStep(3), 500);
    } catch (e) {
      console.error('Error:', e);
      clearInterval(interval);
      setGeneratedSongs(getFallbackByMoods(['happy', 'energetic', 'chill', 'calm', 'romantic']));
      setStep(3);
    }
  };

  const getFallbackByMoods = (targetMoods) => {
    return songs
      .filter(s => targetMoods.includes(s.mood))
      .sort(() => 0.5 - Math.random())
      .slice(0, 10)
      .map(song => ({ ...song, reason: 'Perfect for your vibe!' }));
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

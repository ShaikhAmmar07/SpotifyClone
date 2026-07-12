export const mapUserMoodToDbMoods = (userInput) => {
  const input = userInput.toLowerCase();
  if (input.includes('sad') || input.includes('cry') || input.includes('depress') || input.includes('heartbreak')) return ['sad', 'melancholic', 'emotional'];
  if (input.includes('chill') || input.includes('study') || input.includes('relax') || input.includes('sleep')) return ['chill', 'calm'];
  if (input.includes('workout') || input.includes('party') || input.includes('hype') || input.includes('gym')) return ['energetic', 'happy'];
  if (input.includes('love') || input.includes('date') || input.includes('romantic')) return ['romantic'];
  if (input.includes('old') || input.includes('memory') || input.includes('nostalgia') || input.includes('retro')) return ['nostalgic'];
  // Default fallback
  return ['happy', 'energetic', 'chill', 'calm', 'romantic', 'sad', 'melancholic', 'emotional', 'nostalgic'];
};

export const findMatchingSong = (aiSong, songs) => {
  return songs.find(dbSong => 
    dbSong.title.toLowerCase().includes(aiSong.title.toLowerCase()) || 
    dbSong.artist.toLowerCase().includes(aiSong.artist.toLowerCase())
  );
};

export const getMoodCompatibleSongs = (currentSong, songs, excludeIds = []) => {
  if (!currentSong) return [];
  return songs.filter(s => 
    !excludeIds.includes(s.id) &&
    s.id !== currentSong.id && 
    (s.mood === currentSong.mood || s.genre === currentSong.genre)
  );
};
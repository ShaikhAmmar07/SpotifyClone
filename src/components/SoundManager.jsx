import { useEffect, useState } from 'react';

export default function SoundManager({ children }) {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('xp_sounds_muted') === 'true';
  });

  const playSound = (soundFile) => {
    if (isMuted) return;
    try {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Sound play failed:', err));
    } catch (err) {
      console.log('Sound error:', err);
    }
  };

  useEffect(() => {
    const playStartup = () => {
      playSound('Start.mp3');
      window.removeEventListener('click', playStartup);
      window.removeEventListener('keydown', playStartup);
    };
    
    window.addEventListener('click', playStartup);
    window.addEventListener('keydown', playStartup);
    
    return () => {
      window.removeEventListener('click', playStartup);
      window.removeEventListener('keydown', playStartup);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      playSound('Shutdown.mp3');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.closest('button, a, [role="button"], input[type="submit"]')) {
        playSound('mouse-click.mp3');
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isMuted]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        playSound('key-press.mp3');
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isMuted]);

  useEffect(() => {
    window.playXPSound = playSound;
    window.playErrorSound = () => playSound('error-sound.mp3');
  }, [playSound]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('xp_sounds_muted', newMuted);
  };

  return (
    <>
      {children}
      <button
        onClick={toggleMute}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          zIndex: 9999,
          padding: '8px 12px',
          background: '#ECE9D8',
          border: '2px outset #fff',
          fontFamily: 'Tahoma, sans-serif',
          fontSize: '11px',
          cursor: 'pointer'
        }}
        title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      >
        {isMuted ? '🔇 Muted' : '🔊 Sound On'}
      </button>
    </>
  );
}
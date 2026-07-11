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
    const handleClick = (e) => {
      if (isMuted) return;
      
      const target = e.target;
      const isInteractive = 
        target.closest('button') || 
        target.closest('a') || 
        target.closest('tr') || 
        target.closest('.clickable') || 
        target.closest('.xp-window') ||
        target.closest('.xp-titlebar') ||
        target.closest('.sidebar-item') ||
        target.closest('.xp-menu-item') ||
        target.closest('.xp-dropdown-item') ||
        target.closest('.xp-toolbar-btn') ||
        target.closest('.context-item') ||
        target.closest('.xp-tab-btn') ||
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' ||
        target.tagName === 'OPTION';

      if (isInteractive) {
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
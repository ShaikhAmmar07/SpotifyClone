import { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import useStore from '../store/useStore';

const DEFAULT_ENTRIES = [
  { id: 1, name: 'xX_DarkAngel_Xx', message: 'Cool site! Check out mine :D', color: '#FF00FF', date: '2006-03-15T14:30:00' },
  { id: 2, name: 'SkaterBoi2006', message: 'OMG this music player is totally rad! Keep it up!', color: '#00FF00', date: '2006-04-22T18:15:00' },
  { id: 3, name: 'PinkPrincess', message: 'Love the XP theme! Reminds me of my old computer <3', color: '#FF69B4', date: '2006-05-10T09:45:00' }
];

const STORAGE_KEY = 'guestbook_entries';
const COLORS = ['#FF00FF', '#00FF00', '#FF69B4', '#00BFFF', '#FFFF00', '#FF4500', '#9932CC', '#000000'];

const formatTimestamp = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const datePart = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const hour = d.getHours();
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, '0');
  return `Posted on: ${datePart} at ${hour12}:${min} ${suffix}`;
};

const replaceEmoticons = (text) => {
  const emoticons = {
    ':D': '😀',
    ':)': '🙂',
    '<3': '❤️',
    ';)': '😉',
    ':(': '🙁',
    ':P': '😛',
    'XD': '😆'
  };
  return text.replace(/:D|:\) |<3|;\)|:\(|:P|XD/g, (m) => emoticons[m] || m);
};

function GuestbookModal() {
  const { openModals, closeModal, showConfirm } = useStore();
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_ENTRIES;
  });
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('#FF00FF');
  const nodeRef = useRef(null);
  const entriesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    if (openModals.guestbook) {
      setTimeout(() => {
        entriesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [openModals.guestbook, entries]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) return;
    const newEntry = {
      id: Date.now(),
      name: trimmedName,
      message: trimmedMessage,
      color,
      date: new Date().toISOString()
    };
    setEntries((prev) => [...prev, newEntry]);
    setName('');
    setMessage('');
  };

  const handleClearAll = () => {
    showConfirm(
      'Clear Guestbook',
      'Are you sure you want to erase all guestbook entries? This cannot be undone! ;_;',
      () => setEntries([])
    );
  };

  if (!openModals.guestbook) return null;

  return (
    <div className="xp-modal" onClick={(e) => { if (e.target === e.currentTarget) closeModal('guestbook'); }}>
      <Draggable nodeRef={nodeRef} handle=".xp-titlebar">
        <div
          className="xp-window dialog-window"
          ref={nodeRef}
          style={{ width: '480px', maxHeight: '85vh' }}
        >
          <div className="xp-titlebar" style={{ cursor: 'move' }}>
            <span className="xp-titlebar-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>📖</span>
              Sign My Guestbook!
            </span>
            <div className="xp-titlebar-controls">
              <button className="xp-btn-close" onClick={() => closeModal('guestbook')}>×</button>
            </div>
          </div>

          <div className="xp-window-body" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '70vh', overflow: 'hidden' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontFamily: 'Tahoma, sans-serif', fontSize: '11px', fontWeight: 'bold', minWidth: '60px' }}>
                  Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  maxLength={32}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    border: '1px solid #7f9db9',
                    fontFamily: 'Tahoma, sans-serif',
                    fontSize: '11px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <label style={{ fontFamily: 'Tahoma, sans-serif', fontSize: '11px', fontWeight: 'bold', minWidth: '60px', marginTop: '6px' }}>
                  Message:
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a message..."
                  maxLength={500}
                  rows={4}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    border: '1px solid #7f9db9',
                    fontFamily: 'Tahoma, sans-serif',
                    fontSize: '11px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <label style={{ fontFamily: 'Tahoma, sans-serif', fontSize: '11px', fontWeight: 'bold' }}>
                  Text Color:
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: '32px', height: '24px', padding: 0, border: '1px solid #7f9db9', cursor: 'pointer', background: '#fff' }}
                />
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    title={c}
                    style={{
                      width: '18px',
                      height: '18px',
                      background: c,
                      border: color === c ? '2px solid #000' : '1px solid #888',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                <button type="button" className="xp-button" onClick={handleClearAll}>
                  Clear All
                </button>
                <button
                  type="submit"
                  className="xp-button primary"
                  disabled={!name.trim() || !message.trim()}
                >
                  Sign Guestbook!
                </button>
              </div>
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid #aca899', margin: '4px 0' }} />

            <div style={{ fontFamily: 'Tahoma, sans-serif', fontSize: '11px', fontWeight: 'bold', color: '#003399' }}>
              ✨ Previous Entries ({entries.length}):
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid #aca899',
                background: '#fff',
                padding: '8px',
                maxHeight: '260px',
                minHeight: '120px'
              }}
            >
              {entries.length === 0 && (
                <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', padding: '20px', fontFamily: 'Tahoma, sans-serif', fontSize: '11px' }}>
                  No entries yet... be the first to sign! :D
                </div>
              )}
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '8px',
                    marginBottom: idx === entries.length - 1 ? 0 : '8px',
                    border: '1px dashed #d4d0c8',
                    background: '#fffdf5',
                    fontFamily: '"Comic Sans MS", Tahoma, sans-serif'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: entry.color, fontSize: '13px', textShadow: '1px 1px 0 #fff' }}>
                    {entry.name} says:
                  </div>
                  <div style={{ color: entry.color, margin: '4px 0', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {replaceEmoticons(entry.message)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888', fontStyle: 'italic', marginTop: '4px' }}>
                    {formatTimestamp(entry.date)}
                  </div>
                </div>
              ))}
              <div ref={entriesEndRef} />
            </div>

            <div style={{ textAlign: 'center', fontFamily: '"Comic Sans MS", Tahoma, sans-serif', fontSize: '10px', color: '#9932CC', marginTop: '4px' }}>
              ~*~ Thanks for visiting! Sign my guestbook! ~*~
            </div>
          </div>
        </div>
      </Draggable>
    </div>
  );
}

export default GuestbookModal;

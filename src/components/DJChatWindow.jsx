import { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import useStore from '../store/useStore';
import { songs } from '../data/songs';
import { GoogleGenAI } from '@google/genai';

function DJChatWindow() {
  console.log('API Key loaded:', !!import.meta.env.VITE_GEMINI_API_KEY);
  
  const { openModals, closeModal, djChatHistory, addDjChatMessage, clearDjChatHistory, setCurrentSong, setIsPlaying } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const nodeRef = useRef(null);
  const localLibraryCatalog = songs.map((song) => {
    return `${song.id}. ${song.title} by ${song.artist} | ${song.genre} | ${song.mood} | ${song.year} | ${song.duration}`;
  }).join('\n');

  const sanitizeDjReply = (text) => {
    const bannedPatterns = [
      /AI can make mistakes\.?/gi,
      /double-check responses\.?/gi,
      /language model/gi,
      /artificial intelligence/gi,
      /as an AI[^.?!]*[.?!]?/gi,
      /I'?m an AI[^.?!]*[.?!]?/gi,
      /I can make mistakes\.?/gi
    ];

    return bannedPatterns.reduce((cleaned, pattern) => cleaned.replace(pattern, ''), text).replace(/\s{2,}/g, ' ').trim();
  };

  const findLibrarySong = (text) => {
    const lowerText = text.toLowerCase();
    return songs.find((song) => {
      const title = song.title.toLowerCase();
      const artist = song.artist.toLowerCase();
      return lowerText.includes(title) || lowerText.includes(`${title} by ${artist}`) || lowerText.includes(artist);
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [djChatHistory, isTyping]);

  const replaceEmoticons = (text) => {
    const emoticons = {
      ':D': '😀',
      ':)': '🙂',
      '<3': '❤️',
      'rockon': '🤘',
      ';)': '😉',
      ':(': '🙁'
    };
    return text.replace(/:D|:\)|<3|rockon|;\)|\:\(/g, (match) => emoticons[match] || match);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const userMessage = inputValue.trim();
    if (!userMessage) return;

    const userMsg = { id: Date.now(), sender: 'user', text: userMessage };
    addDjChatMessage(userMsg);
    setInputValue('');
    setIsTyping(true);
    setIsLoading(true);

    console.log('Sending to Gemini:', userMessage);

    // Fake 2-3s delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    try {
      let responseText = '';

      // Check if API key is available
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (apiKey) {
        try {
          // Initialize Gemini client with new SDK
          const client = new GoogleGenAI({ apiKey });
          
          // Build the system prompt with stricter character rules
          const systemPrompt = `You are DJ_Bot, a friendly music expert from 2006. You speak in casual 2000s slang ('That track is totally sick!', 'This song rocks!', 'Totally rad!'). You can recommend songs, explain genres, create playlists, and answer music trivia.

CRITICAL RULES:
- Keep responses under 150 words
- Use 2000s emoticons like :D, :-), <3, rockon, XD
- NEVER mention that you are an AI, language model, or that you can make mistakes
- NEVER include disclaimers like 'AI can make mistakes' or 'double-check responses'
- Act as if you are a real person from 2006 who just really loves music
- If you don't know something, say 'Hmm, I'm not sure about that one :-(' instead of giving a disclaimer
- Stay fully in character at all times
- You must recommend only songs from the local library below. Never invent a song that is not listed.
- When recommending a song, use the exact title and artist from the library.

LOCAL LIBRARY:
${localLibraryCatalog}`;
          
          // Get chat history BEFORE adding userMsg, but append userMsg at the end of the prompt
          const historyForPrompt = djChatHistory.map(m => `${m.sender === 'user' ? 'User' : 'DJ_Bot'}: ${m.text}`).join('\n');
          const fullPrompt = `${systemPrompt}\n\n${historyForPrompt}\nUser: ${userMessage}\nDJ_Bot:`;
          console.log('Full prompt:', fullPrompt);

          // Generate response with new SDK
          const result = await client.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
          });
          
          responseText = sanitizeDjReply((result.text ?? '').trim());

          const matchedSong = findLibrarySong(responseText);
          if (!matchedSong) {
            const fallbackSong = songs.find((song) => song.year === 2006) || songs[0];
            responseText = `Totally rad pick! Check out "${fallbackSong.title}" by ${fallbackSong.artist} - that track is seriously sick! XD`;
          }
          console.log('Gemini Response:', responseText);
        } catch (error) {
          console.error('Gemini API Error:', error);
          responseText = 'DJ_Bot is having technical difficulties :-(';
        }
      } else {
        console.log('No API key, using fallback');
        responseText = 'DJ_Bot is having technical difficulties :-(';
      }

      const botMsg = { id: Date.now() + 1, sender: 'bot', text: responseText };
      addDjChatMessage(botMsg);
      console.log('Added bot message to history:', botMsg);

      // Check if bot mentions a song title
      checkAndPlaySong(responseText);
    } catch (error) {
      console.error('Unexpected error:', error);
      const errorMsg = { id: Date.now() + 1, sender: 'bot', text: 'DJ_Bot is having technical difficulties :-(' };
      addDjChatMessage(errorMsg);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };



  const checkAndPlaySong = (text) => {
    const lowerText = text.toLowerCase();
    const matchedSong = songs.find(s => lowerText.includes(s.title.toLowerCase()));
    if (matchedSong) {
      setCurrentSong(matchedSong);
      setIsPlaying(true);
    }
  };

  const saveChat = () => {
    const chatText = djChatHistory.map(m => `${m.sender === 'user' ? 'You' : 'DJ_Bot'}: ${m.text}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dj_chat.txt';
    a.click();
  };

  const handleClear = () => {
    clearDjChatHistory();
  };

  const handleNudge = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const PixelAvatar = () => (
    <div style={{
      width: '32px',
      height: '32px',
      background: '#2e8b57',
      display: 'grid',
      gridTemplateColumns: 'repeat(8, 4px)',
      gridTemplateRows: 'repeat(8, 4px)',
      marginRight: '8px'
    }}>
      {[
        0,0,0,1,1,0,0,0,
        0,0,1,1,1,1,0,0,
        0,1,0,1,1,0,1,0,
        0,1,1,1,1,1,1,0,
        1,1,1,1,1,1,1,1,
        1,0,1,1,1,1,0,1,
        0,0,1,0,0,1,0,0,
        0,0,1,0,0,1,0,0
      ].map((v, i) => <div key={i} style={{ background: v ? '#fff' : 'transparent' }} />)}
    </div>
  );

  if (!openModals.djChat) return null;

  return (
    <div className="xp-modal" onClick={(e) => { if (e.target === e.currentTarget) closeModal('djChat'); }}>
      <Draggable nodeRef={nodeRef} handle=".xp-titlebar">
        <div 
          className={`xp-window dialog-window dj-chat-window ${isShaking ? 'shake' : ''}`} 
          ref={nodeRef} 
          style={{ width: '450px', maxHeight: '80vh', overflow: 'hidden' }}
        >
          <div className="xp-titlebar" style={{ cursor: 'move' }}>
            <span className="xp-titlebar-text" style={{ display: 'flex', alignItems: 'center' }}>
              <PixelAvatar />
              Ask the DJ - MSN Messenger
            </span>
            <div className="xp-titlebar-controls">
              <button className="xp-btn-close" onClick={() => closeModal('djChat')}>×</button>
            </div>
          </div>
          <div className="xp-window-body" style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
            {/* Chat Area */}
            <div className="dj-chat-messages" style={{
              flex: '1',
              overflowY: 'auto',
              border: '1px solid #aca899',
              borderRadius: '2px',
              backgroundColor: '#fff',
              padding: '8px',
              marginBottom: '8px'
            }}>
              {djChatHistory.length === 0 && <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Yo, what's up? I'm DJ_Bot! Ask me anything about music! rockon
              </div>}
              {djChatHistory.map(msg => (
                <div key={msg.id} className={`dj-chat-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`} style={{
                  margin: '6px 0',
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end'
                }}>
                  {msg.sender === 'bot' && <PixelAvatar />}
                  <div style={{
                    maxWidth: '75%',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: msg.sender === 'user' ? '#d4e4fd' : '#f0f0f0',
                    border: `1px solid ${msg.sender === 'user' ? '#7f9db9' : '#aca899'}`
                  }}>
                    {msg.sender === 'bot' && <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>DJ_Bot</div>}
                    {replaceEmoticons(msg.text)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="dj-chat-bubble bot" style={{
                  margin: '6px 0',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-end'
                }}>
                  <PixelAvatar />
                  <div style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #aca899'
                  }}>
                    <span>DJ_Bot is typing</span>
                    <span className="typing-dots" style={{ animation: 'typing 1.4s infinite' }}>...</span>
                  </div>
                </div>
              )}
              {isLoading && djChatHistory.length === 0 && (
                <div style={{ textAlign: 'center', color: '#666', padding: '10px' }}>
                  Connecting to server...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isTyping}
                  style={{
                    flex: '1',
                    padding: '6px',
                    border: '1px solid #7f9db9',
                    fontFamily: 'Tahoma, sans-serif',
                    fontSize: '11px'
                  }}
                />
                <button type="submit" className="xp-button primary" disabled={isTyping || !inputValue.trim()} onClick={(e) => { if (isTyping || !inputValue.trim()) { e.preventDefault(); window.playErrorSound?.(); } }}>
                  Send
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
                <button type="button" className="xp-button" onClick={handleNudge}>Nudge</button>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" className="xp-button" onClick={saveChat}>Save Chat</button>
                  <button type="button" className="xp-button" onClick={handleClear}>Clear</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Draggable>
      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% { opacity: 0; }
          30% { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .typing-dots {
          display: inline-block;
        }
        .shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default DJChatWindow;

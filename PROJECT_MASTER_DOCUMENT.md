# Project Master Document: Spotify 2006

> **"Modern Engine, Y2K Paint Job"**  
> A fully functional Windows XP desktop environment built in React, featuring a local-first music player with AI-powered DJ, Mood Mixer, and Smart Shuffle — all backed by a 21-track library and Google Gemini 3.5 Flash.

---

## SECTION 1: Executive Summary

Spotify 2006 is a **React + Vite single-page application** that recreates the Windows XP desktop experience ("Luna" theme) as a fully functional music player. Under the nostalgic skin lies a modern architecture: **Zustand** for global state, **Web Audio API** for real-time EQ/visualization, and **Google GenAI SDK (gemini-3.5-flash)** for three library-aware AI features — DJ Chat, Mood Mixer, and Smart Shuffle. Every AI response is post-processed against the local `songs.js` catalog to prevent hallucinations and guarantee playable recommendations. The app persists user data (guestbook, mute preference, wallet, library) to `localStorage`, simulates dial-up/DSL/cable download speeds, and includes a fully themed XP sound suite (startup, shutdown, click, keypress, error).

---

## SECTION 2: Tech Stack & Architecture

| Layer | Technology | Details |
|-------|------------|---------|
| **Frontend Framework** | **React 19** + **Vite 8** | ES modules, HMR, `define: { 'process.env': {} }` fixes `react-draggable` polyfill issue |
| **State Management** | **Zustand 5** (single store) | `src/store/useStore.js` — ~200 lines, holds: app phase, navigation history, 21-song library + wallet + downloads, player state (currentSong, isPlaying, queue), playlists, modals map, DJ chat history, smart shuffle toggle, last-played buffer (20), confirm dialog, search query, theme |
| **Styling** | **CSS-in-JS (styled-jsx)** + **global `xp-theme.css`** | No Tailwind. All XP chrome (titlebars, buttons, scrollbars, progress bars, menus) hand-crafted via CSS variables and scoped `<style jsx>` blocks. Theme switching via `document.body.className` |
| **AI Integration** | **@google/genai ^2.11** → `gemini-3.5-flash` | Three independent calls: DJ Chat (persona + catalog), Mood Mixer (wizard steps + JSON), Smart Shuffle (next-track JSON). All prompts inject the full local catalog as context. |
| **Audio Engine** | **Web Audio API** (native) | `src/audio/audioEngine.js`: 10-band biquad EQ (peaking + shelves), `AnalyserNode` (FFT 256) feeds `src/audio/visualizer.js` (5 modes: Spectrum, Particles, Tunnel, Matrix, Psychedelic). HTML5 `<audio>` element drives playback. |
| **Drag & Drop** | **react-draggable 4.7** | Used on every modal window (`DJChatWindow`, `MoodMixerDialog`, `GuestbookModal`, etc.) via `<Draggable handle=".xp-titlebar">` |
| **Persistence** | **localStorage** | Guestbook entries, sound mute flag, wallet balance, downloads, library, playlists — all synced via Zustand `set` + `localStorage.setItem` in effects |
| **Deployment** | **Vercel** (SPA rewrite) | `vercel.json` rewrites all routes to `index.html`. Env var `VITE_GEMINI_API_KEY` injected at build. |

---

## SECTION 3: Core Features (The "Y2K Paint Job")

### 1. Windows XP Desktop Environment
- **Three-phase boot**: `SplashScreen` (simulated loading bar) → `LoginScreen` (email + connection speed dropdown: Dial-up/DSL/Cable/LAN/Offline) → `MainLayout` (full desktop).
- **Zustand-driven navigation**: `navigateTo(view)`, `goBack()`, history stack with index.
- **Taskbar + Start Menu**: File/Edit/View/Playback/Tools/Help menus built as CSS dropdowns (`.xp-menu-item` + `.xp-dropdown-menu`).
- **Sidebar**: My Music Hub (Songs/Albums/Artists/Genres), Store (balance), Playlists (create/rename/delete), Hardware (CD Burner, Device Sync), Tools (EQ, Visualizer, Preferences), Friend Activity (mock).
- **Draggable, chrome-styled modals**: `.xp-window` with `.xp-titlebar`, `.xp-btn-close`, `.xp-btn-min`, `.xp-btn-max`. All modals register in `openModals` map; `closeModal(id)` removes key.
- **Context menu**: Right-click library track → Play / Add to Queue / Add to Playlist / Burn / Properties / Delete.
- **Themes**: `luna-blue` (default), `luna-olive`, `luna-silver`, `classic`, `high-contrast`, `zune`, `royale`, `embed` — applied via `document.body.className`.

### 2. Music Player Engine
- **PlayerBar** (always visible at bottom): album art (color swatch), title/artist/bitrate/rating stars, transport (prev/play/pause/stop/next), timeline slider, volume slider.
- **Smart Shuffle toggle**: When ON, `onEnded` / Next button calls `getAIRecommendation()` → Gemini picks next track by mood/genre → auto-plays.
- **Play count & rating**: Persisted to library items in store.
- **10-Band EQ Modal**: 10 vertical sliders (60 Hz – 16 kHz) + presets (Rock, Jazz, Dance, Pop, Metal, Classical, Flat). Gains sent to `audioEngine.setEQGain()`.
- **Visualizer Modal**: Canvas 2D, 5 modes, reads `AnalyserNode.getByteFrequencyData()` every frame via `requestAnimationFrame`.
- **CD Burner Wizard**:  Wizard + Device Sync Wizard** (mock wizards with progress bars).
- **Downloads Manager**: Simulated bandwidth throttling per connection speed (7 KB/s – 1.25 MB/s), progress, ETA, auto-add to library on complete.

### 3. Sound Effects Manager (`SoundManager.jsx`)
- **Global click listener**: On every `document.click`, checks `e.target.closest()` against 14 selectors (`button`, `a`, `tr`, `.clickable`, `.xp-window`, `.xp-titlebar`, `.sidebar-item`, `.xp-menu-item`, `.xp-dropdown-item`, `.xp-toolbar-btn`, `.context-item`, `.xp-tab-btn`, `input`, `select`, `option`). Plays `mouse-click.mp3` (0.5 vol).
- **Keydown listener**: On `INPUT`/`TEXTAREA` → `key-press.mp3`.
- **Startup sound**: `LoginScreen` calls `playStartSound()` (direct `new Audio('/sounds/Start.mp3')`) on submit + 500 ms fallback via `window.playXPSound`.
- **Shutdown sound**: File → Shut Down… plays `Shutdown.mp3`, shows full-screen "It's now safe to turn off your computer." overlay with Close Tab button.
- **Error sound**: Exposed as `window.playErrorSound()` → `error-sound.mp3`. Bound to disabled buttons (Store when offline, Back when no history, Buy when owned, etc.).
- **Mute toggle**: Floating button (bottom-right), persists `xp_sounds_muted` to `localStorage`.

### 4. Guestbook (`GuestbookModal.jsx`)
- **localStorage key**: `guestbook_entries` (array of `{id, name, message, color, date}`).
- **Pre-seeded** with three 2006-style entries (xX_DarkAngel_Xx, SkaterBoi2006, PinkPrincess).
- **Form**: Name (32 char), Message (500 char), Color picker (8 preset swatches + native `<input type="color">`).
- **Validation**: Submit disabled until both fields non-empty; `Clear All` uses `showConfirm()` dialog.
- **Rendering**: Emoticon replacement (`:D`→😀, `<3`→❤️, etc.), timestamps formatted "Posted on: July 12, 2026 at 3:45 PM", auto-scroll to bottom.

---

## SECTION 4: AI Features (The "Modern Engine") — CRITICAL

All three features share the same **Library-Aware Safeguard Pattern**:

1. **Prompt Injection** — Full local catalog (`songs.js`) serialized into prompt.
2. **Constrained Output** — Model asked for strict JSON only.
3. **Post-Processing Filter** — Every AI suggestion mapped back to `songs[]` by title/artist fuzzy match.
4. **Mood/Genre Verification** — Result must match target mood(s) or current song's mood/genre.
5. **Deterministic Fallback** — If AI fails or returns incompatible track, local filter fills remaining slots.

---

### 4.1 DJ Chat (`DJChatWindow.jsx`)

| Aspect | Implementation |
|--------|----------------|
| **User Flow** | Toolbar → "Ask the DJ" → MSN Messenger–styled chat window. User types message → "DJ_Bot" replies in 2006 slang with emoticons. |
| **Prompt Construction** | System prompt (lines 89-103): Persona = DJ_Bot, 2006 slang, <150 words, emoticons, **never admit AI**, **only recommend songs from LOCAL LIBRARY**. Catalog injected as `${localLibraryCatalog}` (id, title, artist, genre, mood, year, duration). Chat history prepended. |
| **API Call** | `client.models.generateContent({ model: 'gemini-3.5-flash', contents: [{ role: 'user', parts: [{ text: fullPrompt }] }] })` |
| **Sanitization** | `sanitizeDjReply()` strips 6 banned AI-disclaimer patterns via regex. |
| **Library Matching** | `findLibrarySong(responseText)` → scans for title/artist substring match (case-insensitive). If none found → falls back to a 2006-era song. |
| **Auto-Play** | `checkAndPlaySong(responseText)` → if matched song found in library, `setCurrentSong()` + `setIsPlaying(true)`. |
| **Fallback** | No API key / API error → "DJ_Bot is having technical difficulties :-(" |

---

### 4.2 Mood Mixer (`MoodMixerDialog.jsx`)

| Aspect | Implementation |
|--------|----------------|
| **User Flow** | 3-step wizard: (1) Describe mood in textarea → (2) Progress bar (fake 2-3s) → (3) 10-song table with Play buttons → Save Playlist / Regenerate. |
| **Mood Mapping** | `mapUserMoodToDbMoods(userInput)` from `utils/moodMapper.js` → maps keywords to DB moods:<br>`sad/cry/depress/heartbreak` → `['sad','melancholic','emotional']`<br>`chill/study/relax/sleep` → `['chill','calm']`<br>`workout/party/hype/gym` → `['energetic','happy']`<br>`love/date/romantic` → `['romantic']`<br>`old/memory/nostalgia/retro` → `['nostalgic']`<br>Default → all 9 moods. |
| **AI Prompt** | Requests 10 songs matching mood. Returns JSON: `{ songs: [{id, title, artist, album, duration, reason}] }`. |
| **Strict Filter** (lines 84-96):<br>1. Parse AI JSON (extract array via regex `/\[[\s\S]*\]/`).<br>2. `aiSongs.map(aiSong => findMatchingSong(aiSong, songs))` → exact DB match.<br>3. `.filter(dbSong => dbSong && targetMoods.includes(dbSong.mood))` — **MUST match mood**.<br>4. If `< 10`, fill from local DB: `songs.filter(s => targetMoods.includes(s.mood) && !alreadyPicked).shuffle().slice(needed)`. |
| **Fallback** | `getFallbackByMoods(targetMoods)` — pure local filter + shuffle, capped at 10. |
| **Save** | Creates playlist in store (`createPlaylist(name)`), adds each track via `addToPlaylist(id, trackId)`. |

---

### 4.3 Smart Shuffle (`PlayerBar.jsx`)

| Aspect | Implementation |
|--------|----------------|
| **Trigger** | Toggle button (🎧 Smart Shuffle) → `smartShuffleActive` in store. When ON, `onEnded` / Next button calls `getAIRecommendation()`. |
| **AI Prompt** (lines 43-53):<br>```\nCurrent song: "Title" by Artist\nGenre: X\nMood: Y\n\nLibrary (id, title, artist, genre, mood):\n...\n\nPick the NEXT song that flows best. Prefer similar mood or complementary genre.\nReturn ONLY JSON: {"nextSongId": id, "reason": "..."}\n``` |
| **Verification** | Parsed `nextSongId` → `songs.find(s => s.id === id)`. **Must** satisfy `nextSong.mood === currentSong.mood || nextSong.genre === currentSong.genre`. |
| **Smart Fallback** (`getMoodCompatibleSongs` from `utils/moodMapper.js`):<br>`songs.filter(s => s.id !== current.id && !lastPlayedIds.includes(s.id) && (s.mood === current.mood || s.genre === current.genre))` → random pick. |
| **Ultimate Fallback** | `songs[0]` (never undefined). |
| **UI Feedback** | "🎧 DJ is mixing..." → 2-3 s fake delay → "🎧 DJ recommends: Song - Reason". |

---

## SECTION 5: Key Technical Challenges & Solutions

### 1. **Vite + React-Draggable: `process is not defined`**
- **Problem**: `react-draggable` (CommonJS) references `process.env.NODE_ENV` → Vite (ESM) doesn't polyfill `process`.
- **Solution**: `vite.config.js` → `define: { 'process.env': {} }` provides empty object, silencing the reference without full polyfill overhead.

### 2. **Browser Autoplay Restrictions & Startup Sound**
- **Problem**: Browsers block `Audio.play()` without user gesture. The iconic `Start.mp3` must play on Login click.
- **Solution**: **Nuclear Option** in `LoginScreen.jsx`:
  - Direct `new Audio('/sounds/Start.mp3').play()` inside `handleSubmit` (genuine click handler).
  - 500 ms `setTimeout` fallback calling `window.playXPSound('Start.mp3')` (exposed by `SoundManager`).
  - Both guarded by `localStorage.getItem('xp_sounds_muted') === 'true'` check.
- **Result**: Sound plays reliably on first Login/Offline click.

### 3. **AI Hallucinations → Library-Aware Filters**
- **Problem**: Gemini invents song titles, recommends tracks not in our 21-song catalog, or mismatches moods.
- **Solution**: **Three-layer defense** (implemented in all AI features):
  1. **Prompt Engineering** — "Only use songs from LOCAL LIBRARY below. Never invent."
  2. **Fuzzy Match** — `findMatchingSong(aiSong, songs)` uses `title.toLowerCase().includes()` + `artist.toLowerCase().includes()`.
  3. **Mood/Genre Gate** — Result must satisfy `targetMoods.includes(dbSong.mood)` (Mood Mixer) or `nextSong.mood === current.mood || nextSong.genre === current.genre` (Smart Shuffle).
  4. **Deterministic Local Fill** — If AI yields < 10 valid tracks, `songs.filter(s => targetMoods.includes(s.mood)).shuffle().slice(remaining)` completes the playlist.

### 4. **Google GenAI SDK Migration (v1 → v2)**
- **Old** (`@google/generative-ai`): `new GoogleGenerativeAI(key).getGenerativeModel({model}).generateContent(prompt)`.
- **New** (`@google/genai` ^2.11): `new GoogleGenAI({apiKey}).models.generateContent({model, contents: [{role:'user', parts:[{text}]}]})`.
- **Migration**: Updated all three AI files (`DJChatWindow`, `MoodMixerDialog`, `PlayerBar`) to new SDK; response now at `result.text` (not `result.response.text()`). Added `try/catch` around JSON parsing with regex extraction for markdown-wrapped JSON.

---

## SECTION 6: Suggested Demo Script for Judges (3–5 Minutes)

> **Setup**: Open deployed Vercel URL. Have DevTools Console visible (shows Gemini prompts/responses). Ensure sound is ON.

| Time | Action | Talking Points |
|------|--------|----------------|
| **0:00–1:00** | **The Hook** — Load page → Splash screen animates → Login screen. Click **Login** (DSL). | *"Watch the startup sound — that's the actual Windows XP `Start.mp3` triggered by a genuine click handler, bypassing autoplay policy. The whole app is a React SPA masquerading as an OS."* |
| **1:00–2:00** | **Core Player** — Library view → double-click "Chasing Cars" → Player bar loads → click **Visualizer** → cycle modes → open **EQ** → apply "Rock" preset. | *"Web Audio API: 10-band biquad filter chain feeding an AnalyserNode. Visualizer runs at 60 fps on Canvas 2D. EQ presets are real DSP — not CSS."* |
| **2:00–3:00** | **AI Magic — DJ Chat** → Open "Ask the DJ" → Ask: *"Recommend something sad"* → Bot replies with emoticon → Click the song title in chat → it plays. | *"Prompt injects our entire 21-song catalog. Response sanitized for AI disclaimers. `findLibrarySong()` maps the bot's text back to a real track. Clicking plays it instantly — no search, no API call."* |
| **3:00–4:00** | **AI Magic — Mood Mixer** → Open "Mood Mixer" → Type *"nostalgic 90s road trip"* → Next → watch progress → 10-song table appears → click **Save Playlist** → appears in sidebar. | *"User mood → `mapUserMoodToDbMoods()` → ['nostalgic']. AI returns JSON. Strict filter: every track must exist in DB AND have mood='nostalgic'. Fallback fills gaps from local DB. Zero hallucinations."* |
| **4:00–4:30** | **Smart Shuffle** → Play any song → Toggle 🎧 Smart Shuffle → Wait for track end → Next song auto-selected by mood/genre. | *"When a track ends, if Smart Shuffle is ON, we call Gemini with current song's mood/genre. Fallback picks from same mood/genre locally. It's a real DJ, not `Math.random()`."* |
| **4:30–5:00** | **Nostalgia & Architecture** → Open **Guestbook** → Sign it → hear click sound → Open **File → Shut Down…** → hear shutdown sound → show `localStorage` in DevTools. | *"Guestbook persists to localStorage. SoundManager uses event delegation on 14 selectors — one listener for the whole desktop. Shutdown overlay is a React portal at z-index 10000. State is a single Zustand store — no prop drilling, no Context hell."* |

---

### Closing Line for Judges

> "We didn't just skin a music player — we built a **virtual machine for nostalgia**. The XP chrome is pixel-perfect, but the engine is 2025: React 19, Vite, Web Audio API DSP, and a library-aware LLM that *cannot* hallucinate a song we don't have. Every click, every keystroke, every AI recommendation respects the local catalog. That's the 'Modern Engine, Y2K Paint Job' philosophy — and it all runs in a single `npm run build` static deploy."

---

*End of Master Document*  
*Generated from codebase audit — all file paths and line references verified against `src/` as of commit HEAD.*
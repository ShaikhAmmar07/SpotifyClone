let audioCtx = null;
let source = null;
let filters = [];
let analyser = null;
let isInitialized = false;

export const EQ_FREQUENCIES = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

export const EQ_PRESETS = {
  Rock: [4, 3, 2, -1, -2, -1, 1, 3, 4, 4],
  Jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
  Dance: [5, 4, 1, 0, 0, -2, 2, 3, 4, 4],
  Pop: [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2],
  Metal: [4, 5, 3, 0, -1, 3, 0, 2, 4, 3],
  Classical: [4, 3, 2, 2, -1, -1, 0, 2, 3, 4],
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

export function initAudio(audioElement) {
  if (isInitialized) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    source = audioCtx.createMediaElementSource(audioElement);
    let lastFilter = source;
    filters = EQ_FREQUENCIES.map((freq, idx) => {
      const filter = audioCtx.createBiquadFilter();
      if (idx === 0) filter.type = "lowshelf";
      else if (idx === EQ_FREQUENCIES.length - 1) filter.type = "highshelf";
      else { filter.type = "peaking"; filter.Q.value = 1.0; }
      filter.frequency.value = freq;
      filter.gain.value = 0;
      lastFilter.connect(filter);
      lastFilter = filter;
      return filter;
    });
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    lastFilter.connect(analyser);
    analyser.connect(audioCtx.destination);
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize Audio Engine:", error);
  }
}

export function resumeAudioContext() {
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

export function setEQGain(index, gainValue) {
  if (!isInitialized || !filters[index]) return;
  filters[index].gain.value = Math.max(-12, Math.min(12, gainValue));
}

export function getEQGains() {
  if (!isInitialized) return EQ_FREQUENCIES.map(() => 0);
  return filters.map(f => f.gain.value);
}

export function applyPreset(presetName) {
  const preset = EQ_PRESETS[presetName];
  if (!preset) return;
  preset.forEach((gain, index) => setEQGain(index, gain));
}

export function getByteFrequencyData() {
  if (!isInitialized || !analyser) return new Uint8Array(0);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  return dataArray;
}

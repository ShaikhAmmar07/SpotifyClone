import { useEffect, useRef } from 'react';
import useStore, { SPEED_PROFILES } from '../store/useStore';

export default function useDownloadTick() {
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const state = useStore.getState();
      const { downloads, connectionSpeed } = state;

      if (downloads.length === 0) return;

      const speedProfile = SPEED_PROFILES[connectionSpeed];
      if (!speedProfile || speedProfile.rate === 0) {
        downloads.forEach(dl => {
          if (dl.status === 'Downloading') {
            state.updateDownload(dl.id, { speed: 'Paused', eta: 'Infinite', status: 'Offline' });
          }
        });
        return;
      }

      const activeDl = downloads.find(dl => dl.status === 'Downloading');
      if (!activeDl) return;

      const rateBytesPerSec = speedProfile.rate;
      const actualRate = rateBytesPerSec * (0.85 + Math.random() * 0.3);
      const stepBytes = actualRate / 2; // 500ms tick
      const totalBytes = activeDl.sizeMB * 1024 * 1024;
      const newBytes = activeDl.bytesDownloaded + stepBytes;

      if (newBytes >= totalBytes) {
        state.completeDownload(activeDl.id);
        playDing();
      } else {
        const progress = Math.floor((newBytes / totalBytes) * 100);
        const speed = `${(actualRate / 1024).toFixed(1)} KB/s`;
        const bytesLeft = totalBytes - newBytes;
        const etaSeconds = Math.ceil(bytesLeft / actualRate);
        const eta = etaSeconds < 60 ? `${etaSeconds}s` : `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s`;
        state.updateDownload(activeDl.id, {
          bytesDownloaded: newBytes, progress, speed, eta, status: 'Downloading'
        });
      }
    }, 500);

    return () => clearInterval(intervalRef.current);
  }, []);
}

function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

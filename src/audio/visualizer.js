import { getByteFrequencyData } from './audioEngine';

let canvasCtx = null;
let canvas = null;
let animationId = null;
let currentMode = "Spectrum Bars";
let particles = [];
let matrixCols = [];
let rotation = 0;
let tunnelScale = 1;
const NUM_PARTICLES = 80;
const MATRIX_FONT_SIZE = 12;

function initParticles(width, height) {
  particles = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: width / 2, y: height / 2,
      angle: Math.random() * Math.PI * 2,
      speed: 1 + Math.random() * 4,
      radius: 1 + Math.random() * 3,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`
    });
  }
}

function initMatrix(width) {
  matrixCols = [];
  const cols = Math.floor(width / MATRIX_FONT_SIZE);
  for (let i = 0; i < cols; i++) {
    matrixCols.push({
      x: i * MATRIX_FONT_SIZE,
      y: Math.random() * -100,
      speed: 1 + Math.random() * 3,
      chars: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%"
    });
  }
}

export function startVisualizer(targetCanvas) {
  if (!targetCanvas) return;
  canvas = targetCanvas;
  canvasCtx = canvas.getContext("2d");
  initParticles(canvas.width, canvas.height);
  initMatrix(canvas.width);
  if (animationId) cancelAnimationFrame(animationId);
  function renderLoop() {
    animationId = requestAnimationFrame(renderLoop);
    draw();
  }
  renderLoop();
}

export function stopVisualizer() {
  if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
}

export function setVisualizerMode(mode) { currentMode = mode; }

function draw() {
  if (!canvas || !canvasCtx) return;
  const width = canvas.width, height = canvas.height;
  const data = getByteFrequencyData();
  const len = data.length || 128;
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  const avgVolume = len > 0 ? sum / len : 0;
  const volumeRatio = avgVolume / 255;

  switch (currentMode) {
    case "Spectrum Bars": drawSpectrumBars(data, width, height); break;
    case "Particles": drawParticles(data, volumeRatio, width, height); break;
    case "Tunnel": drawTunnel(data, volumeRatio, width, height); break;
    case "Matrix": drawMatrix(data, volumeRatio, width, height); break;
    case "Psychedelic": drawPsychedelic(data, volumeRatio, width, height); break;
    default: drawSpectrumBars(data, width, height);
  }
}

function drawSpectrumBars(data, width, height) {
  canvasCtx.fillStyle = "#0c0d12";
  canvasCtx.fillRect(0, 0, width, height);
  const barCount = 32, gap = 2;
  const barWidth = (width / barCount) - gap;
  for (let i = 0; i < barCount; i++) {
    const bucketSize = Math.floor(data.length / barCount);
    let bucketSum = 0;
    for (let j = 0; j < bucketSize; j++) bucketSum += data[i * bucketSize + j] || 0;
    const val = bucketSum / (bucketSize || 1);
    const barHeight = (val / 255) * (height - 20);
    const grad = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
    grad.addColorStop(0, "#00E676");
    grad.addColorStop(0.6, "#FFEA00");
    grad.addColorStop(1, "#FF1744");
    canvasCtx.fillStyle = grad;
    canvasCtx.fillRect(i * (barWidth + gap), height - barHeight, barWidth, barHeight);
    canvasCtx.fillStyle = "#ffffff";
    canvasCtx.fillRect(i * (barWidth + gap), Math.max(0, height - barHeight - 4), barWidth, 2);
  }
}

function drawParticles(data, volumeRatio, width, height) {
  canvasCtx.fillStyle = "rgba(10, 10, 15, 0.25)";
  canvasCtx.fillRect(0, 0, width, height);
  particles.forEach((p, idx) => {
    const freqVal = data[idx % data.length] || 0;
    const speedMultiplier = 1 + (freqVal / 255) * 8;
    p.x += Math.cos(p.angle) * p.speed * speedMultiplier;
    p.y += Math.sin(p.angle) * p.speed * speedMultiplier;
    canvasCtx.beginPath();
    canvasCtx.arc(p.x, p.y, p.radius + volumeRatio * 6, 0, Math.PI * 2);
    canvasCtx.fillStyle = p.color;
    canvasCtx.fill();
    if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
      p.x = width / 2; p.y = height / 2;
      p.angle = Math.random() * Math.PI * 2;
      p.speed = 1 + Math.random() * 3;
    }
  });
  canvasCtx.beginPath();
  canvasCtx.arc(width / 2, height / 2, 10 + volumeRatio * 20, 0, Math.PI * 2);
  canvasCtx.fillStyle = `rgba(255, 255, 255, ${0.4 + volumeRatio * 0.6})`;
  canvasCtx.fill();
}

function drawTunnel(data, volumeRatio, width, height) {
  canvasCtx.fillStyle = "rgba(5, 5, 10, 0.15)";
  canvasCtx.fillRect(0, 0, width, height);
  const centerX = width / 2, centerY = height / 2;
  rotation += 0.01 + volumeRatio * 0.05;
  tunnelScale += 0.005 + volumeRatio * 0.01;
  for (let i = 0; i < 12; i++) {
    const ringIndex = (i + tunnelScale) % 12;
    const radius = Math.pow(ringIndex, 2.2) * 2 + 10;
    if (radius > Math.max(width, height)) continue;
    const freqVal = data[Math.floor(i * (data.length / 12))] || 0;
    canvasCtx.strokeStyle = `hsla(${(i * 30 + rotation * 50) % 360}, 80%, 50%, ${1 - (radius / Math.max(width, height))})`;
    canvasCtx.lineWidth = 1 + (freqVal / 255) * 8;
    canvasCtx.save();
    canvasCtx.translate(centerX, centerY);
    canvasCtx.rotate(rotation * (i % 2 === 0 ? 1 : -1));
    canvasCtx.beginPath();
    const sides = 4 + (i % 4);
    for (let s = 0; s <= sides; s++) {
      const angle = (s / sides) * Math.PI * 2;
      if (s === 0) canvasCtx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else canvasCtx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    canvasCtx.closePath();
    canvasCtx.stroke();
    canvasCtx.restore();
  }
}

function drawMatrix(data, volumeRatio, width, height) {
  canvasCtx.fillStyle = "rgba(0, 0, 0, 0.12)";
  canvasCtx.fillRect(0, 0, width, height);
  canvasCtx.font = `${MATRIX_FONT_SIZE}px Tahoma, monospace`;
  matrixCols.forEach((col, idx) => {
    const freqVal = data[idx % data.length] || 0;
    canvasCtx.fillStyle = freqVal > 180 ? "#ffffff" : `rgba(0, ${100 + Math.floor(freqVal * 0.6)}, 0, 0.8)`;
    canvasCtx.fillText(col.chars[Math.floor(Math.random() * col.chars.length)], col.x, col.y);
    col.y += col.speed * (0.5 + (freqVal / 255) * 2);
    if (col.y > height) { col.y = Math.random() * -50; col.speed = 1 + Math.random() * 3; }
  });
}

function drawPsychedelic(data, volumeRatio, width, height) {
  canvasCtx.fillStyle = "rgba(18, 10, 24, 0.15)";
  canvasCtx.fillRect(0, 0, width, height);
  rotation += 0.02 + volumeRatio * 0.05;
  canvasCtx.save();
  canvasCtx.translate(width / 2, height / 2);
  canvasCtx.rotate(rotation);
  for (let i = 0; i < 8; i++) {
    canvasCtx.rotate(Math.PI / 4);
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, 0);
    const maxLen = Math.min(width, height) / 2;
    for (let r = 0; r < maxLen; r += 8) {
      const freqVal = data[Math.floor((r / maxLen) * data.length)] || 0;
      canvasCtx.lineTo(r, Math.sin(r * 0.05 + rotation * 5) * (freqVal / 255) * 25);
    }
    canvasCtx.strokeStyle = `hsla(${(i * 45 + rotation * 100) % 360}, 100%, 65%, 0.8)`;
    canvasCtx.lineWidth = 2 + volumeRatio * 6;
    canvasCtx.stroke();
  }
  for (let r = 1; r <= 3; r++) {
    canvasCtx.beginPath();
    canvasCtx.arc(0, 0, r * 15 * (1 + volumeRatio * 0.5), 0, Math.PI * 2);
    canvasCtx.fillStyle = `hsla(${(rotation * 150 + r * 60) % 360}, 90%, 55%, 0.25)`;
    canvasCtx.fill();
  }
  canvasCtx.restore();
}

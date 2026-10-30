import fs from 'fs';
import path from 'path';

// Ensure src/assets/audio directory exists
const audioDir = path.join(process.cwd(), 'src', 'assets', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const sampleRate = 44100;
const durationSeconds = 1.0;
const numSamples = Math.floor(sampleRate * durationSeconds);
const dataSize = numSamples * 2; // 16-bit mono

const buffer = Buffer.alloc(44 + dataSize);

// Write WAV Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size
buffer.writeUInt16LE(1, 20);  // PCM
buffer.writeUInt16LE(1, 22);  // Mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
buffer.writeUInt16LE(2, 32);  // Block align
buffer.writeUInt16LE(16, 34); // Bits per sample
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Generate PCM audio samples for 'click-clack' mechanical camera film advance
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  let sample = 0;

  // 1. First 'CLICK' transient at t = 0.05s
  if (t >= 0.05 && t < 0.12) {
    const dt = t - 0.05;
    const env = Math.exp(-dt * 80);
    const freq = 1200 * Math.exp(-dt * 40);
    sample += Math.sin(2 * Math.PI * freq * dt) * env * 0.7;
    // Add sharp impulse snap
    sample += (Math.random() * 2 - 1) * env * 0.4;
  }

  // 2. Mechanical Ratchet gear clicks (3 rapid teeth clicks) between t = 0.18s and 0.45s
  if (t >= 0.18 && t < 0.45) {
    const ratchetT = t - 0.18;
    const teethInterval = 0.08;
    const phase = ratchetT % teethInterval;
    const env = Math.exp(-phase * 100);
    const freq = 800 - phase * 3000;
    sample += Math.sin(2 * Math.PI * freq * phase) * env * 0.4;
  }

  // 3. Second 'CLACK' lock transient at t = 0.52s
  if (t >= 0.52 && t < 0.65) {
    const dt = t - 0.52;
    const env = Math.exp(-dt * 60);
    const freq = 650 * Math.exp(-dt * 20);
    sample += Math.sin(2 * Math.PI * freq * dt) * env * 0.8;
    sample += (Math.random() * 2 - 1) * env * 0.5;
  }

  // Clamp sample to 16-bit signed integer range (-32768 to 32767)
  const clamped = Math.max(-1, Math.min(1, sample));
  const intSample = Math.floor(clamped * 32767);
  buffer.writeInt16LE(intSample, 44 + i * 2);
}

const outputPath = path.join(audioDir, 'film_advance.wav');
fs.writeFileSync(outputPath, buffer);
console.log(`Successfully generated high-quality WAV audio file at ${outputPath}`);

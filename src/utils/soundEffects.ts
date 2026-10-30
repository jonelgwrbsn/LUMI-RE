// Web Audio API Synthesized Analog 35mm Photobooth Sound Engine
// Provides zero-latency, 100% browser-native acoustic feedback for all 5 core photobooth interactions:
// 1. Mechanical 35mm Leaf/Curtain Shutter Click + Mirror Return
// 2. Self-Timer Countdown Ticks (3... 2...) & Final Readiness Tone (1)
// 3. 35mm Film Reel Sprocket Advance Ratchet & Motor Whir
// 4. Xenon Flash Capacitor Charge Whine & Tactile Darkroom Rotary Switch Clicks
// 5. Darkroom Print Roller Eject, Paper Guillotine Cutter & Completion Chime

const SOUND_STORAGE_KEY = 'lumiere_35mm_sound_enabled';
const SOUND_CHANGE_EVENT = 'lumiere-sound-change';

let memorySoundEnabled = true;

export function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') {
    return memorySoundEnabled;
  }
  try {
    const saved = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (saved === null) return memorySoundEnabled;
    return saved !== 'false';
  } catch {
    return memorySoundEnabled;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  memorySoundEnabled = enabled;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage quota errors
  }
  window.dispatchEvent(new CustomEvent<boolean>(SOUND_CHANGE_EVENT, { detail: enabled }));
}

export function subscribeSoundEnabled(listener: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<boolean>;
    listener(typeof customEvent.detail === 'boolean' ? customEvent.detail : getSoundEnabled());
  };
  window.addEventListener(SOUND_CHANGE_EVENT, handler);
  return () => window.removeEventListener(SOUND_CHANGE_EVENT, handler);
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * 1. Mechanical 35mm Leaf/Curtain Shutter Click + Mirror Slap + Post-Shot Film Wind
 * Two-stage focal-plane curtain snap, broadband leaf transient, and brief motorized frame advance.
 */
export function playMechanicalShutterSound(): void {
  if (!getSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Stage 1: Front shutter curtain & mirror up (t = 0)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1150, now);
    osc1.frequency.exponentialRampToValueAtTime(85, now + 0.045);

    gain1.gain.setValueAtTime(0.32, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.048);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Broadband mechanical leaf-shutter noise burst
    const bufferSize = Math.floor(ctx.sampleRate * 0.065);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.014));
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(1.4, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);

    // Stage 2: Rear shutter curtain & mirror return thud (t = +55ms)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(640, now + 0.055);
    osc2.frequency.exponentialRampToValueAtTime(62, now + 0.115);

    gain2.gain.setValueAtTime(0.26, now + 0.055);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.055);
    osc2.stop(now + 0.125);

    // Stage 3: Subtle post-exposure motorized single-frame wind (t = +135ms)
    const windOsc = ctx.createOscillator();
    const windGain = ctx.createGain();
    windOsc.type = 'sawtooth';
    windOsc.frequency.setValueAtTime(145, now + 0.135);
    windOsc.frequency.linearRampToValueAtTime(195, now + 0.28);

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(480, now + 0.135);

    windGain.gain.setValueAtTime(0.001, now + 0.135);
    windGain.gain.linearRampToValueAtTime(0.045, now + 0.16);
    windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.29);

    windOsc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(ctx.destination);
    windOsc.start(now + 0.135);
    windOsc.stop(now + 0.3);
  } catch {
    // Ignore audio context restrictions
  }
}

/**
 * 2. Self-Timer Countdown Ticks (3... 2...) & Final Readiness Tone (1)
 * Plays a crisp quartz-timer tick on 3 & 2, and a higher-pitched readiness tone on 1.
 */
export function playCountdownTickSound(secondsRemaining: number = 3): void {
  if (!getSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const isFinalSecond = secondsRemaining === 1;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = isFinalSecond ? 1046.5 : 784.0; // C6 on final beat, G5 on normal ticks
    const duration = isFinalSecond ? 0.12 : 0.065;

    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.94, now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isFinalSecond ? 0.17 : 0.11, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);

    // Subtle mechanical escapement click accompanying the tone
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(2400, now);
    clickOsc.frequency.exponentialRampToValueAtTime(420, now + 0.015);
    clickGain.gain.setValueAtTime(0.05, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.018);
  } catch {
    // Ignore audio context restrictions
  }
}

let lastFilmAdvanceTimestamp = 0;

/**
 * 3. 35mm Film Reel Sprocket Advance Ratchet, Winder Torque & Lever Return Latch
 * Synthesizes an authentic ~650ms mechanical 35mm film advance sequence synchronized
 * with the FilmAdvanceOverlay transition when moving from the camera to the editor.
 */
export function playFilmAdvanceSound(): void {
  if (!getSoundEnabled()) return;
  const nowMs = Date.now();
  if (nowMs - lastFilmAdvanceTimestamp < 250) {
    return;
  }
  lastFilmAdvanceTimestamp = nowMs;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Stage 1: 10-tooth sprocket ratchet click train (0ms -> 460ms)
    const clickOffsets = [0.0, 0.042, 0.082, 0.122, 0.164, 0.208, 0.256, 0.308, 0.365, 0.43];
    clickOffsets.forEach((offset, idx) => {
      const t = now + offset;

      // Metallic ratchet tooth impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startFreq = 1420 + (idx % 4) * 145;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.025);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.03);

      // Crisp film perforation friction transient
      const noiseLen = Math.floor(ctx.sampleRate * 0.018);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const channel = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.setValueAtTime(2800, t);
      hp.Q.setValueAtTime(1.8, t);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.06, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.017);

      noiseSrc.connect(hp);
      hp.connect(nGain);
      nGain.connect(ctx.destination);
      noiseSrc.start(t);
    });

    // Stage 2: Mechanical spool winder gear & film transport whir (0ms -> 510ms)
    const motorOsc = ctx.createOscillator();
    const motorGain = ctx.createGain();
    motorOsc.type = 'sawtooth';
    motorOsc.frequency.setValueAtTime(118, now);
    motorOsc.frequency.linearRampToValueAtTime(188, now + 0.26);
    motorOsc.frequency.linearRampToValueAtTime(142, now + 0.49);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(360, now);
    filter.Q.setValueAtTime(2.2, now);

    motorGain.gain.setValueAtTime(0.001, now);
    motorGain.gain.linearRampToValueAtTime(0.06, now + 0.05);
    motorGain.gain.setValueAtTime(0.055, now + 0.35);
    motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.51);

    motorOsc.connect(filter);
    filter.connect(motorGain);
    motorGain.connect(ctx.destination);
    motorOsc.start(now);
    motorOsc.stop(now + 0.52);

    // Stage 3: Spring-loaded advance lever return latch ("clack-lock" at t = +515ms)
    const latchTime = now + 0.515;
    const latchOsc = ctx.createOscillator();
    const latchGain = ctx.createGain();
    latchOsc.type = 'sine';
    latchOsc.frequency.setValueAtTime(920, latchTime);
    latchOsc.frequency.exponentialRampToValueAtTime(95, latchTime + 0.055);

    latchGain.gain.setValueAtTime(0.18, latchTime);
    latchGain.gain.exponentialRampToValueAtTime(0.001, latchTime + 0.06);

    latchOsc.connect(latchGain);
    latchGain.connect(ctx.destination);
    latchOsc.start(latchTime);
    latchOsc.stop(latchTime + 0.065);
  } catch {
    // Ignore audio context restrictions
  }
}

/**
 * 4A. Xenon Flash Capacitor Charge Whine + Strobe Ready Pop
 * Rising high-frequency capacitor charge sweep characteristic of vintage 35mm flash units.
 */
export function playFlashChargeSound(): void {
  if (!getSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1650, now);
    osc.frequency.exponentialRampToValueAtTime(3950, now + 0.34);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.37);
  } catch {
    // Ignore audio context restrictions
  }
}

/**
 * 4B. Tactile Darkroom Rotary Dial / Detent Switch Click
 * Subtle, crisp mechanical detent click for preset selection, paper stock switches, and guide toggles.
 */
export function playTactileClickSound(): void {
  if (!getSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1580, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.018);

    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.022);
  } catch {
    // Ignore audio context restrictions
  }
}

/**
 * 5. Darkroom Print Roller Eject, Paper Guillotine Cutter & Completion Chime
 * Plays when exporting/downloading a photo strip, opening the print sheet, or generating a share QR code.
 */
export function playPrintEjectSound(): void {
  if (!getSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Stage 1: Paper transport roller feed whir (0ms -> 240ms)
    const rollerOsc = ctx.createOscillator();
    const rollerGain = ctx.createGain();
    rollerOsc.type = 'sawtooth';
    rollerOsc.frequency.setValueAtTime(110, now);
    rollerOsc.frequency.linearRampToValueAtTime(148, now + 0.22);

    const rollerFilter = ctx.createBiquadFilter();
    rollerFilter.type = 'lowpass';
    rollerFilter.frequency.setValueAtTime(380, now);

    rollerGain.gain.setValueAtTime(0.001, now);
    rollerGain.gain.linearRampToValueAtTime(0.05, now + 0.04);
    rollerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    rollerOsc.connect(rollerFilter);
    rollerFilter.connect(rollerGain);
    rollerGain.connect(ctx.destination);
    rollerOsc.start(now);
    rollerOsc.stop(now + 0.25);

    // Stage 2: Crisp rotary paper cutter slice (t = +190ms)
    const sliceBufferSize = Math.floor(ctx.sampleRate * 0.055);
    const sliceBuffer = ctx.createBuffer(1, sliceBufferSize, ctx.sampleRate);
    const sliceData = sliceBuffer.getChannelData(0);
    for (let i = 0; i < sliceBufferSize; i++) {
      sliceData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }

    const sliceSource = ctx.createBufferSource();
    sliceSource.buffer = sliceBuffer;

    const sliceFilter = ctx.createBiquadFilter();
    sliceFilter.type = 'highpass';
    sliceFilter.frequency.setValueAtTime(2600, now + 0.19);

    const sliceGain = ctx.createGain();
    sliceGain.gain.setValueAtTime(0.14, now + 0.19);
    sliceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.245);

    sliceSource.connect(sliceFilter);
    sliceFilter.connect(sliceGain);
    sliceGain.connect(ctx.destination);
    sliceSource.start(now + 0.19);

    // Stage 3: Warm darkroom tray delivery chime (t = +240ms, harmonic fifth E5 -> B5)
    const chimeNotes = [659.25, 987.77];
    chimeNotes.forEach((freq, idx) => {
      const start = now + 0.24 + idx * 0.075;
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(freq, start);

      chimeGain.gain.setValueAtTime(0.001, start);
      chimeGain.gain.linearRampToValueAtTime(0.085, start + 0.012);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(start);
      chimeOsc.stop(start + 0.34);
    });
  } catch {
    // Ignore audio context restrictions
  }
}

export interface SoundEffectDescriptor {
  id: 'shutter' | 'countdown' | 'film-advance' | 'tactile-dial' | 'print-eject';
  number: number;
  label: string;
  description: string;
  trigger: () => void;
}

export const SOUND_EFFECT_CATALOG: SoundEffectDescriptor[] = [
  {
    id: 'shutter',
    number: 1,
    label: '35mm Mechanical Shutter & Mirror Return',
    description: 'Two-stage focal-plane curtain snap, broadband leaf transient, and post-shot frame wind.',
    trigger: () => playMechanicalShutterSound()
  },
  {
    id: 'countdown',
    number: 2,
    label: 'Self-Timer Countdown Ticks & Readiness Tone',
    description: 'Quartz clockwork ticks on 3 & 2 with a pitched readiness tone on 1 before capture.',
    trigger: () => playCountdownTickSound(1)
  },
  {
    id: 'film-advance',
    number: 3,
    label: '35mm Sprocket Reel Advance & Motor Whir',
    description: 'Mechanical sprocket ratchet train and motorized film transport between capture and darkroom.',
    trigger: () => playFilmAdvanceSound()
  },
  {
    id: 'tactile-dial',
    number: 4,
    label: 'Xenon Flash Charge & Darkroom Rotary Detent Clicks',
    description: 'Capacitor charge sweep for burst photography and crisp detent clicks for presets & dials.',
    trigger: () => {
      playTactileClickSound();
      playFlashChargeSound();
    }
  },
  {
    id: 'print-eject',
    number: 5,
    label: 'Darkroom Print Roller Eject & Guillotine Chime',
    description: 'Paper roller transport whir, rotary guillotine slice, and warm darkroom completion chime.',
    trigger: () => playPrintEjectSound()
  }
];


/**
 * "Soft & Organic" Audio Engine
 * Focused on warm, tactile, and non-intrusive UI sounds.
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const initAudio = () => {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Master Channel
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.3; // Lower global volume for subtlety
      
      // Soft Limiter to prevent harsh peaks
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -10;
      compressor.ratio.value = 4;
      masterGain.connect(compressor);
      compressor.connect(audioCtx.destination);
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume();
  }
};

// --- Utility: Soft Noise ---
const createPinkNoise = () => {
    if (!audioCtx) return null;
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // (roughly) compensate for gain
        b6 = white * 0.115926;
    }
    return buffer;
};

let pinkNoiseBuffer: AudioBuffer | null = null;


// --- Sound Functions ---

export const playClickSound = () => {
  initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;

  // "Soft Bubble Pop"
  // Pure Sine wave with a rapid pitch drop
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(masterGain);

  // Pitch Drop (Bubble effect)
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
  
  // Volume Envelope (Soft attack, quick decay)
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.8, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

  osc.start(t);
  osc.stop(t + 0.1);
};

export const playLikeSound = () => {
  initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;

  // "Warm Heartbeat" / "Double Pop"
  // Two soft thuds
  const playThud = (time: number, freq: number) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = 'triangle'; // Richer tone
      osc.connect(gain);
      gain.connect(masterGain!);

      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.1);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.5, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

      osc.start(time);
      osc.stop(time + 0.2);
  };

  playThud(t, 300);
  playThud(t + 0.1, 400); // Second one slightly higher
};

export const playSuccessSound = () => {
  initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;

  // "Ethereal Chime"
  // A soft major chord with long release
  const chord = [440, 554.37, 659.25]; // A Major
  
  chord.forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(masterGain!);

      // Slight stagger for strumming effect
      const startTime = t + i * 0.05;

      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5); // Long, dreamy tail

      osc.start(startTime);
      osc.stop(startTime + 2);
  });
};

export const playNotificationSound = () => {
  initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;

  // "Water Droplet"
  // Sine wave with distinct pitch modulation
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(masterGain);

  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(400, t + 0.2);
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.6, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

  osc.start(t);
  osc.stop(t + 0.3);
};

export const playOpenModalSound = () => {
  initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;

  // "Soft Whoosh In"
  // Low-pass filtered pink noise, filter opening up
  if (!pinkNoiseBuffer) pinkNoiseBuffer = createPinkNoise();
  if (!pinkNoiseBuffer) return;

  const source = audioCtx.createBufferSource();
  source.buffer = pinkNoiseBuffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  
  const gain = audioCtx.createGain();
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  // Gentle sweep
  filter.frequency.setValueAtTime(100, t);
  filter.frequency.exponentialRampToValueAtTime(600, t + 0.3);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.2, t + 0.1); // Quiet
  gain.gain.linearRampToValueAtTime(0, t + 0.3);

  source.start(t);
  source.stop(t + 0.4);
};

export const playCloseModalSound = () => {
  initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;

  // "Soft Whoosh Out"
  // Filter closing down
  if (!pinkNoiseBuffer) pinkNoiseBuffer = createPinkNoise();
  if (!pinkNoiseBuffer) return;

  const source = audioCtx.createBufferSource();
  source.buffer = pinkNoiseBuffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  
  const gain = audioCtx.createGain();
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  filter.frequency.setValueAtTime(600, t);
  filter.frequency.exponentialRampToValueAtTime(100, t + 0.25);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
  gain.gain.linearRampToValueAtTime(0, t + 0.25);

  source.start(t);
  source.stop(t + 0.3);
};

let lastTypingSoundTime = 0;
const typingSoundCooldown = 60; // Increased from 30 to 60 to reduce lag

export const playTypingSound = () => {
  const now = Date.now();
  if (now - lastTypingSoundTime < typingSoundCooldown) return;
  lastTypingSoundTime = now;

  initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;

  // "Matte Keypress" / "Thock"
  // Very short, low pitched pulse
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle'; // Softer than square, harder than sine
  osc.connect(gain);
  gain.connect(masterGain);

  // Randomize pitch slightly for realism
  const freq = 150 + Math.random() * 30;
  osc.frequency.setValueAtTime(freq, t);
  
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05); // Extremely short

  osc.start(t);
  osc.stop(t + 0.06);
};

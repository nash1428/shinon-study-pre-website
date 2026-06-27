"use client";

/**
 * LoFi Ambient Music Generator — Japan-inspired
 * Uses Web Audio API to generate a self-contained lo-fi soundscape.
 * 
 * Features:
 * - Japanese hirajoshi pentatonic scale
 * - Soft sine wave synth tones with low-pass filter
 * - Slow, random melody with reverb-like delay
 * - Subtle bass notes
 * - Gentle hi-hat pattern
 */

const HIRAJOSHI_SCALE = [
  261.63, // C4
  277.18, // C#4 (hirajoshi characteristic semitone)
  349.23, // F4
  392.00, // G4
  415.30, // G#4
  523.25, // C5
  554.37, // C#5
  698.46, // F5
];

const BASS_NOTES = [
  65.41,  // C2
  73.42,  // D2
  87.31,  // F2
  98.00,  // G2
];

export class LoFiMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private delay: DelayNode | null = null;
  private delayGain: GainNode | null = null;
  private isPlaying = false;
  private melodyTimer: ReturnType<typeof setTimeout> | null = null;
  private bassTimer: ReturnType<typeof setTimeout> | null = null;
  private hatTimer: ReturnType<typeof setTimeout> | null = null;

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      this.ctx = new AudioContext();
      const ctx = this.ctx;

      // Master gain (low volume for ambient)
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.15;
      this.masterGain.connect(ctx.destination);

      // Low-pass filter for warmth
      this.filter = ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 1200;
      this.filter.Q.value = 0.5;
      this.filter.connect(this.masterGain);

      // Delay for reverb-like effect
      this.delay = ctx.createDelay(1.0);
      this.delay.delayTime.value = 0.35;
      this.delayGain = ctx.createGain();
      this.delayGain.gain.value = 0.25;
      this.delay.connect(this.delayGain);
      this.delayGain.connect(this.filter); // feedback
      this.delayGain.connect(this.delay);
      this.filter.connect(this.delay);

      this.scheduleMelody();
      this.scheduleBass();
      this.scheduleHat();
    } catch (err) {
      console.error("[LoFiMusic] Failed to start:", err);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.melodyTimer) clearTimeout(this.melodyTimer);
    if (this.bassTimer) clearTimeout(this.bassTimer);
    if (this.hatTimer) clearTimeout(this.hatTimer);
    
    if (this.masterGain && this.ctx) {
      // Fade out
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
      
      setTimeout(() => {
        this.ctx?.close().catch(() => {});
        this.ctx = null;
      }, 600);
    }
  }

  get playing() {
    return this.isPlaying;
  }

  private scheduleMelody() {
    if (!this.isPlaying || !this.ctx || !this.filter) return;

    // Pick a random note from the hirajoshi scale
    const freq = HIRAJOSHI_SCALE[Math.floor(Math.random() * HIRAJOSHI_SCALE.length)];
    const now = this.ctx.currentTime;

    // Create oscillator (soft sine)
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    // Gain envelope (soft attack, slow release)
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.3); // soft attack
    gain.gain.linearRampToValueAtTime(0.08, now + 1.5);  // sustain
    gain.gain.linearRampToValueAtTime(0, now + 3.0);     // release

    osc.connect(gain);
    gain.connect(this.filter);
    osc.start(now);
    osc.stop(now + 3.2);

    // Schedule next note (random delay 2-5 seconds for slow, sparse melody)
    const nextDelay = 2000 + Math.random() * 3000;
    this.melodyTimer = setTimeout(() => this.scheduleMelody(), nextDelay);
  }

  private scheduleBass() {
    if (!this.isPlaying || !this.ctx || !this.filter) return;

    const freq = BASS_NOTES[Math.floor(Math.random() * BASS_NOTES.length)];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 4.0);

    osc.connect(gain);
    gain.connect(this.filter);
    osc.start(now);
    osc.stop(now + 4.2);

    // Next bass note every 4-6 seconds
    const nextDelay = 4000 + Math.random() * 2000;
    this.bassTimer = setTimeout(() => this.scheduleBass(), nextDelay);
  }

  private scheduleHat() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // Create a very subtle hi-hat sound using white noise
    const bufferSize = this.ctx.sampleRate * 0.05; // 50ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const hatFilter = this.ctx.createBiquadFilter();
    hatFilter.type = "highpass";
    hatFilter.frequency.value = 6000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(hatFilter);
    hatFilter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);

    // Next hat every 0.5-1.5 seconds (slow, lo-fi feel)
    const nextDelay = 500 + Math.random() * 1000;
    this.hatTimer = setTimeout(() => this.scheduleHat(), nextDelay);
  }
}

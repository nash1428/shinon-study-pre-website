"use client";

/**
 * LoFi Ambient Music Generator — Japan-inspired, true lo-fi aesthetic
 * 
 * Features:
 * - Vinyl crackle (constant warm noise floor)
 * - Kick + snare + hi-hat drum pattern at ~72 BPM
 * - Jazz chord stabs (minor 7th chords) in Japanese pentatonic
 * - Tape warble (slight pitch fluctuation)
 * - Heavy low-pass filtering for warmth
 * - Bass line following the chord progression
 */

// Japanese hirajoshi scale — C, C#, F, G, G#
// Chord progressions (root, third, fifth, seventh) — minor 7th voicings
const CHORDS = [
  { root: 65.41,  notes: [65.41, 77.78, 98.00, 116.54] }, // C2, D#3/F-, G2, A#2 — Cm7 voicing
  { root: 73.42,  notes: [73.42, 87.31, 110.00, 130.81] }, // D2, F2, A2, C3 — Dm7
  { root: 87.31,  notes: [87.31, 103.83, 130.81, 155.56] }, // F2, G#2, C3, D#3 — Fm7
  { root: 98.00,  notes: [98.00, 116.54, 146.83, 174.61] }, // G2, A#2, D3, F3 — Gm7
];

const BPM = 72;
const BEAT_MS = 60000 / BPM; // ms per beat
const BAR_MS = BEAT_MS * 4; // ms per bar (4/4)

export class LoFiMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private drumGain: GainNode | null = null;
  private vinylGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private delay: DelayNode | null = null;
  private delayGain: GainNode | null = null;
  private isPlaying = false;
  private barCount = 0;
  private currentChord = 0;
  private barTimer: ReturnType<typeof setTimeout> | null = null;
  private beatTimer: ReturnType<typeof setTimeout> | null = null;
  private vinylTimer: ReturnType<typeof setTimeout> | null = null;
  private warbleTimer: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      this.ctx = new AudioContext();
      const ctx = this.ctx;

      // Master gain
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.25;
      this.masterGain.connect(ctx.destination);

      // Music chain: filter → delay → musicGain → masterGain
      this.filter = ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 800; // heavy low-pass for lo-fi warmth
      this.filter.Q.value = 0.3;

      // Delay (short echo for space)
      this.delay = ctx.createDelay(0.5);
      this.delay.delayTime.value = 0.28;
      this.delayGain = ctx.createGain();
      this.delayGain.gain.value = 0.15;
      this.delay.connect(this.delayGain);
      this.delayGain.connect(this.filter);
      this.filter.connect(this.delay);

      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.filter);
      this.filter.connect(this.masterGain);

      // Drum gain (separate, less filtered)
      this.drumGain = ctx.createGain();
      this.drumGain.gain.value = 0.4;
      this.drumGain.connect(this.masterGain);

      // Vinyl crackle gain
      this.vinylGain = ctx.createGain();
      this.vinylGain.gain.value = 0.08;
      this.vinylGain.connect(this.masterGain);

      this.currentChord = 0;
      this.barCount = 0;

      // Start the rhythm
      this.scheduleBar();
      this.scheduleVinylCrackle();
      this.startWarble();
    } catch (err) {
      console.error("[LoFiMusic] Failed to start:", err);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.barTimer) clearTimeout(this.barTimer);
    if (this.beatTimer) clearTimeout(this.beatTimer);
    if (this.vinylTimer) clearTimeout(this.vinylTimer);
    if (this.warbleTimer) clearInterval(this.warbleTimer);

    if (this.masterGain && this.ctx) {
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

  // ====== Tape warble (subtle pitch fluctuation) ======
  private startWarble() {
    if (!this.filter || !this.ctx) return;
    this.warbleTimer = setInterval(() => {
      if (!this.filter || !this.ctx) return;
      const now = this.ctx.currentTime;
      // Slight filter frequency wobble (simulates tape speed variation)
      const baseFreq = 800;
      const wobble = Math.sin(now * 0.5) * 50 + (Math.random() - 0.5) * 30;
      this.filter.frequency.setTargetAtTime(baseFreq + wobble, now, 0.1);
    }, 100);
  }

  // ====== Drum pattern (kick on 1&3, snare on 2&4, hat on offbeats) ======
  private scheduleBar() {
    if (!this.isPlaying || !this.ctx) return;

    const chord = CHORDS[this.currentChord];

    // Beat 1: Kick + chord stab
    this.scheduleKick(0);
    this.scheduleChordStab(chord, 0);

    // Beat 2: Snare + hi-hat
    this.scheduleSnare(BEAT_MS);
    this.scheduleHat(BEAT_MS * 0.5);

    // Beat 3: Kick + chord stab (higher octave)
    this.scheduleKick(BEAT_MS * 2);
    this.scheduleChordStab(chord, BEAT_MS * 2, 2);

    // Beat 4: Snare + hi-hat
    this.scheduleSnare(BEAT_MS * 3);
    this.scheduleHat(BEAT_MS * 2.5);
    this.scheduleHat(BEAT_MS * 3.5);

    // Bass note on beat 1 (long, sustained)
    this.scheduleBass(chord.root, 0);

    // Advance chord every 2 bars
    this.barCount++;
    if (this.barCount % 2 === 0) {
      this.currentChord = (this.currentChord + 1) % CHORDS.length;
    }

    // Schedule next bar
    this.barTimer = setTimeout(() => this.scheduleBar(), BAR_MS);
  }

  // ====== Kick drum ======
  private scheduleKick(offsetMs: number) {
    if (!this.ctx || !this.drumGain) return;
    const time = this.ctx.currentTime + offsetMs / 1000;

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.drumGain);
    osc.start(time);
    osc.stop(time + 0.35);
  }

  // ====== Snare (noise + tone) ======
  private scheduleSnare(offsetMs: number) {
    if (!this.ctx || !this.drumGain) return;
    const time = this.ctx.currentTime + offsetMs / 1000;

    // Noise component
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumGain);
    noise.start(time);

    // Tone component (snare body)
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 180;

    const toneGain = this.ctx.createGain();
    toneGain.gain.setValueAtTime(0.08, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(toneGain);
    toneGain.connect(this.drumGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  // ====== Hi-hat ======
  private scheduleHat(offsetMs: number) {
    if (!this.ctx || !this.drumGain) return;
    const time = this.ctx.currentTime + offsetMs / 1000;

    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.03, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);
    noise.start(time);
  }

  // ====== Chord stab (jazz chord — multiple oscillators) ======
  private scheduleChordStab(chord: { notes: number[] }, offsetMs: number, octaveShift: number = 1) {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const musicGain = this.musicGain;
    const time = ctx.currentTime + offsetMs / 1000;

    chord.notes.forEach((freq, i) => {
      const adjustedFreq = freq * (octaveShift === 2 ? 2 : 1);

      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = adjustedFreq;

      // Slight detune for warmth
      osc.detune.value = (Math.random() - 0.5) * 8;

      const gain = ctx.createGain();
      const vol = i === 0 ? 0.12 : 0.05;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.0);

      osc.connect(gain);
      gain.connect(musicGain);
      osc.start(time);
      osc.stop(time + 1.1);
    });
  }

  // ====== Bass note (sustained) ======
  private scheduleBass(freq: number, offsetMs: number) {
    if (!this.ctx || !this.musicGain) return;
    const time = this.ctx.currentTime + offsetMs / 1000;

    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.5);
    gain.gain.linearRampToValueAtTime(0, time + 3.5);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 3.6);
  }

  // ====== Vinyl crackle (continuous warm noise) ======
  private scheduleVinylCrackle() {
    if (!this.isPlaying || !this.ctx || !this.vinylGain) return;

    const now = this.ctx.currentTime;
    const duration = 2.0; // generate 2 seconds at a time
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate vinyl crackle: mostly silence with random pops
    for (let i = 0; i < bufferSize; i++) {
      const baseNoise = (Math.random() - 0.5) * 0.02; // very quiet hiss
      // Random pops (crackle)
      if (Math.random() < 0.0008) {
        data[i] = (Math.random() - 0.5) * 0.6; // loud pop
      } else if (Math.random() < 0.003) {
        data[i] = (Math.random() - 0.5) * 0.2; // medium crackle
      } else {
        data[i] = baseNoise;
      }
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter for vinyl character
    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = "bandpass";
    crackleFilter.frequency.value = 2500;
    crackleFilter.Q.value = 0.5;

    noise.connect(crackleFilter);
    crackleFilter.connect(this.vinylGain);
    noise.start(now);

    // Schedule next crackle buffer
    this.vinylTimer = setTimeout(() => this.scheduleVinylCrackle(), duration * 1000 - 100);
  }
}

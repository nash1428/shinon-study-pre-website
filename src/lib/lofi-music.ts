"use client";

/**
 * Jazz LoFi Ambient Music Generator — Japan-inspired
 * 
 * Features:
 * - Extended jazz chord voicings (9th, 11th, 13th extensions)
 * - ii-V-I chord progressions (classic jazz harmony)
 * - Walking bass line
 * - Swing-feel drum pattern (~72 BPM with triplet swing)
 * - Vinyl crackle
 * - Tape warble
 * - Heavy low-pass filtering for warmth
 */

// Jazz chord voicings — extended harmonies (root, 3rd, 7th, 9th, 11th/13th)
const CHORDS = [
  // Dm9 (ii) — D, F, C, E, A
  { root: 73.42, notes: [146.83, 174.61, 261.63, 329.63, 440.00], bass: [36.71, 73.42, 110.00, 146.83] },
  // G13 (V) — G, B, F, A, D
  { root: 98.00, notes: [196.00, 246.94, 349.23, 440.00, 587.33], bass: [49.00, 98.00, 146.83, 196.00] },
  // Cmaj9 (I) — C, E, B, D, G#
  { root: 65.41, notes: [130.81, 164.81, 246.94, 293.66, 415.30], bass: [32.70, 65.41, 98.00, 130.81] },
  // Am11 (vi) — A, C, G, B, D
  { root: 55.00, notes: [110.00, 130.81, 196.00, 246.94, 293.66], bass: [27.50, 55.00, 82.41, 110.00] },
];

// Melody notes — Japanese hirajoshi influenced, adapted to jazz harmony
const MELODY_NOTES = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  493.88, // B4
  523.25, // C5
  587.33, // D5
  659.25, // E5
];

const BPM = 68;
const BEAT_MS = 60000 / BPM;
const SWING = 0.67; // swing ratio (0.67 = triplet feel)
const BAR_MS = BEAT_MS * 4;

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
  private melodyTimer: ReturnType<typeof setTimeout> | null = null;
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
      this.masterGain.gain.value = 0.22;
      this.masterGain.connect(ctx.destination);

      // Music chain: filter → delay → musicGain → masterGain
      this.filter = ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 900;
      this.filter.Q.value = 0.4;

      this.delay = ctx.createDelay(0.5);
      this.delay.delayTime.value = 0.25;
      this.delayGain = ctx.createGain();
      this.delayGain.gain.value = 0.18;
      this.delay.connect(this.delayGain);
      this.delayGain.connect(this.filter);
      this.filter.connect(this.delay);

      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0.45;
      this.musicGain.connect(this.filter);
      this.filter.connect(this.masterGain);

      // Drum gain (less filtered for punch)
      this.drumGain = ctx.createGain();
      this.drumGain.gain.value = 0.35;
      this.drumGain.connect(this.masterGain);

      // Vinyl crackle gain
      this.vinylGain = ctx.createGain();
      this.vinylGain.gain.value = 0.06;
      this.vinylGain.connect(this.masterGain);

      this.currentChord = 0;
      this.barCount = 0;

      this.scheduleBar();
      this.scheduleMelody();
      this.scheduleVinylCrackle();
      this.startWarble();
    } catch (err) {
      console.error("[LoFiMusic] Failed to start:", err);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.barTimer) clearTimeout(this.barTimer);
    if (this.melodyTimer) clearTimeout(this.melodyTimer);
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

  private startWarble() {
    if (!this.filter || !this.ctx) return;
    const filter = this.filter;
    const ctx = this.ctx;
    this.warbleTimer = setInterval(() => {
      const now = ctx.currentTime;
      const baseFreq = 900;
      const wobble = Math.sin(now * 0.4) * 40 + (Math.random() - 0.5) * 25;
      filter.frequency.setTargetAtTime(baseFreq + wobble, now, 0.1);
    }, 100);
  }

  // ====== Bar scheduler with swing ======
  private scheduleBar() {
    if (!this.isPlaying) return;

    const chord = CHORDS[this.currentChord];

    // Swing-adjusted beat times
    const swing1 = BEAT_MS * SWING;        // swung 8th
    const swing2 = BEAT_MS * (1 - SWING);  // other 8th

    // Beat 1: Kick + chord pad
    this.scheduleKick(0);
    this.scheduleChordPad(chord, 0);

    // Beat 1.5: Hi-hat (swung)
    this.scheduleHat(swing1, 0.025);

    // Beat 2: Snare (brush)
    this.scheduleSnareBrush(BEAT_MS);

    // Beat 2.5: Hi-hat (swung)
    this.scheduleHat(BEAT_MS + swing1, 0.02);

    // Beat 3: Kick + chord stab (higher)
    this.scheduleKick(BEAT_MS * 2);
    this.scheduleChordStab(chord, BEAT_MS * 2, 2);

    // Beat 3.5: Hi-hat (swung)
    this.scheduleHat(BEAT_MS * 2 + swing1, 0.025);

    // Beat 4: Snare (brush)
    this.scheduleSnareBrush(BEAT_MS * 3);

    // Beat 4.5: Hi-hat (swung, quieter — end of bar)
    this.scheduleHat(BEAT_MS * 3 + swing1, 0.015);

    // Walking bass — 4 notes per bar
    chord.bass.forEach((freq, i) => {
      this.scheduleBass(freq, i * BEAT_MS);
    });

    // Advance chord every 2 bars (ii-V-I-vi cycle)
    this.barCount++;
    if (this.barCount % 2 === 0) {
      this.currentChord = (this.currentChord + 1) % CHORDS.length;
    }

    this.barTimer = setTimeout(() => this.scheduleBar(), BAR_MS);
  }

  // ====== Jazz melody (sparse, improvisational) ======
  private scheduleMelody() {
    if (!this.isPlaying || !this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const musicGain = this.musicGain;

    const freq = MELODY_NOTES[Math.floor(Math.random() * MELODY_NOTES.length)];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(now);
    osc.stop(now + 1.6);

    // Next melody note: random timing for improvisational feel
    const nextDelay = 800 + Math.random() * 2500;
    this.melodyTimer = setTimeout(() => this.scheduleMelody(), nextDelay);
  }

  // ====== Kick ======
  private scheduleKick(offsetMs: number) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;
    const time = ctx.currentTime + offsetMs / 1000;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.drumGain);
    osc.start(time);
    osc.stop(time + 0.35);
  }

  // ====== Snare brush (jazz style — softer than rock snare) ======
  private scheduleSnareBrush(offsetMs: number) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;
    const time = ctx.currentTime + offsetMs / 1000;

    // Longer noise burst for brush effect
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // decay
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 2500;
    noiseFilter.Q.value = 0.7;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumGain);
    noise.start(time);
  }

  // ====== Hi-hat ======
  private scheduleHat(offsetMs: number, vol: number) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;
    const time = ctx.currentTime + offsetMs / 1000;

    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 8000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);
    noise.start(time);
  }

  // ====== Chord pad (sustained jazz chord) ======
  private scheduleChordPad(chord: { notes: number[] }, offsetMs: number) {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const musicGain = this.musicGain;
    const time = ctx.currentTime + offsetMs / 1000;

    chord.notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : i === 1 ? "triangle" : "sine";
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 6;

      const gain = ctx.createGain();
      const vol = i === 0 ? 0.08 : 0.04;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.15); // slow attack for pad
      gain.gain.linearRampToValueAtTime(vol * 0.7, time + 1.0);
      gain.gain.linearRampToValueAtTime(0, time + 3.5); // long release

      osc.connect(gain);
      gain.connect(musicGain);
      osc.start(time);
      osc.stop(time + 3.6);
    });
  }

  // ====== Chord stab (short hit) ======
  private scheduleChordStab(chord: { notes: number[] }, offsetMs: number, octave: number) {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const musicGain = this.musicGain;
    const time = ctx.currentTime + offsetMs / 1000;

    chord.notes.forEach((freq, i) => {
      const adjustedFreq = freq * (octave === 2 ? 2 : 1);

      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = adjustedFreq;
      osc.detune.value = (Math.random() - 0.5) * 8;

      const gain = ctx.createGain();
      const vol = i === 0 ? 0.1 : 0.04;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

      osc.connect(gain);
      gain.connect(musicGain);
      osc.start(time);
      osc.stop(time + 0.9);
    });
  }

  // ====== Walking bass ======
  private scheduleBass(freq: number, offsetMs: number) {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const musicGain = this.musicGain;
    const time = ctx.currentTime + offsetMs / 1000;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.03); // quick attack
    gain.gain.linearRampToValueAtTime(0.08, time + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, time + BEAT_MS / 1000 * 0.9);

    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(time);
    osc.stop(time + BEAT_MS / 1000 * 0.95);
  }

  // ====== Vinyl crackle ======
  private scheduleVinylCrackle() {
    if (!this.isPlaying || !this.ctx || !this.vinylGain) return;
    const ctx = this.ctx;
    const vinylGain = this.vinylGain;
    const now = ctx.currentTime;
    const duration = 2.0;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const baseNoise = (Math.random() - 0.5) * 0.015;
      if (Math.random() < 0.0006) {
        data[i] = (Math.random() - 0.5) * 0.5;
      } else if (Math.random() < 0.002) {
        data[i] = (Math.random() - 0.5) * 0.15;
      } else {
        data[i] = baseNoise;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = "bandpass";
    crackleFilter.frequency.value = 2000;
    crackleFilter.Q.value = 0.5;

    noise.connect(crackleFilter);
    crackleFilter.connect(vinylGain);
    noise.start(now);

    this.vinylTimer = setTimeout(() => this.scheduleVinylCrackle(), duration * 1000 - 100);
  }
}

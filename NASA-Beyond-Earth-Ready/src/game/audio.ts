import type { Settings } from './store';

type Sfx = 'blip' | 'open' | 'close' | 'confirm' | 'step' | 'scan' | 'reward' | 'deny' | 'type' | 'handheld' | 'boarding';
export type Ambience = 'home' | 'city' | 'airport' | 'wadi' | 'title' | 'none';

const SCALES: Record<Exclude<Ambience, 'none'>, number[]> = {
  title: [220, 261.6, 329.6, 392, 440, 523.3],
  home: [196, 246.9, 293.7, 329.6, 392, 493.9],
  city: [233.1, 277.2, 311.1, 349.2, 415.3, 466.2],
  airport: [261.6, 329.6, 392, 440, 523.3, 587.3],
  wadi: [220, 233.1, 277.2, 329.6, 349.2, 440],
};

class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode; music!: GainNode; amb!: GainNode; sfx!: GainNode;
  noise: AudioBufferSourceNode | null = null;
  noiseFilter: BiquadFilterNode | null = null;
  timer: number | null = null;
  mood: Ambience = 'none';
  step = 0;

  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    const c = this.ctx;
    this.master = c.createGain(); this.master.connect(c.destination);
    this.music = c.createGain(); this.music.connect(this.master);
    this.amb = c.createGain(); this.amb.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = c.createBufferSource(); this.noise.buffer = buf; this.noise.loop = true;
    this.noiseFilter = c.createBiquadFilter(); this.noiseFilter.type = 'lowpass'; this.noiseFilter.frequency.value = 400;
    const ng = c.createGain(); ng.gain.value = 0.18;
    this.noise.connect(this.noiseFilter); this.noiseFilter.connect(ng); ng.connect(this.amb);
    this.noise.start();
    this.timer = window.setInterval(() => this.tick(), 600);
  }

  apply(s: Settings) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.master, t, 0.1);
    this.music.gain.setTargetAtTime(s.music * 0.5, t, 0.1);
    this.amb.gain.setTargetAtTime(s.ambient, t, 0.1);
    this.sfx.gain.setTargetAtTime(s.sfx * 0.6, t, 0.1);
  }

  setMood(m: Ambience) {
    this.mood = m;
    if (!this.ctx || !this.noiseFilter) return;
    const f = { home: 260, city: 900, airport: 600, wadi: 1500, title: 300, none: 100 }[m];
    this.noiseFilter.frequency.setTargetAtTime(f, this.ctx.currentTime, 0.8);
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, out: GainNode, when = 0) {
    if (!this.ctx) return;
    const c = this.ctx; const t = c.currentTime + when;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.08, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }

  private tick() {
    if (!this.ctx || this.mood === 'none') return;
    const sc = SCALES[this.mood];
    this.step++;
    if (this.step % 8 === 0) { this.tone(sc[0] / 2, 4.5, 'sine', 0.12, this.music); this.tone(sc[2] / 2, 4.5, 'sine', 0.07, this.music); }
    if (Math.random() < 0.55) this.tone(sc[Math.floor(Math.random() * sc.length)], 1.6, 'triangle', 0.05, this.music);
  }

  play(k: Sfx) {
    if (!this.ctx) return;
    const s = this.sfx;
    switch (k) {
      case 'boarding': this.tone(660, 0.15, 'sine', 0.15, s); this.tone(880, 0.22, 'sine', 0.13, s, 0.17); break;
      case 'handheld':
        [659.25, 493.88, 587.33, 783.99, 880].forEach((f, i) => this.tone(f, 0.13, 'square', 0.085, s, i * 0.095));
        break;
      case 'blip': this.tone(880, 0.08, 'square', 0.05, s); break;
      case 'type': this.tone(1200 + Math.random() * 300, 0.03, 'square', 0.02, s); break;
      case 'open': this.tone(523, 0.1, 'triangle', 0.12, s); this.tone(784, 0.14, 'triangle', 0.1, s, 0.06); break;
      case 'close': this.tone(659, 0.1, 'triangle', 0.1, s); this.tone(440, 0.14, 'triangle', 0.09, s, 0.05); break;
      case 'confirm': [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.12, s, i * 0.07)); break;
      case 'deny': this.tone(196, 0.2, 'sawtooth', 0.06, s); break;
      case 'step': this.tone(90 + Math.random() * 30, 0.05, 'sine', 0.08, s); break;
      case 'scan': for (let i = 0; i < 6; i++) this.tone(600 + i * 120, 0.08, 'sine', 0.06, s, i * 0.12); break;
      case 'reward': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, s, i * 0.09)); break;
    }
  }
}

export const audio = new AudioEngine();

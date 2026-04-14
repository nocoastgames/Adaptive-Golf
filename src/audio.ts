export class AudioSystem {
  ctx: AudioContext | null = null;
  bgmOsc: OscillatorNode | null = null;
  bgmGain: GainNode | null = null;
  isPlayingBGM = false;

  ambientGain: GainNode | null = null;
  ambientStarted = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.startAmbient();
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playHit() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Sharp click (high frequency)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, t);
    osc1.frequency.exponentialRampToValueAtTime(100, t + 0.05);
    gain1.gain.setValueAtTime(1, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.05);

    // Noise thwack
    const bufferSize = this.ctx.sampleRate * 0.1; // 100ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
  }

  playHole() {
    this.init();
    if (!this.ctx) return;
    // Triumphant arpeggio
    [440, 554, 659, 880, 1108].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.4, 0.2), i * 100);
    });
  }

  playWater() {
    this.init();
    // Splash sound (noise-like)
    this.playTone(100, 'sawtooth', 0.5, 0.3);
    setTimeout(() => this.playTone(50, 'square', 0.4, 0.3), 100);
  }

  playBounce() {
    this.init();
    this.playTone(600, 'sine', 0.1, 0.1);
  }

  startAmbient() {
    if (!this.ctx || this.ambientStarted) return;
    this.ambientStarted = true;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.05; // Quiet
    this.ambientGain.connect(this.ctx.destination);

    // Wind noise
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    // Modulate wind filter
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2; // slow wind changes
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    noise.connect(filter);
    filter.connect(this.ambientGain);
    noise.start();

    // Birds (occasional chirps)
    setInterval(() => {
      if (!this.ambientGain || !this.ctx || Math.random() > 0.3) return; // 30% chance every 2s
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3000 + Math.random() * 1000, t);
      osc.frequency.exponentialRampToValueAtTime(2000 + Math.random() * 500, t + 0.2);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start(t);
      osc.stop(t + 0.2);
    }, 2000);
  }

  toggleBGM() {
    this.init();
    if (!this.ctx) return;

    if (this.isPlayingBGM) {
      if (this.bgmOsc) {
        this.bgmOsc.stop();
        this.bgmOsc.disconnect();
      }
      this.isPlayingBGM = false;
      return;
    }

    // Simple looping background drone/chord
    this.bgmOsc = this.ctx.createOscillator();
    this.bgmGain = this.ctx.createGain();
    
    this.bgmOsc.type = 'triangle';
    this.bgmOsc.frequency.setValueAtTime(110, this.ctx.currentTime); // A2
    
    // LFO for volume to make it pulse gently
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.5, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.bgmGain.gain);
    
    this.bgmGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    
    this.bgmOsc.connect(this.bgmGain);
    this.bgmGain.connect(this.ctx.destination);
    
    this.bgmOsc.start();
    lfo.start();
    this.isPlayingBGM = true;
  }
}

export const audio = new AudioSystem();

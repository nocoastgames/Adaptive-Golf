export class AudioSystem {
  ctx: AudioContext | null = null;
  bgmOsc: OscillatorNode | null = null;
  bgmGain: GainNode | null = null;
  isPlayingBGM = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
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
    this.playTone(300, 'square', 0.1, 0.2);
    this.playTone(150, 'triangle', 0.2, 0.2);
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

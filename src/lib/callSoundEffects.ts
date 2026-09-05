/**
 * Web Audio API Sound Effects Engine
 * Generates purposeful, high-fidelity audio cues directly in browser memory.
 * No external MP3/WAV assets, zero latency, works offline, and fully respects
 * browser autoplay restrictions with safe AudioContext unlocking.
 */

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private ringtoneInterval: number | null = null;
  private isUnlocked = false;

  constructor() {
    // Setup lazy unlock listeners on common user interactions
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockContext();
      };
      window.addEventListener('pointerdown', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockContext(): void {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    } else if (ctx && ctx.state === 'running') {
      this.isUnlocked = true;
    }
  }

  /**
   * Soft pop/chime for joining a room or call
   */
  public playJoinSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Gentle ascending warm tone: 440Hz -> 660Hz
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(660, now + 0.16);

      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.36);
      osc2.stop(now + 0.36);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Gentle descending chime for leaving a room or call
   */
  public playLeaveSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Descending tone: 520Hz -> 330Hz
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.22);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  /**
   * Light delicate ding for receiving new chat messages
   */
  public playMessageDing(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Crystal harmonic bell: 987.77Hz (B5) + 1975.5Hz (B6)
      osc1.frequency.setValueAtTime(987.77, now);
      osc2.frequency.setValueAtTime(1975.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.46);
      osc2.stop(now + 0.46);
    } catch {}
  }

  /**
   * Distinct, playful hand raise chime
   */
  public playHandRaiseSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 triad

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.14, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.32);
      });
    } catch {}
  }

  /**
   * Subtle tick/tone when toggling mute state
   */
  public playMuteSound(isNowMuted: boolean): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (isNowMuted) {
        // Descending subtle chirp for mute
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      } else {
        // Ascending subtle chirp for unmute
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.08);
      }

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  /**
   * Warm, melodic incoming/outgoing call ringtone
   * Soft pentatonic musical chords instead of harsh repeating buzzer
   */
  public startRingtone(): void {
    this.stopRingtone();
    const ctx = this.getContext();
    if (!ctx) return;

    const playRingtonePhrase = () => {
      try {
        const audioCtx = this.getContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        // Warm marimba arpeggio (F#4, A#4, C#5, F#5)
        const sequence = [
          { f: 369.99, delay: 0 },
          { f: 466.16, delay: 0.18 },
          { f: 554.37, delay: 0.36 },
          { f: 739.99, delay: 0.54 },
        ];

        sequence.forEach(({ f, delay }) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const noteTime = now + delay;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, noteTime);

          gain.gain.setValueAtTime(0.001, noteTime);
          gain.gain.linearRampToValueAtTime(0.14, noteTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.36);
        });
      } catch {}
    };

    // Play initial phrase immediately
    playRingtonePhrase();
    // Repeat every 2.4 seconds
    this.ringtoneInterval = window.setInterval(playRingtonePhrase, 2400);
  }

  public stopRingtone(): void {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  /**
   * Test chime for selected audio output (speaker)
   */
  public playTestChime(sinkId?: string): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);
    } catch {}
  }
}

export const soundEffects = new SoundEffectsEngine();

import type { AnimationLevel } from '../store/settingsStore';

export type AudioScene =
  | 'menu'
  | 'campaign'
  | 'primary'
  | 'general'
  | 'debate'
  | 'convention'
  | 'election_night'
  | 'endgame';

export type AudioCue =
  | 'click'
  | 'advance'
  | 'positive'
  | 'negative'
  | 'debate'
  | 'call';

export interface AudioPreferences {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  animationLevel?: AnimationLevel;
}

const SCENE_PATTERNS: Record<AudioScene, number[]> = {
  menu: [220, 277.18, 329.63],
  campaign: [174.61, 220, 261.63],
  primary: [164.81, 207.65, 246.94],
  general: [196, 246.94, 293.66],
  debate: [146.83, 185, 220],
  convention: [130.81, 164.81, 196],
  election_night: [110, 146.83, 196],
  endgame: [261.63, 329.63, 392]
};

class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private drones: OscillatorNode[] = [];
  private stepIndex = 0;
  private patternTimer: number | null = null;
  private currentScene: AudioScene = 'menu';
  private preferences: AudioPreferences = {
    masterVolume: 72,
    musicVolume: 58,
    sfxVolume: 72,
    musicEnabled: true,
    sfxEnabled: true
  };

  private ensureGraph() {
    if (typeof window === 'undefined') return false;
    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return false;
    if (this.context && this.masterGain && this.musicGain && this.sfxGain) return true;

    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);

    this.applyPreferences(this.preferences);
    this.startDrones();
    return true;
  }

  private startDrones() {
    if (!this.context || !this.musicGain || this.drones.length > 0) return;

    const waveforms: OscillatorType[] = ['triangle', 'sine', 'sawtooth'];
    this.drones = waveforms.map((waveform, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      oscillator.type = waveform;
      oscillator.frequency.value = SCENE_PATTERNS[this.currentScene][index] ?? 220;
      gain.gain.value = index === 0 ? 0.022 : index === 1 ? 0.016 : 0.01;
      oscillator.connect(gain);
      gain.connect(this.musicGain!);
      oscillator.start();
      return oscillator;
    });

    this.schedulePattern();
  }

  private schedulePattern() {
    if (typeof window === 'undefined') return;
    if (this.patternTimer) {
      window.clearInterval(this.patternTimer);
    }

    const tempo = this.preferences.animationLevel === 'minimal' ? 6200 : this.preferences.animationLevel === 'reduced' ? 5200 : 4200;
    this.patternTimer = window.setInterval(() => {
      this.stepIndex += 1;
      this.applyScenePattern();
    }, tempo);
    this.applyScenePattern();
  }

  private applyScenePattern() {
    if (!this.context || this.drones.length === 0) return;
    const now = this.context.currentTime;
    const basePattern = SCENE_PATTERNS[this.currentScene];
    const inversions = [0, 12, -12, 7];
    const inversion = inversions[this.stepIndex % inversions.length] ?? 0;

    this.drones.forEach((oscillator, index) => {
      const base = basePattern[index] ?? basePattern[0] ?? 220;
      const frequency = base * Math.pow(2, inversion / 12);
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.linearRampToValueAtTime(frequency, now + 0.75);
    });
  }

  private cueEnvelope(frequencies: number[], duration: number, type: OscillatorType, volume = 1) {
    if (!this.context || !this.sfxGain) return;
    const now = this.context.currentTime;

    frequencies.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055 * volume, now + 0.02 + (index * 0.01));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.sfxGain!);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.05);
    });
  }

  applyPreferences(preferences: AudioPreferences) {
    this.preferences = preferences;
    if (!this.ensureGraph() || !this.masterGain || !this.musicGain || !this.sfxGain) return;

    const master = preferences.musicEnabled || preferences.sfxEnabled
      ? preferences.masterVolume / 100
      : 0;
    this.masterGain.gain.value = master * 0.22;
    this.musicGain.gain.value = preferences.musicEnabled ? (preferences.musicVolume / 100) : 0;
    this.sfxGain.gain.value = preferences.sfxEnabled ? (preferences.sfxVolume / 100) : 0;
    this.schedulePattern();
  }

  async unlock() {
    if (!this.ensureGraph() || !this.context) return;
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  setScene(scene: AudioScene) {
    this.currentScene = scene;
    if (!this.ensureGraph()) return;
    this.applyScenePattern();
  }

  playCue(cue: AudioCue) {
    if (!this.preferences.sfxEnabled) return;
    if (!this.ensureGraph()) return;

    if (cue === 'click') {
      this.cueEnvelope([440], 0.08, 'triangle', 0.8);
      return;
    }
    if (cue === 'advance') {
      this.cueEnvelope([220, 330], 0.14, 'triangle', 0.95);
      return;
    }
    if (cue === 'positive') {
      this.cueEnvelope([261.63, 329.63, 392], 0.26, 'sine', 1);
      return;
    }
    if (cue === 'negative') {
      this.cueEnvelope([196, 174.61, 146.83], 0.24, 'sawtooth', 0.8);
      return;
    }
    if (cue === 'debate') {
      this.cueEnvelope([293.66, 369.99], 0.2, 'triangle', 0.95);
      return;
    }
    if (cue === 'call') {
      this.cueEnvelope([246.94, 392], 0.32, 'triangle', 1);
    }
  }
}

export const audioManager = new AudioManager();

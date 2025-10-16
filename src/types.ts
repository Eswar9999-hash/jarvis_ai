export interface Message {
  id: string;
  text: string;
  type: 'user' | 'jarvis';
  timestamp: Date;
}

export type Theme = 'classic' | 'arc-reactor' | 'stealth' | 'mark85' | 'war-machine';

export type VoiceMode = 'push-to-talk' | 'always-listening';

export interface VoiceSettings {
  type: 'male' | 'female';
  speed: number;
  pitch: number;
  volume: number;
}

export interface Settings {
  theme: Theme;
  voiceSettings: VoiceSettings;
  voiceMode: VoiceMode;
  autoScroll: boolean;
}

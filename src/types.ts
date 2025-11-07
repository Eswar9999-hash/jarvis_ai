export interface Message {
  id: string;
  text: string;
  type: 'user' | 'jarvis';
  timestamp: Date;
}

export interface VoiceSettings {
  type: 'male' | 'female';
  speed: number;
  pitch: number;
  volume: number;
}

export interface AISettings {
  model: string;
  maxTokens: number;
  temperature: number;
  maxHistory: number;
  timeout: number;
}

export interface Settings {
  theme: Theme;
  voiceSettings: VoiceSettings;
  aiSettings: AISettings;
  voiceMode: VoiceMode;
  autoScroll: boolean;
}

export type Theme = 'arc-reactor' | 'classic' | 'stealth' | 'mark85' | 'war-machine';
export type VoiceMode = 'push-to-talk' | 'always-listening';

export interface AIResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  emotionalContext?: import('./types/cognitive').SentimentAnalysis;
  cognitiveContext?: import('./types/cognitive').CognitiveContext;
  thoughtProcess?: import('./types/cognitive').ThoughtProcess;
}

// Re-export cognitive types for convenience
export * from './types/cognitive';

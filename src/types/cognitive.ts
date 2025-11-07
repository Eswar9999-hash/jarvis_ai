// Cognitive and Emotional Intelligence Types

export interface EmotionalVector {
  joy: number;        // 0-1
  sadness: number;    // 0-1
  anger: number;      // 0-1
  fear: number;       // 0-1
  surprise: number;   // 0-1
  disgust: number;    // 0-1
  trust: number;      // 0-1
  anticipation: number; // 0-1
}

export interface EmotionalState {
  current: EmotionalVector;
  target: EmotionalVector;
  intensity: number;  // 0-1, overall emotional intensity
  stability: number;  // 0-1, how stable the emotional state is
}

export interface SentimentAnalysis {
  polarity: 'positive' | 'negative' | 'neutral';
  confidence: number;  // 0-1
  emotions: EmotionalVector;
  keywords: string[];
  urgency: number;    // 0-1
}

export interface ThoughtProcess {
  reasoning: string[];
  considerations: string[];
  conclusion: string;
  confidence: number; // 0-1
  alternatives: string[];
}

export interface CognitiveContext {
  conversationTopic: string;
  userIntent: string;
  previousContext: string[];
  relevantMemories: Memory[];
  emotionalContext: SentimentAnalysis;
}

export interface Memory {
  id: string;
  content: string;
  type: 'fact' | 'preference' | 'event' | 'conversation';
  importance: number;  // 0-1
  timestamp: Date;
  tags: string[];
  emotionalContext?: EmotionalVector;
  accessCount: number;
  lastAccessed: Date;
}

export interface AdaptiveLearning {
  responseQuality: number;  // 0-1, based on user feedback
  preferredTopics: string[];
  communicationStyle: 'formal' | 'casual' | 'technical' | 'friendly';
  adaptationRate: number;  // 0-1, how quickly to adapt
}

export interface VoiceEmotion {
  tone: 'cheerful' | 'empathetic' | 'concerned' | 'excited' | 'calm' | 'professional';
  pacing: number;  // 0.5-2.0, speech rate multiplier
  inflection: number;  // 0-1, pitch variation
  emphasis: string[];  // words to emphasize
  pauses: number[];     // positions for pauses (ms)
}

export interface PerformanceMetrics {
  responseTime: number;  // ms
  emotionalAccuracy: number;  // 0-1
  cognitiveAccuracy: number;  // 0-1
  userSatisfaction: number;  // 0-1
  timestamp: Date;
}


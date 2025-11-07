/**
 * Emotional Text-to-Speech Engine
 * Generates speech with emotional context and natural prosody
 */

import { VoiceEmotion, EmotionalVector, SentimentAnalysis } from '../types/cognitive';
import { VoiceSettings } from '../types';

export class EmotionalTTS {
  /**
   * Generates voice emotion parameters from emotional context
   */
  static generateVoiceEmotion(
    sentiment: SentimentAnalysis,
    emotionalVector: EmotionalVector,
    context: 'response' | 'greeting' | 'error' | 'excited'
  ): VoiceEmotion {
    const primaryEmotion = this.getPrimaryEmotion(emotionalVector);
    const intensity = this.getEmotionalIntensity(emotionalVector);
    
    let tone: VoiceEmotion['tone'] = 'professional';
    let pacing = 1.0;
    let inflection = 0.5;
    const emphasis: string[] = [];
    const pauses: number[] = [];
    
    // Determine tone based on sentiment and emotion
    if (sentiment.polarity === 'positive' && primaryEmotion === 'joy') {
      tone = 'cheerful';
      pacing = 1.1 + (intensity * 0.2);
      inflection = 0.6 + (intensity * 0.2);
    } else if (sentiment.polarity === 'negative' && (primaryEmotion === 'sadness' || primaryEmotion === 'fear')) {
      tone = 'empathetic';
      pacing = 0.9 - (intensity * 0.1);
      inflection = 0.4 + (intensity * 0.2);
    } else if (primaryEmotion === 'anger') {
      tone = 'concerned';
      pacing = 1.0;
      inflection = 0.5;
    } else if (primaryEmotion === 'surprise' || primaryEmotion === 'anticipation') {
      tone = 'excited';
      pacing = 1.15 + (intensity * 0.15);
      inflection = 0.7 + (intensity * 0.2);
    } else if (context === 'error') {
      tone = 'concerned';
      pacing = 0.95;
      inflection = 0.4;
    } else if (context === 'greeting') {
      tone = 'cheerful';
      pacing = 1.05;
      inflection = 0.6;
    }
    
    // Adjust for urgency
    if (sentiment.urgency > 0.5) {
      pacing = Math.min(pacing * 1.1, 1.5);
      inflection += 0.1;
    }
    
    return {
      tone,
      pacing: Math.max(0.5, Math.min(2.0, pacing)),
      inflection: Math.max(0, Math.min(1, inflection)),
      emphasis,
      pauses
    };
  }
  
  /**
   * Applies emotional voice parameters to speech synthesis
   */
  static applyEmotionalVoice(
    utterance: SpeechSynthesisUtterance,
    voiceEmotion: VoiceEmotion,
    baseSettings: VoiceSettings
  ): void {
    // Base rate with emotional pacing
    utterance.rate = baseSettings.speed * voiceEmotion.pacing;
    
    // Base pitch with emotional inflection
    const pitchVariation = (voiceEmotion.inflection - 0.5) * 0.2;
    utterance.pitch = baseSettings.pitch + pitchVariation;
    
    // Volume adjustment based on emotion
    if (voiceEmotion.tone === 'excited' || voiceEmotion.tone === 'cheerful') {
      utterance.volume = Math.min(1, baseSettings.volume * 1.1);
    } else if (voiceEmotion.tone === 'empathetic' || voiceEmotion.tone === 'concerned') {
      utterance.volume = baseSettings.volume * 0.95;
    } else {
      utterance.volume = baseSettings.volume;
    }
  }
  
  /**
   * Processes text to add prosodic markers (pauses, emphasis)
   */
  static processTextForProsody(text: string, voiceEmotion: VoiceEmotion): string {
    let processedText = text;
    
    // Add pauses after sentence endings
    processedText = processedText.replace(/([.!?])\s+/g, '$1... ');
    
    // Add emphasis to important words (if detected)
    if (voiceEmotion.emphasis.length > 0) {
      voiceEmotion.emphasis.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        processedText = processedText.replace(regex, `<emphasis level="moderate">${word}</emphasis>`);
      });
    }
    
    // Add pauses for emotional effect
    if (voiceEmotion.tone === 'empathetic' || voiceEmotion.tone === 'concerned') {
      // Longer pauses for empathetic responses
      processedText = processedText.replace(/(,)\s+/g, '$1... ');
    }
    
    return processedText;
  }
  
  /**
   * Gets primary emotion from vector
   */
  private static getPrimaryEmotion(emotionalVector: EmotionalVector): keyof EmotionalVector {
    let maxValue = 0;
    let primaryEmotion: keyof EmotionalVector = 'joy';
    
    Object.entries(emotionalVector).forEach(([emotion, value]) => {
      if (value > maxValue) {
        maxValue = value;
        primaryEmotion = emotion as keyof EmotionalVector;
      }
    });
    
    return primaryEmotion;
  }
  
  /**
   * Gets emotional intensity
   */
  private static getEmotionalIntensity(emotionalVector: EmotionalVector): number {
    const values = Object.values(emotionalVector);
    return Math.max(...values);
  }
}


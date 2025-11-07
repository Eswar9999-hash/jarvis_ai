/**
 * Sentiment Analysis and Emotional Intelligence Engine
 * Analyzes user input to determine emotional context and sentiment
 */

import { SentimentAnalysis, EmotionalVector } from '../types/cognitive';

// Simple keyword-based sentiment analysis (can be enhanced with ML models)
const POSITIVE_KEYWORDS = [
  'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'happy',
  'joy', 'excited', 'pleased', 'delighted', 'grateful', 'thankful', 'awesome',
  'perfect', 'brilliant', 'outstanding', 'superb', 'marvelous', 'splendid'
];

const NEGATIVE_KEYWORDS = [
  'terrible', 'awful', 'horrible', 'bad', 'hate', 'angry', 'frustrated',
  'disappointed', 'sad', 'upset', 'worried', 'concerned', 'problem', 'issue',
  'error', 'failed', 'broken', 'wrong', 'difficult', 'struggle'
];

const URGENT_KEYWORDS = [
  'urgent', 'emergency', 'asap', 'immediately', 'now', 'quickly', 'hurry',
  'critical', 'important', 'priority', 'now', 'right away'
];

const EMOTION_KEYWORDS: Record<keyof EmotionalVector, string[]> = {
  joy: ['happy', 'joy', 'excited', 'delighted', 'pleased', 'celebrate', 'wonderful'],
  sadness: ['sad', 'depressed', 'down', 'unhappy', 'disappointed', 'melancholy'],
  anger: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated'],
  fear: ['afraid', 'scared', 'worried', 'anxious', 'nervous', 'fear', 'concerned'],
  surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected'],
  disgust: ['disgusted', 'revolted', 'sickened', 'repulsed'],
  trust: ['trust', 'confident', 'believe', 'reliable', 'sure'],
  anticipation: ['anticipate', 'expect', 'await', 'looking forward', 'eager']
};

export class SentimentAnalyzer {
  /**
   * Analyzes text to determine sentiment and emotional context
   */
  static analyze(text: string): SentimentAnalysis {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    // Count keyword matches
    let positiveCount = 0;
    let negativeCount = 0;
    let urgentCount = 0;
    
    const emotions: Partial<EmotionalVector> = {};
    const keywords: string[] = [];
    
    // Analyze each word
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      
      if (POSITIVE_KEYWORDS.some(kw => cleanWord.includes(kw))) {
        positiveCount++;
        keywords.push(cleanWord);
      }
      
      if (NEGATIVE_KEYWORDS.some(kw => cleanWord.includes(kw))) {
        negativeCount++;
        keywords.push(cleanWord);
      }
      
      if (URGENT_KEYWORDS.some(kw => cleanWord.includes(kw))) {
        urgentCount++;
      }
      
      // Detect emotions
      Object.entries(EMOTION_KEYWORDS).forEach(([emotion, emotionKeywords]) => {
        if (emotionKeywords.some(kw => cleanWord.includes(kw))) {
          emotions[emotion as keyof EmotionalVector] = 
            (emotions[emotion as keyof EmotionalVector] || 0) + 0.1;
        }
      });
    });
    
    // Normalize emotional vector
    const emotionalVector: EmotionalVector = {
      joy: Math.min(emotions.joy || 0, 1),
      sadness: Math.min(emotions.sadness || 0, 1),
      anger: Math.min(emotions.anger || 0, 1),
      fear: Math.min(emotions.fear || 0, 1),
      surprise: Math.min(emotions.surprise || 0, 1),
      disgust: Math.min(emotions.disgust || 0, 1),
      trust: Math.min(emotions.trust || 0, 1),
      anticipation: Math.min(emotions.anticipation || 0, 1),
    };
    
    // Determine polarity
    const totalScore = positiveCount - negativeCount;
    let polarity: 'positive' | 'negative' | 'neutral';
    let confidence: number;
    
    if (totalScore > 0) {
      polarity = 'positive';
      confidence = Math.min(0.5 + (totalScore / words.length) * 2, 1);
    } else if (totalScore < 0) {
      polarity = 'negative';
      confidence = Math.min(0.5 + (Math.abs(totalScore) / words.length) * 2, 1);
    } else {
      polarity = 'neutral';
      confidence = 0.3;
    }
    
    // Calculate urgency
    const urgency = Math.min(urgentCount / words.length * 10, 1);
    
    return {
      polarity,
      confidence,
      emotions: emotionalVector,
      keywords: [...new Set(keywords)],
      urgency
    };
  }
  
  /**
   * Detects emotional intensity from text
   */
  static getEmotionalIntensity(emotionalVector: EmotionalVector): number {
    const values = Object.values(emotionalVector);
    return Math.max(...values);
  }
  
  /**
   * Determines primary emotion from vector
   */
  static getPrimaryEmotion(emotionalVector: EmotionalVector): keyof EmotionalVector {
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
}


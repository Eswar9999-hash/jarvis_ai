/**
 * Adaptive Learning System
 * Improves responses over time based on interactions and feedback
 */

import { AdaptiveLearning, PerformanceMetrics, SentimentAnalysis } from '../types/cognitive';

export class AdaptiveLearningSystem {
  private learning: AdaptiveLearning = {
    responseQuality: 0.7,
    preferredTopics: [],
    communicationStyle: 'friendly',
    adaptationRate: 0.1
  };
  
  private metricsHistory: PerformanceMetrics[] = [];
  private maxHistorySize = 100;
  
  /**
   * Records performance metrics
   */
  recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    const fullMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date()
    };
    
    this.metricsHistory.push(fullMetrics);
    
    // Keep history size manageable
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
    
    // Update learning parameters
    this.updateLearning(fullMetrics);
  }
  
  /**
   * Updates learning parameters based on metrics
   */
  private updateLearning(metrics: PerformanceMetrics): void {
    // Update response quality (moving average)
    this.learning.responseQuality = 
      this.learning.responseQuality * (1 - this.learning.adaptationRate) +
      metrics.userSatisfaction * this.learning.adaptationRate;
    
    // Adjust communication style based on performance
    if (metrics.userSatisfaction < 0.5) {
      // Try different style if current one isn't working
      const styles: AdaptiveLearning['communicationStyle'][] = 
        ['formal', 'casual', 'technical', 'friendly'];
      const currentIndex = styles.indexOf(this.learning.communicationStyle);
      const nextIndex = (currentIndex + 1) % styles.length;
      this.learning.communicationStyle = styles[nextIndex];
    }
    
    // Adjust adaptation rate based on stability
    if (this.metricsHistory.length > 10) {
      const recentMetrics = this.metricsHistory.slice(-10);
      const avgSatisfaction = recentMetrics.reduce((sum, m) => sum + m.userSatisfaction, 0) / 10;
      const variance = recentMetrics.reduce((sum, m) => 
        sum + Math.pow(m.userSatisfaction - avgSatisfaction, 2), 0) / 10;
      
      // If high variance, increase adaptation rate
      if (variance > 0.1) {
        this.learning.adaptationRate = Math.min(0.2, this.learning.adaptationRate * 1.1);
      } else {
        // If stable, decrease adaptation rate
        this.learning.adaptationRate = Math.max(0.05, this.learning.adaptationRate * 0.95);
      }
    }
  }
  
  /**
   * Extracts topics from conversation for preference learning
   */
  learnTopicPreferences(topic: string, sentiment: SentimentAnalysis): void {
    if (sentiment.polarity === 'positive') {
      // Add or increase preference for topic
      if (!this.learning.preferredTopics.includes(topic)) {
        this.learning.preferredTopics.push(topic);
      }
      // Keep only top 10 preferred topics
      if (this.learning.preferredTopics.length > 10) {
        this.learning.preferredTopics.shift();
      }
    }
  }
  
  /**
   * Gets current learning state
   */
  getLearning(): AdaptiveLearning {
    return { ...this.learning };
  }
  
  /**
   * Gets average performance metrics
   */
  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metricsHistory.length === 0) {
      return {
        responseTime: 0,
        emotionalAccuracy: 0,
        cognitiveAccuracy: 0,
        userSatisfaction: 0
      };
    }
    
    const recent = this.metricsHistory.slice(-20); // Last 20 interactions
    
    return {
      responseTime: recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length,
      emotionalAccuracy: recent.reduce((sum, m) => sum + m.emotionalAccuracy, 0) / recent.length,
      cognitiveAccuracy: recent.reduce((sum, m) => sum + m.cognitiveAccuracy, 0) / recent.length,
      userSatisfaction: recent.reduce((sum, m) => sum + m.userSatisfaction, 0) / recent.length
    };
  }
  
  /**
   * Gets communication style hint for response generation
   */
  getStyleHint(): string {
    const style = this.learning.communicationStyle;
    const hints = {
      formal: 'Use formal, professional language with proper structure',
      casual: 'Use casual, conversational language with friendly tone',
      technical: 'Use technical terminology and precise language',
      friendly: 'Use warm, approachable language with personal touches'
    };
    
    return hints[style] || hints.friendly;
  }
  
  /**
   * Resets learning state
   */
  reset(): void {
    this.learning = {
      responseQuality: 0.7,
      preferredTopics: [],
      communicationStyle: 'friendly',
      adaptationRate: 0.1
    };
    this.metricsHistory = [];
  }
}


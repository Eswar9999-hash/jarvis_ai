/**
 * Performance Tracking and Optimization
 * Monitors response times and system performance
 */

import { PerformanceMetrics } from '../types/cognitive';

export class PerformanceTracker {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;
  
  /**
   * Records a performance metric
   */
  record(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }
  
  /**
   * Gets average response time
   */
  getAverageResponseTime(window: number = 50): number {
    const recent = this.metrics.slice(-window);
    if (recent.length === 0) return 0;
    
    return recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
  }
  
  /**
   * Gets performance statistics
   */
  getStats(): {
    avgResponseTime: number;
    p95ResponseTime: number;
    avgEmotionalAccuracy: number;
    avgCognitiveAccuracy: number;
    avgUserSatisfaction: number;
    totalInteractions: number;
  } {
    if (this.metrics.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        avgEmotionalAccuracy: 0,
        avgCognitiveAccuracy: 0,
        avgUserSatisfaction: 0,
        totalInteractions: 0
      };
    }
    
    const recent = this.metrics.slice(-100);
    const responseTimes = recent.map(m => m.responseTime).sort((a, b) => a - b);
    
    return {
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      avgEmotionalAccuracy: recent.reduce((sum, m) => sum + m.emotionalAccuracy, 0) / recent.length,
      avgCognitiveAccuracy: recent.reduce((sum, m) => sum + m.cognitiveAccuracy, 0) / recent.length,
      avgUserSatisfaction: recent.reduce((sum, m) => sum + m.userSatisfaction, 0) / recent.length,
      totalInteractions: this.metrics.length
    };
  }
  
  /**
   * Checks if performance meets targets
   */
  meetsTargets(): {
    responseTime: boolean;
    emotionalAccuracy: boolean;
    cognitiveAccuracy: boolean;
    overall: boolean;
  } {
    const stats = this.getStats();
    
    return {
      responseTime: stats.avgResponseTime < 500, // < 500ms target
      emotionalAccuracy: stats.avgEmotionalAccuracy > 0.7,
      cognitiveAccuracy: stats.avgCognitiveAccuracy > 0.7,
      overall: stats.avgResponseTime < 500 && 
               stats.avgEmotionalAccuracy > 0.7 && 
               stats.avgCognitiveAccuracy > 0.7
    };
  }
  
  /**
   * Clears all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();


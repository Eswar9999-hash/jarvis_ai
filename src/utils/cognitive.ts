/**
 * Cognitive Processing Engine
 * Simulates thought processes and reasoning for more natural responses
 */

import { ThoughtProcess, CognitiveContext, SentimentAnalysis } from '../types/cognitive';
import { Message } from '../types';

export class CognitiveProcessor {
  /**
   * Generates a thought process simulation for a given input
   */
  static generateThoughtProcess(
    userInput: string,
    context: CognitiveContext,
    sentiment: SentimentAnalysis
  ): ThoughtProcess {
    const reasoning: string[] = [];
    const considerations: string[] = [];
    const alternatives: string[] = [];
    
    // Analyze user intent
    const intent = this.analyzeIntent(userInput);
    reasoning.push(`User intent identified as: ${intent}`);
    
    // Consider emotional context
    if (sentiment.polarity === 'negative') {
      considerations.push('User appears to be experiencing negative emotions');
      reasoning.push('Response should be empathetic and supportive');
    } else if (sentiment.polarity === 'positive') {
      considerations.push('User is in a positive emotional state');
      reasoning.push('Response can be more enthusiastic and engaging');
    }
    
    // Consider urgency
    if (sentiment.urgency > 0.5) {
      considerations.push('High urgency detected in user input');
      reasoning.push('Response should be direct and action-oriented');
    }
    
    // Consider conversation topic
    if (context.conversationTopic) {
      reasoning.push(`Context: ${context.conversationTopic}`);
      considerations.push(`Maintaining conversation about: ${context.conversationTopic}`);
    }
    
    // Consider relevant memories
    if (context.relevantMemories.length > 0) {
      const memorySummary = context.relevantMemories
        .slice(0, 3)
        .map(m => m.content.substring(0, 50))
        .join(', ');
      considerations.push(`Relevant context: ${memorySummary}`);
      reasoning.push('Using historical context to inform response');
    }
    
    // Generate alternatives
    if (sentiment.polarity === 'negative') {
      alternatives.push('Provide empathetic response with solution');
      alternatives.push('Acknowledge concern and offer assistance');
    } else {
      alternatives.push('Engage positively and provide helpful information');
      alternatives.push('Build on positive energy with detailed response');
    }
    
    // Generate conclusion
    const conclusion = this.generateConclusion(intent, sentiment, context);
    
    // Calculate confidence based on context richness
    const confidence = Math.min(
      0.5 + 
      (context.relevantMemories.length * 0.1) + 
      (sentiment.confidence * 0.2) +
      (context.conversationTopic ? 0.1 : 0),
      1
    );
    
    return {
      reasoning,
      considerations,
      conclusion,
      confidence,
      alternatives
    };
  }
  
  /**
   * Analyzes user intent from input
   */
  static analyzeIntent(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.match(/\b(what|how|why|when|where|who|explain|tell me)\b/)) {
      return 'information_seeking';
    }
    if (lowerInput.match(/\b(do|can|could|should|would|help|assist)\b/)) {
      return 'action_request';
    }
    if (lowerInput.match(/\b(thank|thanks|appreciate|grateful)\b/)) {
      return 'gratitude';
    }
    if (lowerInput.match(/\b(problem|issue|error|broken|wrong|fix)\b/)) {
      return 'problem_report';
    }
    if (lowerInput.match(/\b(hello|hi|hey|greetings|good morning|good afternoon)\b/)) {
      return 'greeting';
    }
    
    return 'general_conversation';
  }
  
  /**
   * Generates conclusion based on analysis
   */
  private static generateConclusion(
    intent: string,
    sentiment: SentimentAnalysis,
    context: CognitiveContext
  ): string {
    if (sentiment.polarity === 'negative' && sentiment.urgency > 0.5) {
      return 'Provide immediate, empathetic assistance with actionable solutions';
    }
    
    if (intent === 'information_seeking') {
      return 'Provide comprehensive, accurate information with context';
    }
    
    if (intent === 'gratitude') {
      return 'Acknowledge gratitude warmly and offer continued assistance';
    }
    
    if (context.relevantMemories.length > 0) {
      return 'Leverage historical context to provide personalized response';
    }
    
    return 'Engage naturally with appropriate emotional tone matching user sentiment';
  }
  
  /**
   * Extracts conversation topic from messages
   */
  static extractTopic(messages: Message[]): string {
    if (messages.length === 0) return '';
    
    // Get last few user messages
    const userMessages = messages
      .filter(m => m.type === 'user')
      .slice(-3)
      .map(m => m.text.toLowerCase());
    
    if (userMessages.length === 0) return '';
    
    // Simple keyword extraction (can be enhanced with NLP)
    const allWords = userMessages.join(' ').split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    const wordFreq: Record<string, number> = {};
    allWords.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });
    
    // Get top keywords
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
    
    return topWords.join(', ') || userMessages[userMessages.length - 1].substring(0, 50);
  }
}


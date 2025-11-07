/**
 * Cognitive Processing Hook
 * Integrates sentiment analysis, cognitive processing, memory, and adaptive learning
 */

import { useState, useCallback, useRef } from 'react';
import { Message } from '../types';
import { SentimentAnalyzer } from '../utils/sentiment';
import { CognitiveProcessor } from '../utils/cognitive';
import { MemorySystem } from '../utils/memory';
import { AdaptiveLearningSystem } from '../utils/adaptiveLearning';
import { performanceTracker } from '../utils/performance';
import { CognitiveContext, SentimentAnalysis, ThoughtProcess } from '../types/cognitive';

export const useCognitive = () => {
  const [emotionalState, setEmotionalState] = useState<SentimentAnalysis | null>(null);
  const memorySystemRef = useRef(new MemorySystem());
  const learningSystemRef = useRef(new AdaptiveLearningSystem());
  
  /**
   * Processes user input with full cognitive pipeline
   */
  const processInput = useCallback((
    userInput: string,
    messages: Message[]
  ): {
    sentiment: SentimentAnalysis;
    cognitiveContext: CognitiveContext;
    thoughtProcess: ThoughtProcess;
  } => {
    const startTime = performance.now();
    
    // 1. Sentiment Analysis
    const sentiment = SentimentAnalyzer.analyze(userInput);
    setEmotionalState(sentiment);
    
    // 2. Memory Retrieval
    const relevantMemories = memorySystemRef.current.retrieveMemories(userInput, 5);
    
    // 3. Extract conversation topic
    const conversationTopic = CognitiveProcessor.extractTopic(messages);
    
    // 4. Build cognitive context
    const cognitiveContext: CognitiveContext = {
      conversationTopic,
      userIntent: CognitiveProcessor.analyzeIntent(userInput),
      previousContext: messages.slice(-3).map(m => m.text),
      relevantMemories,
      emotionalContext: sentiment
    };
    
    // 5. Generate thought process
    const thoughtProcess = CognitiveProcessor.generateThoughtProcess(
      userInput,
      cognitiveContext,
      sentiment
    );
    
    // 6. Learn from interaction
    if (conversationTopic) {
      learningSystemRef.current.learnTopicPreferences(conversationTopic, sentiment);
    }
    
    // 7. Record performance
    const responseTime = performance.now() - startTime;
    performanceTracker.record({
      responseTime,
      emotionalAccuracy: sentiment.confidence,
      cognitiveAccuracy: thoughtProcess.confidence,
      userSatisfaction: 0.7, // Default, can be updated with feedback
      timestamp: new Date()
    });
    
    return {
      sentiment,
      cognitiveContext,
      thoughtProcess
    };
  }, []);
  
  /**
   * Stores conversation in memory
   */
  const storeConversation = useCallback((messages: Message[], importance: number = 0.3) => {
    memorySystemRef.current.storeConversation(messages, importance);
  }, []);
  
  /**
   * Gets memory system for external access
   */
  const getMemorySystem = useCallback(() => memorySystemRef.current, []);
  
  /**
   * Gets learning system for external access
   */
  const getLearningSystem = useCallback(() => learningSystemRef.current, []);
  
  return {
    emotionalState,
    processInput,
    storeConversation,
    getMemorySystem,
    getLearningSystem
  };
};


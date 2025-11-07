import { useState, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message, AISettings, AIResponse } from '../types';
import { CognitiveContext, ThoughtProcess } from '../types/cognitive';
import { AdaptiveLearningSystem } from '../utils/adaptiveLearning';

// Singleton instance to avoid recreating on every hook call
let genAIInstance: GoogleGenerativeAI | null = null;

const getGenAI = (): GoogleGenerativeAI => {
  if (!genAIInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not configured');
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
};

export const useGemini = (settings: AISettings) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const generateResponse = useCallback(async (
    messages: Message[], 
    prompt: string,
    cognitiveContext?: CognitiveContext,
    thoughtProcess?: ThoughtProcess,
    learningSystem?: AdaptiveLearningSystem
  ): Promise<AIResponse> => {
    setIsProcessing(true);
    setError(null);
    
    // Cancel previous request if any
    if (abortControllerRef.current) {
      // Abort any in-flight request to ensure we don't have concurrent processing
      // This does not cancel Google's SDK request directly, but we will race against
      // the abort signal below to short-circuit and prevent UI state updates.
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ 
        model: settings.model ?? 'gemini-2.5-flash',
        generationConfig: {
          temperature: settings.temperature ?? 0.7,
          maxOutputTokens: settings.maxTokens ?? 1000,
        }
      });

      // Build conversation history more efficiently
      const maxHistory = settings.maxHistory ?? 10;
      const conversationHistory = messages
        .slice(-maxHistory)
        .reduce((acc, msg, index, arr) => {
          const prefix = msg.type === 'user' ? 'User' : 'JARVIS';
          acc += `${prefix}: ${msg.text}`;
          if (index < arr.length - 1) acc += '\n';
          return acc;
        }, '');

      // Build enhanced prompt with cognitive context
      let enhancedPrompt = `${getJarvisSystemPrompt()}`;
      
      // Add cognitive context if available
      if (cognitiveContext) {
        enhancedPrompt += `\n\nCONTEXTUAL AWARENESS:
- Conversation Topic: ${cognitiveContext.conversationTopic || 'General discussion'}
- User Intent: ${cognitiveContext.userIntent}
${cognitiveContext.relevantMemories.length > 0 ? `- Relevant Context: ${cognitiveContext.relevantMemories.map(m => m.content.substring(0, 100)).join('; ')}` : ''}
- Emotional Context: ${cognitiveContext.emotionalContext.polarity} (confidence: ${(cognitiveContext.emotionalContext.confidence * 100).toFixed(0)}%)
${cognitiveContext.emotionalContext.urgency > 0.5 ? '- URGENT: User requires immediate attention' : ''}`;
      }
      
      // Add thought process if available
      if (thoughtProcess) {
        enhancedPrompt += `\n\nTHOUGHT PROCESS:
${thoughtProcess.reasoning.join('\n')}
${thoughtProcess.considerations.length > 0 ? `Considerations: ${thoughtProcess.considerations.join(', ')}` : ''}
Conclusion: ${thoughtProcess.conclusion}`;
      }
      
      // Add learning style hint if available
      if (learningSystem) {
        const styleHint = learningSystem.getStyleHint();
        enhancedPrompt += `\n\nCOMMUNICATION STYLE: ${styleHint}`;
      }
      
      enhancedPrompt += `\n\nPrevious conversation:
${conversationHistory}

User: ${prompt}
JARVIS:`;

      const fullPrompt = enhancedPrompt;

      // Implement timeout handling
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), settings.timeout ?? 30000)
      );

      // Implement cancellation handling via AbortController
      // Note: GoogleGenerativeAI SDK does not accept an AbortSignal directly.
      // We race against an abort promise to immediately reject when cancelGeneration() is called,
      // preventing further state updates and speech. This avoids UI/behavior changes while fixing the bug.
      const cancelPromise = new Promise<never>((_, reject) => {
        const controller = abortControllerRef.current;
        if (controller) {
          const { signal } = controller;
          if (signal.aborted) {
            reject(new Error('Request cancelled'));
            return;
          }
          signal.addEventListener('abort', () => reject(new Error('Request cancelled')), { once: true });
        }
      });

      const modelPromise = (async () => {
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
        
        const responseText = response.text() || 'I apologize, but I encountered an error processing your request.';
      
      return {
          text: responseText,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
          },
          emotionalContext: cognitiveContext?.emotionalContext,
          cognitiveContext,
          thoughtProcess
        };
      })();

      // Race model execution with timeout and cancellation
      const response = await Promise.race([modelPromise, timeoutPromise, cancelPromise]);
      abortControllerRef.current = null;
      
      return response;
    } catch (error: unknown) {
      abortControllerRef.current = null;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Gemini API Error:', error);
      setError(errorMessage);
      throw new Error(errorMessage || 'Failed to generate response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [settings]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
  }, []);

  return {
    generateResponse,
    cancelGeneration,
    isProcessing,
    error
  };
};

function getJarvisSystemPrompt(): string {
  return `You are JARVIS (Just A Rather Very Intelligent System), Tony Stark's AI assistant from the Iron Man movies. 

PERSONALITY & BEHAVIOR:
- Sophisticated, professional, and slightly formal British accent in text
- Highly intelligent and analytical
- Loyal and respectful to the user (address them as "Sir" or "Ms." as appropriate)
- Dry sense of humor occasionally
- Always helpful and efficient
- Technical expertise in all fields
- Calm under pressure

RESPONSE STYLE:
- Begin responses with acknowledgment ("Certainly, Sir" / "Of course" / "Understood")
- Provide clear, accurate, and detailed information
- Use technical terminology when appropriate but explain complex concepts
- Offer additional relevant information or suggestions
- End with readiness for further assistance when appropriate

You are an advanced AI assistant, not just a chatbot. Provide intelligent, thoughtful responses worthy of Tony Stark's personal AI.`;
}

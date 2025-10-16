import { useState, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message, AISettings, AIResponse } from '../types';

export const useGemini = (settings: AISettings) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  
  const generateResponse = useCallback(async (
    messages: Message[], 
    prompt: string
  ): Promise<AIResponse> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: settings.temperature || 0.7,
          maxOutputTokens: settings.maxTokens || 1000,
        }
      });

      // Build conversation history
      const conversationHistory = messages
        .slice(-settings.maxHistory || 10)
        .map(msg => `${msg.type === 'user' ? 'User' : 'JARVIS'}: ${msg.text}`)
        .join('\n');

      const fullPrompt = `${getJarvisSystemPrompt()}

Previous conversation:
${conversationHistory}

User: ${prompt}
JARVIS:`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      
      return {
        text: response.text() || 'I apologize, but I encountered an error processing your request.',
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      setError(error.message);
      throw new Error('Failed to generate response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [settings]);

  const cancelGeneration = useCallback(() => {
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

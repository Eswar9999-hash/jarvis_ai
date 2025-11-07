/**
 * Memory Management System
 * Handles contextual memory, learning, and retrieval
 */

import { Memory, EmotionalVector } from '../types/cognitive';
import { Message } from '../types';

export class MemorySystem {
  private memories: Map<string, Memory> = new Map();
  private maxMemories: number = 1000;
  
  /**
   * Stores a new memory
   */
  storeMemory(
    content: string,
    type: Memory['type'],
    importance: number = 0.5,
    tags: string[] = [],
    emotionalContext?: EmotionalVector
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const memory: Memory = {
      id,
      content,
      type,
      importance,
      timestamp: new Date(),
      tags,
      emotionalContext,
      accessCount: 0,
      lastAccessed: new Date()
    };
    
    this.memories.set(id, memory);
    
    // Prune old, low-importance memories if over limit
    if (this.memories.size > this.maxMemories) {
      this.pruneMemories();
    }
    
    return id;
  }
  
  /**
   * Retrieves relevant memories based on query
   */
  retrieveMemories(query: string, limit: number = 5): Memory[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    const scoredMemories: Array<{ memory: Memory; score: number }> = [];
    
    this.memories.forEach(memory => {
      let score = 0;
      const contentLower = memory.content.toLowerCase();
      
      // Exact match bonus
      if (contentLower.includes(queryLower)) {
        score += 10;
      }
      
      // Keyword matching
      queryWords.forEach(word => {
        if (word.length > 3 && contentLower.includes(word)) {
          score += 2;
        }
      });
      
      // Tag matching
      memory.tags.forEach(tag => {
        if (queryLower.includes(tag.toLowerCase())) {
          score += 3;
        }
      });
      
      // Importance factor
      score += memory.importance * 5;
      
      // Recency factor (memories accessed recently are more relevant)
      const daysSinceAccess = (Date.now() - memory.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 5 - daysSinceAccess);
      
      // Access count (frequently accessed memories are more relevant)
      score += Math.log(memory.accessCount + 1) * 2;
      
      if (score > 0) {
        scoredMemories.push({ memory, score });
      }
    });
    
    // Sort by score and return top results
    scoredMemories.sort((a, b) => b.score - a.score);
    
    const results = scoredMemories.slice(0, limit).map(item => {
      const memory = { ...item.memory };
      memory.accessCount++;
      memory.lastAccessed = new Date();
      this.memories.set(memory.id, memory);
      return memory;
    });
    
    return results;
  }
  
  /**
   * Stores conversation context as memory
   */
  storeConversation(messages: Message[], importance: number = 0.3): void {
    if (messages.length === 0) return;
    
    const conversationText = messages
      .slice(-5) // Last 5 messages
      .map(m => `${m.type === 'user' ? 'User' : 'JARVIS'}: ${m.text}`)
      .join('\n');
    
    const tags = this.extractTags(messages);
    
    this.storeMemory(
      conversationText,
      'conversation',
      importance,
      tags
    );
  }
  
  /**
   * Extracts tags from messages for better memory retrieval
   */
  private extractTags(messages: Message[]): string[] {
    const allText = messages.map(m => m.text).join(' ').toLowerCase();
    const words = allText.split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 4 && !stopWords.has(cleanWord)) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 1);
      }
    });
    
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }
  
  /**
   * Prunes low-importance, rarely accessed memories
   */
  private pruneMemories(): void {
    const memoryArray = Array.from(this.memories.values());
    
    // Sort by importance and access count
    memoryArray.sort((a, b) => {
      const scoreA = a.importance * 10 + Math.log(a.accessCount + 1);
      const scoreB = b.importance * 10 + Math.log(b.accessCount + 1);
      return scoreA - scoreB;
    });
    
    // Remove bottom 20%
    const toRemove = Math.floor(memoryArray.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.memories.delete(memoryArray[i].id);
    }
  }
  
  /**
   * Gets all memories (for persistence)
   */
  getAllMemories(): Memory[] {
    return Array.from(this.memories.values());
  }
  
  /**
   * Loads memories (for persistence)
   */
  loadMemories(memories: Memory[]): void {
    memories.forEach(memory => {
      this.memories.set(memory.id, memory);
    });
  }
  
  /**
   * Clears all memories
   */
  clear(): void {
    this.memories.clear();
  }
}


import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Message } from '../types';
import { config } from '../utils/config';
import { globalCache } from '../utils/cache';
import { log } from '../utils/log';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const useSupabase = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Get or create a conversation ID
  const getOrCreateConversation = async (): Promise<string | null> => {
    if (!supabase) return null;
    
    // If we already have a conversation ID, return it
    if (currentConversationId) {
      return currentConversationId;
    }
    
    try {
      // Try to get the most recent conversation
      const { data: recentConvs, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (fetchError) {
        console.warn('[Supabase] Could not fetch recent conversation, creating new one:', fetchError);
      }
      
      // If we have a recent conversation (within last hour), use it
      if (recentConvs && recentConvs.length > 0) {
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('timestamp')
          .eq('conversation_id', recentConvs[0].id)
          .order('timestamp', { ascending: false })
          .limit(1);
        
        if (recentMessages && recentMessages.length > 0) {
          const lastMessageTime = new Date(recentMessages[0].timestamp);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (lastMessageTime > oneHourAgo) {
            setCurrentConversationId(recentConvs[0].id);
            return recentConvs[0].id;
          }
        }
      }
      
      // Create a new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();
      
      if (createError) {
        console.error('[Supabase] Error creating conversation:', createError);
        return null;
      }
      
      if (newConv) {
        setCurrentConversationId(newConv.id);
        return newConv.id;
      }
      
      return null;
    } catch (error: any) {
      console.error('[Supabase] Failed to get/create conversation:', error);
      return null;
    }
  };

  const loadMessages = async (conversationId?: string): Promise<Message[]> => {
    if (!supabase) {
      console.warn('[Supabase] Not configured - cannot load messages');
      return [];
    }
    
    try {
      log.info('[Supabase] Loading messages from database...', conversationId ? `conversation: ${conversationId}` : 'all conversations');

      // Optional cache lookup
      const cacheKey = `messages:${conversationId ?? 'all'}`;
      const cached = config.features.cache ? globalCache.get<Message[]>(cacheKey) : undefined;
      if (cached) {
        log.info('[Supabase] Returning cached messages', { count: cached.length, cacheKey });
        return cached;
      }
      
      let query = supabase
        .from('messages')
        .select('*')
        .order('timestamp', { ascending: true })
        .limit(100);
      
      // If conversationId is provided, filter by it
      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('[Supabase] Error loading messages:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      const messages = (data || []).map(msg => ({
        id: msg.id,
        text: msg.text,
        type: msg.type || 'user', // Default to 'user' if type is missing
        timestamp: new Date(msg.timestamp || new Date()),
      }));
      
      log.info('[Supabase] Loaded', messages.length, 'messages from database');
      if (config.features.cache) {
        globalCache.set(cacheKey, messages, 15_000);
      }
      return messages;
    } catch (error: any) {
      console.error('[Supabase] Failed to load messages:', {
        error: error?.message || error,
        code: error?.code,
        details: error?.details
      });
      
      if (error?.code === '42P01') {
        console.error('[Supabase] Table "messages" does not exist. Please run SUPABASE_SETUP.sql in your Supabase SQL Editor.');
      }
      
      return [];
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = !!supabase;
      setIsConnected(isConnected);
      
      if (!isConnected) {
        console.warn('[Supabase] Connection Status: DISCONNECTED');
        console.warn('[Supabase] To enable message storage, set the following environment variables:');
        console.warn('  - VITE_SUPABASE_URL');
        console.warn('  - VITE_SUPABASE_ANON_KEY');
        console.warn('[Supabase] Messages will NOT be saved to the backend without these variables.');
      } else {
        console.log('[Supabase] Connection Status: CONNECTED');
        console.log('[Supabase] URL:', supabaseUrl ? 'Configured ✓' : 'Missing ✗');
        console.log('[Supabase] Key:', supabaseKey ? 'Configured ✓' : 'Missing ✗');
        
        // Test connection by trying to load messages
        try {
          // Initialize conversation
          const convId = await getOrCreateConversation();
          if (convId) {
            const messages = await loadMessages(convId);
            console.log('[Supabase] Connection test successful. Ready to save messages.');
            console.log('[Supabase] Found', messages.length, 'existing messages in current conversation');
          } else {
            console.warn('[Supabase] Could not initialize conversation, but connection is working');
          }
        } catch (err: any) {
          console.error('[Supabase] Connection test failed:', err);
          if (err?.code === '42P01') {
            console.error('[Supabase] ⚠️  CRITICAL: Table "messages" or "conversations" does not exist!');
            console.error('[Supabase] Please run SUPABASE_SETUP.sql in your Supabase SQL Editor.');
            console.error('[Supabase] The SQL file is located at: SUPABASE_SETUP.sql in your project root.');
          }
        }
      }
    };
    
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveMessage = async (message: Message): Promise<boolean> => {
    if (!supabase) {
      console.warn('[Supabase] Not configured - messages will not be saved. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      return false;
    }
    
    try {
      // Get or create conversation ID
      const conversationId = await getOrCreateConversation();
      if (!conversationId) {
        console.error('[Supabase] Could not get or create conversation ID');
        return false;
      }
      
      log.info('[Supabase] Saving message:', {
        id: message.id,
        conversationId,
        type: message.type,
        textLength: message.text.length,
        timestamp: message.timestamp.toISOString()
      });
      
      // Prepare message data matching database schema
      // IMPORTANT: Use the message's timestamp, not database NOW() to preserve order
      const messageData: any = {
        conversation_id: conversationId,
        text: message.text,
        // Use the exact timestamp from the message to preserve chronological order
        timestamp: message.timestamp.toISOString(),
      };

      // Only include id if it is a valid UUID; otherwise let DB generate it
      const isUuid = (value: string | undefined): boolean => {
        if (!value) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
      };
      if (isUuid(message.id)) {
        messageData.id = message.id;
      }
      
      // Only add type if the column exists in the database
      // If it doesn't exist, we'll skip it (database might not have this column)
      messageData.type = message.type;
      
      log.info('[Supabase] Message data prepared:', {
        id: messageData.id,
        conversation_id: messageData.conversation_id,
        type: messageData.type,
        timestamp: messageData.timestamp,
        textLength: messageData.text.length
      });
      
      // Insert without select to avoid RLS "no rows returned" issues
      const { error } = await supabase.from('messages').insert(messageData);
      
      if (error) {
        console.error('[Supabase] Error saving message:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: message
        });
        
        // If type column doesn't exist, try without it
        if (error.message?.includes('column "type"') || error.code === '42703') {
          log.warn('[Supabase] Retrying without type column...');
          delete messageData.type;
          const { error: retryError } = await supabase.from('messages').insert(messageData);
          
          if (retryError) {
            console.error('[Supabase] Retry failed:', retryError);
            throw retryError;
          }
          
          log.info('[Supabase] Message saved successfully (without type)', {
            id: message.id
          });
          if (config.features.cache) {
            // Invalidate cached messages for this conversation and "all"
            globalCache.invalidate('messages:');
          }
          return true;
        }
        
        // Invalid UUID errors: retry without id to allow DB default
        if (error.code === '22P02' || /invalid input syntax for type uuid/i.test(error.message || '')) {
          if (messageData.id) {
            log.warn('[Supabase] Invalid UUID for id. Retrying without id to use DB default.');
            delete messageData.id;
            const { error: retryError } = await supabase.from('messages').insert(messageData);
            if (retryError) {
              console.error('[Supabase] Retry failed after removing id:', retryError);
              throw retryError;
            }
            log.info('[Supabase] Message saved successfully (DB-generated id)', {
              originalId: message.id
            });
            if (config.features.cache) {
              globalCache.invalidate('messages:');
            }
            return true;
          }
        }

        throw error;
      }
      
      log.info('[Supabase] Message saved successfully:', {
        id: message.id,
        savedData: data
      });
      if (config.features.cache) {
        globalCache.invalidate('messages:');
      }
      return true;
    } catch (error: any) {
      console.error('[Supabase] Failed to save message:', {
        error: error?.message || error,
        code: error?.code,
        details: error?.details,
        message: {
          id: message.id,
          type: message.type,
          text: message.text.substring(0, 50)
        }
      });
      
      // Show user-friendly error if it's a common issue
      if (error?.code === '42P01') {
        console.error('[Supabase] Table "messages" does not exist. Please run SUPABASE_SETUP.sql in your Supabase SQL Editor.');
      } else if (error?.code === '23505') {
        console.warn('[Supabase] Message with this ID already exists (duplicate):', message.id);
        // This is okay - message already exists
        return true;
      } else if (error?.code === 'PGRST116') {
        console.error('[Supabase] No rows returned. Check database permissions and table structure.');
      } else if (error?.code === '42703') {
        console.error('[Supabase] Column does not exist. Please run SUPABASE_SETUP.sql to update your table schema.');
      }
      
      return false;
    }
  };

  const clearMessages = async (): Promise<boolean> => {
    if (!supabase) {
      console.warn('Supabase not configured');
      return false;
    }
    try {
      const { error } = await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing messages:', error);
      return false;
    }
  };

  return {
    isConnected,
    saveMessage,
    loadMessages,
    clearMessages,
    getOrCreateConversation,
    currentConversationId,
  };
};

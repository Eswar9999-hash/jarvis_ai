import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Message } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const useSupabase = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(!!supabase);
  }, []);

  const saveMessage = async (message: Message) => {
    if (!supabase) return;
    try {
      await supabase.from('messages').insert({
        text: message.text,
        type: message.type,
        timestamp: message.timestamp.toISOString(),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const loadMessages = async (): Promise<Message[]> => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('timestamp', { ascending: true })
        .limit(100);

      if (error) throw error;

      return data.map(msg => ({
        id: msg.id,
        text: msg.text,
        type: msg.type,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  };

  const clearMessages = async () => {
    if (!supabase) return;
    try {
      await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  };

  return {
    isConnected,
    saveMessage,
    loadMessages,
    clearMessages,
  };
};

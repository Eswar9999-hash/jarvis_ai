-- Fixed SQL for Supabase messages table
-- Run this in your Supabase SQL Editor

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('user', 'jarvis')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint if conversation_id exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE messages 
    ADD CONSTRAINT messages_conversation_id_fkey 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid errors)
DROP POLICY IF EXISTS "Allow all operations" ON messages;
DROP POLICY IF EXISTS "Allow all operations" ON conversations;

-- Create policy for messages (without IF NOT EXISTS - that's not supported)
CREATE POLICY "Allow all operations" ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policy for conversations
CREATE POLICY "Allow all operations" ON conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);


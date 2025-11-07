import { useState, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Message, Theme, Settings } from './types';
import { VoiceControls } from './components/VoiceControls';
import { ControlPanel } from './components/ControlPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ChatDisplay } from './components/ChatDisplay';
import { useVoice } from './hooks/useVoice';
import { useSupabase } from './hooks/useSupabase';
import { useGemini } from './hooks/useGemini';
import { getTheme } from './utils/themes';
import { config } from './utils/config';
import { emitEvent } from './utils/plugins';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'JARVIS systems online. All systems operational. How may I assist you today, sir?',
      type: 'jarvis',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    theme: 'arc-reactor',
    voiceSettings: {
      type: 'male',
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8,
    },
    aiSettings: {
      model: 'gemini-2.5-flash',
      maxTokens: 1000,
      temperature: 0.7,
      maxHistory: 10,
      timeout: 30000
    },
    voiceMode: 'push-to-talk',
    autoScroll: true,
  });

  const theme = getTheme(settings.theme);
  const voice = useVoice(settings.voiceSettings);
  const supabase = useSupabase();
  const ai = useGemini(settings.aiSettings);

  useEffect(() => {
    const loadInitialMessages = async () => {
      const savedMessages = await supabase.loadMessages();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      }
    };
    loadInitialMessages();
  }, []);

  // Handle voice input
  useEffect(() => {
    if (voice.transcript && !voice.isListening) {
      setInput(voice.transcript);
      
      const timer = setTimeout(() => {
        if (voice.transcript.trim()) {
          const transcript = voice.getTranscript();
          if (transcript.trim()) {
            handleSend(transcript);
          }
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [voice.transcript, voice.isListening]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const messageText = textToSend || input.trim();
    if (!messageText || ai.isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      type: 'user',
      timestamp: new Date()
    };

    // FIX: append the user message and use the updated history below
    // Using the pre-update `messages` here can cause stale history to be sent to AI.
    setMessages(prev => [...prev, userMessage]);
    if (config.features.plugins) {
      emitEvent('message:sent', { message: userMessage });
    }
    await supabase.saveMessage(userMessage);
    setInput('');

    try {
      // FIX: ensure AI receives the latest conversation including the new user message
      // Build a local conversation history to avoid using the stale `messages` closure
      const conversationHistory = [...messages, userMessage];
      const aiResponse = await ai.generateResponse(conversationHistory, userMessage.text);
      
      const jarvisMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        type: 'jarvis',
        timestamp: new Date()
      };

      // Append JARVIS response to messages (functional update prevents race conditions)
      setMessages(prev => [...prev, jarvisMessage]);
      await supabase.saveMessage(jarvisMessage);
      if (config.features.plugins) {
        emitEvent('response:received', { message: jarvisMessage });
      }

      if (!speakerMuted) {
        voice.speak(jarvisMessage.text);
      }

    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: `I apologize, Sir, but I encountered a technical difficulty: ${error.message}. Please try again.`,
        type: 'jarvis',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      await supabase.saveMessage(errorMessage);
      if (config.features.plugins) {
        emitEvent('response:error', { error, message: errorMessage });
      }
    }
  }, [input, messages, ai, supabase, voice, speakerMuted]);

  const handleEmergencyStop = useCallback(() => {
    ai.cancelGeneration();
    voice.stopSpeaking();
    voice.stopListening();
    
    const emergencyMsg: Message = {
      id: Date.now().toString(),
      text: 'Emergency stop activated. All processes terminated.',
      type: 'jarvis',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, emergencyMsg]);
    supabase.saveMessage(emergencyMsg);
    if (config.features.plugins) {
      emitEvent('system:emergency_stop');
    }
  }, [ai, voice, supabase]);

  const handleRetry = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
    if (lastUserMessage && !ai.isProcessing) {
      setInput(lastUserMessage.text);
    }
  }, [messages, ai.isProcessing]);

  const handleClear = async () => {
    const initialMsg: Message = {
      id: '1',
      text: 'JARVIS systems online. All systems operational. How may I assist you today, sir?',
      type: 'jarvis',
      timestamp: new Date()
    };
    setMessages([initialMsg]);
    await supabase.clearMessages();
  };

  const handleToggleMode = () => {
    setSettings(prev => ({
      ...prev,
      voiceMode: prev.voiceMode === 'push-to-talk' ? 'always-listening' : 'push-to-talk'
    }));
  };

  const handlePreviewVoice = () => {
    voice.speak('JARVIS voice systems operational. How may I assist you?');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.background} text-white flex items-center justify-center p-2 md:p-4 relative overflow-hidden`}>
      <div className="scanline" style={{ color: theme.accent }} />

      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="data-stream"
          style={{
            left: `${20 + i * 20}%`,
            color: theme.accent,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}

      <div className="w-full max-w-[1800px] h-[95vh] flex flex-col md:flex-row gap-4 relative z-10">
        {/* LEFT SIDEBAR - Voice Controls */}
        <div className="hidden md:flex flex-col gap-4 w-72">
          <VoiceControls
            isListening={voice.isListening}
            isSpeaking={voice.isSpeaking}
            audioLevel={voice.audioLevel}
            voiceMode={settings.voiceMode}
            onStartListening={voice.startListening}
            onStopListening={voice.stopListening}
            onToggleSpeaker={() => {
              setSpeakerMuted(!speakerMuted);
              if (!speakerMuted) {
                voice.stopSpeaking();
              }
            }}
            onToggleMode={handleToggleMode}
            speakerMuted={speakerMuted}
            accentColor={theme.accent}
          />
          <ControlPanel
            onEmergencyStop={handleEmergencyStop}
            onRetry={handleRetry}
            onClear={handleClear}
            onOpenSettings={() => setSettingsOpen(true)}
            accentColor={theme.accent}
          />
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border overflow-hidden shadow-2xl" style={{ borderColor: `${theme.accent}40`, boxShadow: `0 0 40px ${theme.accent}20` }}>
          
          {/* HEADER */}
          <div className="relative p-6 border-b" style={{ borderColor: `${theme.accent}20` }}>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full arc-reactor-glow flex items-center justify-center"
                style={{ color: theme.accent }}
              >
                <div className="w-12 h-12 rounded-full border-4 relative" style={{ borderColor: theme.accent }}>
                  <div className="absolute inset-2 rounded-full border-2" style={{ borderColor: theme.accent }} />
                  <div className="absolute inset-4 rounded-full" style={{ background: theme.accent }} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-widest" style={{ color: theme.accent }}>
                  J.A.R.V.I.S
                </h1>
                <p className="text-xs opacity-60 tracking-widest">Just A Rather Very Intelligent System</p>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Enter command or query..."
                className="w-full bg-black/40 border-2 rounded-2xl px-6 py-4 pr-14 text-white placeholder-white/30 focus:outline-none transition-all duration-300 text-base md:text-lg"
                style={{
                  borderColor: `${theme.accent}40`,
                  boxShadow: `0 0 20px ${theme.accent}10`,
                }}
                disabled={ai.isProcessing}
              />
              <button
                onClick={() => handleSend()}
                disabled={ai.isProcessing || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  boxShadow: `0 0 20px ${theme.glow}`,
                }}
              >
                <Send className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Voice Transcript Display */}
            {voice.transcript && (
              <div className="mt-3 text-sm bg-black/20 rounded-lg p-3 border" style={{ borderColor: `${theme.accent}30` }}>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">🎤</span>
                  <span className="text-white/70">Voice Input:</span>
                </div>
                <div className="mt-1 text-white" style={{ color: theme.accent }}>
                  "{voice.transcript}"
                </div>
              </div>
            )}

            {/* AI Processing Status */}
            {ai.isProcessing && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm" style={{ color: theme.accent }}>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                <span>JARVIS is analyzing your request...</span>
              </div>
            )}

            {/* Error Display */}
            {ai.error && (
              <div className="mt-3 text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                System Error: {ai.error}
              </div>
            )}
          </div>

          {/* Chat Display */}
          <ChatDisplay
            messages={messages}
            isProcessing={ai.isProcessing}
            accentColor={theme.accent}
            autoScroll={settings.autoScroll}
          />

          {/* Mobile Controls */}
          <div className="md:hidden flex gap-2 p-4 border-t" style={{ borderColor: `${theme.accent}20` }}>
            <button
              onClick={handleEmergencyStop}
              className="flex-1 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
            >
              STOP
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 py-3 rounded-xl text-sm font-medium border"
              style={{ borderColor: `${theme.accent}40`, background: `${theme.accent}10` }}
            >
              Retry
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex-1 py-3 rounded-xl text-sm font-medium border"
              style={{ borderColor: `${theme.accent}40`, background: `${theme.accent}10` }}
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentTheme={settings.theme}
        voiceSettings={settings.voiceSettings}
        onThemeChange={(theme: Theme) => setSettings(prev => ({ ...prev, theme }))}
        onVoiceSettingsChange={(voiceSettings) => setSettings(prev => ({ ...prev, voiceSettings }))}
        onPreviewVoice={handlePreviewVoice}
        accentColor={theme.accent}
      />

      <div className="fixed bottom-4 right-4 text-xs opacity-40 hidden md:block">
        <p>STARK INDUSTRIES © 2025</p>
        <p className="text-right">v{import.meta.env.MODE === 'production' ? '3.14.85' : 'DEV'}</p>
      </div>
    </div>
  );
}

export default App;

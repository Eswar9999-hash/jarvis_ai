import { useEffect, useRef } from 'react';
import { Message } from '../types';

interface ChatDisplayProps {
  messages: Message[];
  isProcessing: boolean;
  accentColor: string;
  autoScroll: boolean;
}

export const ChatDisplay = ({
  messages,
  isProcessing,
  accentColor,
  autoScroll,
}: ChatDisplayProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
              <path d="M25,0 L50,14.4 L50,28.9 L25,43.4 L0,28.9 L0,14.4 Z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      <div className="relative z-10">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`message-slide-in flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 relative ${
                message.type === 'user'
                  ? 'ml-auto message-glow-user'
                  : 'message-glow-jarvis'
              }`}
              style={{
                background: message.type === 'user'
                  ? `linear-gradient(135deg, ${accentColor}dd, ${accentColor})`
                  : 'rgba(0, 0, 0, 0.4)',
                border: message.type === 'jarvis' ? `1px solid ${accentColor}40` : 'none',
                boxShadow: message.type === 'jarvis' ? `0 0 20px ${accentColor}20` : 'none',
              }}
            >
              {message.type === 'jarvis' && (
                <div
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-16 rounded-r-full animate-pulse"
                  style={{ background: accentColor }}
                />
              )}

              <p className="text-sm md:text-base leading-relaxed message-text-typing">
                {message.text}
              </p>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                <p className="text-xs opacity-60">
                  {message.timestamp.toLocaleTimeString()}
                </p>
                {message.type === 'jarvis' && (
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{
                          background: accentColor,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start mb-4">
            <div
              className="rounded-2xl p-4 border"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderColor: `${accentColor}40`,
                boxShadow: `0 0 20px ${accentColor}20`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full animate-bounce"
                      style={{
                        background: accentColor,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm opacity-70">JARVIS is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

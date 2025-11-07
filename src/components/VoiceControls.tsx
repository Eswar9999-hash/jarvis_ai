import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { VoiceMode } from '../types';

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  voiceMode: VoiceMode;
  onStartListening: () => void;
  onStopListening: () => void;
  onToggleSpeaker: () => void;
  onToggleMode: () => void;
  speakerMuted: boolean;
  accentColor: string;
  error?: string | null;
  isPermissionGranted?: boolean | null;
}

export const VoiceControls = ({
  isListening,
  audioLevel,
  voiceMode,
  onStartListening,
  onStopListening,
  onToggleSpeaker,
  onToggleMode,
  speakerMuted,
  accentColor,
  error,
  isPermissionGranted,
}: VoiceControlsProps) => {
  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border" style={{ borderColor: `${accentColor}40` }}>
      <h3 className="text-lg font-semibold mb-4 text-white/80 uppercase tracking-wide">Voice Controls</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Push to Talk / Always Listening Button */}
        <button
          onClick={isListening ? onStopListening : onStartListening}
          className={`aspect-square rounded-xl flex flex-col items-center justify-center p-4 transition-all duration-300 ${
            isListening ? 'bg-red-500/20 border-red-500/50' : 'bg-gray-700/30 border-gray-600/50'
          } border hover:scale-105`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-red-400 mb-2" />
          ) : (
            <Mic className="w-8 h-8 text-gray-400 mb-2" />
          )}
          <span className="text-xs text-center">
            {voiceMode === 'push-to-talk' ? 'Push to Talk' : 'Always Listening'}
          </span>
        </button>

        {/* Speaker Control */}
        <button
          onClick={onToggleSpeaker}
          className={`aspect-square rounded-xl flex flex-col items-center justify-center p-4 transition-all duration-300 ${
            !speakerMuted ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'
          } border hover:scale-105`}
        >
          {speakerMuted ? (
            <VolumeX className="w-8 h-8 text-red-400 mb-2" />
          ) : (
            <Volume2 className="w-8 h-8 text-green-400 mb-2" />
          )}
          <span className="text-xs text-center">
            {speakerMuted ? 'Speaker Off' : 'Speaker On'}
          </span>
        </button>
      </div>

      {/* Mode Toggle Button */}
      <button
        onClick={onToggleMode}
        className="w-full py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-105"
        style={{
          borderColor: `${accentColor}40`,
          background: `${accentColor}10`,
          color: accentColor,
        }}
      >
        Switch to {voiceMode === 'push-to-talk' ? 'Always Listening' : 'Push to Talk'}
      </button>

      {/* Audio Level Display */}
      {isListening && (
        <div className="mt-4">
          <div className="text-xs text-white/60 mb-2">Audio Level</div>
          <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
            <div
              className="h-full transition-all duration-100 rounded-full"
              style={{
                width: `${Math.min(audioLevel * 100, 100)}%`,
                background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
          <p className="text-xs text-red-400">{error}</p>
          {isPermissionGranted === false && (
            <p className="text-xs text-red-300 mt-1">
              Click the microphone button to request permission again.
            </p>
          )}
        </div>
      )}

      {/* Permission Status */}
      {isPermissionGranted === true && !error && (
        <div className="mt-4 p-2 rounded-lg bg-green-500/20 border border-green-500/50">
          <p className="text-xs text-green-400">✓ Microphone permission granted</p>
        </div>
      )}
    </div>
  );
};

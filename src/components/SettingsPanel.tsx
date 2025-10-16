import { X, Play } from 'lucide-react';
import { Theme, VoiceSettings } from '../types';
import { themes } from '../utils/themes';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Theme;
  voiceSettings: VoiceSettings;
  onThemeChange: (theme: Theme) => void;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  onPreviewVoice: () => void;
  accentColor: string;
}

export const SettingsPanel = ({
  isOpen,
  onClose,
  currentTheme,
  voiceSettings,
  onThemeChange,
  onVoiceSettingsChange,
  onPreviewVoice,
  accentColor,
}: SettingsPanelProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-white/10 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold tracking-wider" style={{ color: accentColor }}>
            SYSTEM SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="text-lg font-semibold mb-4 tracking-wide">Theme Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(themes) as Theme[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => onThemeChange(theme)}
                  className="p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105"
                  style={{
                    borderColor: currentTheme === theme ? accentColor : 'rgba(255, 255, 255, 0.1)',
                    background: currentTheme === theme
                      ? `linear-gradient(135deg, ${themes[theme].primary}20, ${themes[theme].secondary}20)`
                      : 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${themes[theme].primary}, ${themes[theme].secondary})`,
                      }}
                    />
                    <div className="text-left">
                      <div className="font-semibold">{themes[theme].name}</div>
                      {currentTheme === theme && (
                        <div className="text-xs opacity-70">Active</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 tracking-wide">Voice Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">Voice Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => onVoiceSettingsChange({ ...voiceSettings, type: 'male' })}
                    className="flex-1 py-3 px-4 rounded-lg border-2 transition-all duration-300 font-medium"
                    style={{
                      borderColor: voiceSettings.type === 'male' ? accentColor : 'rgba(255, 255, 255, 0.1)',
                      background: voiceSettings.type === 'male' ? `${accentColor}20` : 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => onVoiceSettingsChange({ ...voiceSettings, type: 'female' })}
                    className="flex-1 py-3 px-4 rounded-lg border-2 transition-all duration-300 font-medium"
                    style={{
                      borderColor: voiceSettings.type === 'female' ? accentColor : 'rgba(255, 255, 255, 0.1)',
                      background: voiceSettings.type === 'female' ? `${accentColor}20` : 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    Female
                  </button>
                  <button
                    onClick={onPreviewVoice}
                    className="py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                    }}
                  >
                    <Play className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">
                  Speed: {voiceSettings.speed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.speed}
                  onChange={(e) =>
                    onVoiceSettingsChange({ ...voiceSettings, speed: parseFloat(e.target.value) })
                  }
                  className="w-full accent-slider"
                  style={{ accentColor }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">
                  Pitch: {voiceSettings.pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.pitch}
                  onChange={(e) =>
                    onVoiceSettingsChange({ ...voiceSettings, pitch: parseFloat(e.target.value) })
                  }
                  className="w-full"
                  style={{ accentColor }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">
                  Volume: {Math.round(voiceSettings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.volume}
                  onChange={(e) =>
                    onVoiceSettingsChange({ ...voiceSettings, volume: parseFloat(e.target.value) })
                  }
                  className="w-full"
                  style={{ accentColor }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

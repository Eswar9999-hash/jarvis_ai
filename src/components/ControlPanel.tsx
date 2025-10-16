import { AlertTriangle, RotateCcw, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ControlPanelProps {
  onEmergencyStop: () => void;
  onRetry: () => void;
  onClear: () => void;
  onOpenSettings: () => void;
  accentColor: string;
}

export const ControlPanel = ({
  onEmergencyStop,
  onRetry,
  onClear,
  onOpenSettings,
  accentColor,
}: ControlPanelProps) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEmergencyClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onEmergencyStop();
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <div className="relative">
      <div className="flex flex-col gap-4 p-6 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10">
        <h3 className="text-sm font-semibold tracking-widest opacity-70">CONTROL PANEL</h3>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleEmergencyClick}
            className="relative w-full h-16 rounded-xl flex items-center justify-center gap-3 font-bold text-sm tracking-wide transition-all duration-300 group overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <AlertTriangle className="w-5 h-5" />
            EMERGENCY STOP
          </button>

          <button
            onClick={onRetry}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 border hover:scale-105"
            style={{
              borderColor: `${accentColor}40`,
              background: `${accentColor}10`,
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Retry Last
          </button>

          <button
            onClick={onClear}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 border hover:scale-105"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
            }}
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 border hover:scale-105"
            style={{
              borderColor: `${accentColor}40`,
              background: `${accentColor}10`,
            }}
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-red-500/50 max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h4 className="font-bold text-red-500">Confirm Emergency Stop</h4>
            </div>
            <p className="text-sm opacity-70 mb-6">
              This will immediately stop all AI processes and voice output. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-500 transition-colors text-sm font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

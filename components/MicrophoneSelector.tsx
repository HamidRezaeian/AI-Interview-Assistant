import React from 'react';

interface MicrophoneSelectorProps {
  microphones: MediaDeviceInfo[];
  selectedMicId: string;
  setSelectedMicId: (id: string) => void;
  disabled: boolean;
  className?: string;
}

const MicrophoneSelector: React.FC<MicrophoneSelectorProps> = ({ microphones, selectedMicId, setSelectedMicId, disabled, className = '' }) => {
  return (
    <div className={`w-full sm:w-auto flex-grow ${className}`}>
      <label htmlFor="mic-select" className="sr-only">Select Microphone</label>
      <select
        id="mic-select"
        value={selectedMicId}
        onChange={(e) => setSelectedMicId(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {microphones.length > 0 ? (
          microphones.map(mic => (
            <option key={mic.deviceId} value={mic.deviceId}>
              {mic.label || `Microphone ${microphones.indexOf(mic) + 1}`}
            </option>
          ))
        ) : (
          <option value="">No microphones found</option>
        )}
      </select>
    </div>
  );
};

export default MicrophoneSelector;
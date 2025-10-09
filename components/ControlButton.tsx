import React from 'react';
import { MicrophoneIcon, StopIcon } from './Icons';

interface ControlButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({ isListening, onClick, disabled = false }) => {
  const baseClasses = "flex items-center justify-center gap-3 px-8 py-4 font-semibold rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 transition-all duration-300 transform hover:scale-105 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100";
  const listeningClasses = "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 animate-pulse-red";
  const stoppedClasses = "bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-400";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${isListening ? listeningClasses : stoppedClasses}`}
      style={{ minWidth: '220px' }}
    >
      {isListening ? (
        <>
          <StopIcon className="w-6 h-6" />
          <span>Stop Recording</span>
        </>
      ) : (
        <>
          <MicrophoneIcon className="w-6 h-6" />
          <span>Start Recording</span>
        </>
      )}
    </button>
  );
};

export default ControlButton;

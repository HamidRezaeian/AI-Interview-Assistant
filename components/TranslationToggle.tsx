import React from 'react';

interface TranslationToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled: boolean;
}

const TranslationToggle: React.FC<TranslationToggleProps> = ({ enabled, onChange, disabled }) => {
  const baseClasses = "relative inline-flex items-center h-8 rounded-lg w-full cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const containerClasses = `bg-slate-200 p-1`;
  
  return (
    <div className={`flex flex-col items-center justify-center h-full ${disabled ? 'opacity-50' : ''}`}>
       <label htmlFor="translation-toggle" className="text-xs text-slate-500 mb-1">Translations</label>
        <button
            id="translation-toggle"
            onClick={() => onChange(!enabled)}
            disabled={disabled}
            className={`${baseClasses} ${containerClasses}`}
            role="switch"
            aria-checked={enabled}
            aria-label="Enable or disable translations"
        >
            <span className={`w-1/2 h-full rounded-md transition-all duration-300 ease-in-out transform ${enabled ? 'bg-cyan-500' : 'bg-slate-100'}`}></span>
            <span className="absolute inset-0 flex items-center justify-around w-full">
                <span className={`text-xs font-bold ${enabled ? 'text-white' : 'text-slate-500'}`}>On</span>
                <span className={`text-xs font-bold ${!enabled ? 'text-slate-800' : 'text-slate-500'}`}>Off</span>
            </span>
        </button>
    </div>
  );
};

export default TranslationToggle;
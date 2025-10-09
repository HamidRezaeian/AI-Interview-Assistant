import React from 'react';

interface LanguageSelectorProps {
  language: 'en-US' | 'fa-IR';
  setLanguage: (lang: 'en-US' | 'fa-IR') => void;
  disabled: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, setLanguage, disabled }) => {
  const baseClasses = "w-1/2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const activeClasses = "bg-cyan-500 text-white shadow";
  const inactiveClasses = "bg-slate-100 text-slate-600 hover:bg-slate-300";

  return (
    <div className="flex items-center p-1 bg-slate-200 rounded-lg w-full sm:w-auto">
      <button
        onClick={() => setLanguage('en-US')}
        disabled={disabled}
        className={`${baseClasses} ${language === 'en-US' ? activeClasses : inactiveClasses}`}
        aria-pressed={language === 'en-US'}
      >
        English
      </button>
      <button
        onClick={() => setLanguage('fa-IR')}
        disabled={disabled}
        className={`${baseClasses} ${language === 'fa-IR' ? activeClasses : inactiveClasses}`}
        aria-pressed={language === 'fa-IR'}
      >
        فارسی
      </button>
    </div>
  );
};

export default LanguageSelector;
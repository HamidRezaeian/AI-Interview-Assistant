
import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { ClipboardIcon, SpeakerWaveIcon, SparklesIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from './Icons';

interface AiResponseDisplayProps {
  aiResponse: { english: string; persian: string } | null;
  isLoading: boolean;
  error: string | null;
  loadingMessage: string | null;
}

const AiResponseDisplay: React.FC<AiResponseDisplayProps> = ({ aiResponse, isLoading, error, loadingMessage }) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(20); // Base font size is 20px (text-xl)

  const handleCopy = () => {
    if (aiResponse?.english) {
      navigator.clipboard.writeText(aiResponse.english);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReadAloud = () => {
    if (aiResponse?.english && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(aiResponse.english);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };
  
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32)); // Max 32px
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 14)); // Min 14px

  const renderContent = () => {
    if (error) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg text-center">
            <p className="font-semibold">An Error Occurred</p>
            <p className="text-sm mt-1">{error}</p>
        </div>
      );
    }

    // If there is a response, display it, even if we are still loading (streaming)
    if (aiResponse?.english) {
      return (
        <div className="space-y-6 text-left">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-base font-semibold text-cyan-600">Suggested Answer (English)</h4>
                    <div className="flex items-center gap-1">
                        <button onClick={decreaseFontSize} aria-label="Decrease font size" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                            <MagnifyingGlassMinusIcon className="w-5 h-5" />
                        </button>
                         <button onClick={increaseFontSize} aria-label="Increase font size" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                            <MagnifyingGlassPlusIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleReadAloud} aria-label="Read answer aloud" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                            <SpeakerWaveIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleCopy} aria-label="Copy answer to clipboard" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                            <ClipboardIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {copied && <p className="text-xs text-green-500 absolute right-6 top-14 animate-fade-in">Copied!</p>}
                <p 
                  className="whitespace-pre-wrap leading-relaxed"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {aiResponse.english}
                </p>
            </div>
            {aiResponse.persian && (
                <div className="border-t border-slate-300 pt-4 animate-fade-in">
                    <h4 className="text-base font-semibold text-cyan-600 mb-2">ترجمه فارسی (Persian)</h4>
                    <p 
                    className="whitespace-pre-wrap text-base leading-relaxed text-slate-600" 
                    style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'sans-serif' }}
                    >
                    {aiResponse.persian}
                    </p>
                </div>
            )}
        </div>
      );
    }
    
    // If no response yet, but we are loading, show the spinner
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <LoadingSpinner />
          <p className="mt-4 text-slate-500 animate-fade-in">{loadingMessage || 'Processing...'}</p>
        </div>
      );
    }
    
    // Default initial state
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-600">
          <SparklesIcon className="w-12 h-12 mb-4 text-cyan-400/50" />
          <h4 className="font-semibold text-lg text-slate-600">Your AI Assistant is Ready</h4>
          <p className="mt-1 max-w-md leading-relaxed">Record the interviewer's question to get your tailored answer here.</p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Your Suggested Answer</h3>
      <div className="relative w-full flex-grow min-h-[24rem] bg-slate-100 rounded-lg p-6 text-slate-800 overflow-y-auto border border-slate-300 custom-scrollbar flex flex-col justify-center">
        <div className="prose max-w-none">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AiResponseDisplay;

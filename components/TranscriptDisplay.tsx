import React from 'react';
import { PaperAirplaneIcon } from './Icons';

interface TranscriptDisplayProps {
  transcript: string;
  interimTranscript: string;
  translatedTranscript: string;
  interviewerLanguage: 'en-US' | 'fa-IR';
  onTranscriptChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ 
  transcript, 
  interimTranscript, 
  translatedTranscript, 
  interviewerLanguage,
  onTranscriptChange,
  onSubmit,
  disabled
}) => {
  const hasContent = transcript || interimTranscript;
  const showSubmitButton = !disabled && transcript.trim().length > 0;

  return (
    <div className="h-full flex flex-col">
      <h3 className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Interviewer's Question
        {disabled && (
            <span className="ml-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
        )}
      </h3>
      <div className="relative w-full flex-grow">
        <textarea
          value={transcript + interimTranscript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          disabled={disabled}
          dir={interviewerLanguage === 'fa-IR' ? 'rtl' : 'ltr'}
          placeholder="Press 'Start Recording' or type the interviewer's question here..."
          className="w-full h-full min-h-[8rem] bg-slate-100 rounded-lg p-4 text-lg text-slate-800 overflow-y-auto border border-slate-300 transition-all resize-y focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-70 leading-relaxed placeholder:text-slate-400"
          aria-label="Interviewer's Question Input"
        />
        <span className="text-slate-400 absolute top-4 right-4" style={{ pointerEvents: 'none' }}>
            {interimTranscript}
        </span>
         {showSubmitButton && (
          <button
            onClick={onSubmit}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-cyan-400 transition-all transform hover:scale-110"
            aria-label="Get Suggested Answer"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        )}
        {translatedTranscript && (
          <div className="mt-4 pt-4 border-t border-slate-300">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {interviewerLanguage === 'en-US' ? 'Persian Translation' : 'English Translation'}
              </h4>
              <p className="text-slate-600 italic leading-relaxed" dir={interviewerLanguage === 'en-US' ? 'rtl' : 'ltr'}>
                  {translatedTranscript}
              </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptDisplay;
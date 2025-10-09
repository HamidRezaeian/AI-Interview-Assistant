import React from 'react';
import { DocumentArrowDownIcon } from './Icons';

interface ChatHistoryProps {
  history: {
    id: number;
    transcript: string;
    translatedTranscript: string;
    interviewerLanguage: 'en-US' | 'fa-IR';
    aiResponse: {
      english: string;
      persian: string;
    };
  }[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-slate-600">No History Yet</h2>
            <p className="text-slate-600 mt-2">Your conversations from the "Live Interview" tab will appear here.</p>
        </div>
    );
  }

  const handleExport = () => {
    if (history.length === 0) return;

    const jsonString = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interview_history.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center items-center relative mb-8">
        <h2 className="text-2xl font-bold text-slate-600 text-center">
          Conversation History
        </h2>
        {history.length > 0 && (
          <button
            onClick={handleExport}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-cyan-500"
            aria-label="Export chat history as JSON"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>Export</span>
          </button>
        )}
      </div>
      <div className="space-y-8 max-h-[70vh] overflow-y-auto p-2 pr-4 -mr-4 custom-scrollbar">
        {[...history].reverse().map((entry) => (
          <div key={entry.id} className="bg-slate-100 p-5 rounded-lg ring-1 ring-slate-200 animate-fade-in">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Interviewer's Question ({entry.interviewerLanguage === 'en-US' ? 'English' : 'Persian'})
              </h3>
              <p className="text-slate-800 text-lg leading-relaxed" dir={entry.interviewerLanguage === 'fa-IR' ? 'rtl' : 'ltr'}>{entry.transcript}</p>
              {entry.translatedTranscript && (
                  <div className="mt-2 pt-2 border-t border-slate-200/50 text-sm">
                      <p className="text-slate-500 italic leading-relaxed" dir={entry.interviewerLanguage === 'en-US' ? 'rtl' : 'ltr'}>
                        {entry.translatedTranscript}
                      </p>
                  </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Your Suggested Answer
              </h3>
              <div className="text-slate-800 whitespace-pre-wrap bg-white p-4 rounded-md text-lg leading-relaxed">
                <p className="font-semibold text-cyan-600 text-xs mb-1">English</p>
                {entry.aiResponse.english}
              </div>
              {entry.aiResponse.persian && (
                <div className="text-slate-800 whitespace-pre-wrap bg-white p-4 rounded-md mt-2 text-lg leading-relaxed">
                  <p className="font-semibold text-cyan-600 text-xs mb-1">Persian</p>
                  <p dir="rtl" className="text-right">{entry.aiResponse.persian}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

import MicrophoneSelector from './components/MicrophoneSelector';
import ControlButton from './components/ControlButton';
import TranscriptDisplay from './components/TranscriptDisplay';
import AiResponseDisplay from './components/AiResponseDisplay';
import PreInterviewForm from './components/PreInterviewForm';
import ChatHistory from './components/ChatHistory';
import LanguageSelector from './components/LanguageSelector';
import TranslationToggle from './components/TranslationToggle';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
}

interface ChatHistoryEntry {
  id: number;
  transcript: string;
  translatedTranscript: string;
  interviewerLanguage: 'en-US' | 'fa-IR';
  aiResponse: {
    english: string;
    persian: string;
  };
}

const App: React.FC = () => {
  // UI State
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [translationsEnabled, setTranslationsEnabled] = useState(true);

  // Data State
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<{english: string, persian: string} | null>(null);
  const [optimisticOpening, setOptimisticOpening] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);
  
  // Mic & Language State
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [interviewerLanguage, setInterviewerLanguage] = useState<'en-US' | 'fa-IR'>('en-US');

  // AI & State Refs
  const systemInstructionRef = useRef<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamAbortController = useRef<AbortController | null>(null);

  useEffect(() => {
    const getMicrophones = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        setMicrophones(audioInputDevices);
        if (audioInputDevices.length > 0) {
          setSelectedMicId(audioInputDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setAiError("Could not access microphone. Please allow microphone access in your browser settings.");
      }
    };
    getMicrophones();
  }, []);

  const translateSimple = async (text: string, targetLanguage: 'English' | 'Persian'): Promise<string> => {
    if (!process.env.API_KEY || !text) return '';
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Translate to ${targetLanguage}. Respond with only the translation.\n\nText: "${text}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Translation error to ${targetLanguage}:`, error);
        return `[Translation Failed]`;
    }
  };

  const streamOpeningPhrase = async (currentTranscript: string) => {
    if (!systemInstructionRef.current || !currentTranscript) return;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const openerPrompt = `Based on the following incomplete interview question, generate a very short, natural-sounding opening phrase (5-7 words) for an answer. RESPOND IN ENGLISH ONLY. ONLY return the phrase itself.\n\nQuestion so far: "${currentTranscript}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: openerPrompt,
            config: {
                systemInstruction: systemInstructionRef.current,
                thinkingConfig: { thinkingBudget: 0 } // Optimize for speed
            },
        });
        setOptimisticOpening(response.text.trim() + ' ');
    } catch (error) {
      console.error("Error generating opening phrase:", error);
    }
  };
  
  const generateFinalAnswer = async () => {
    const finalTranscript = (transcript + ' ' + interimTranscript).trim();
    if (!finalTranscript) return;
    
    // Abort any previous long-running stream
    streamAbortController.current?.abort();
    const controller = new AbortController();
    streamAbortController.current = controller;

    setIsAiLoading(true);
    setIsFinalizing(true);
    setAiError(null);
    
    // Optimistic UI update: show the pre-generated opener immediately
    setAiResponse({ english: optimisticOpening, persian: '' });

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const finalAnswerPrompt = `The interviewer's question is: "${finalTranscript}".
An initial, short opening phrase has already been generated: "${optimisticOpening}"
Your task is to SEAMLESSLY complete the answer, starting immediately after the opening phrase.
RESPOND IN ENGLISH ONLY.
DO NOT repeat the opening phrase. Your output should be the rest of the answer.`;

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: finalAnswerPrompt,
            config: {
                systemInstruction: systemInstructionRef.current,
            },
        });
        
        let restOfResponse = '';
        for await (const chunk of responseStream) {
             if (controller.signal.aborted) return;
             
            const chunkText = chunk.text;
            if (chunkText) {
                restOfResponse += chunkText;
                // Append the stream to the optimistic opening
                setAiResponse({ english: optimisticOpening + restOfResponse, persian: '' });
            }
        }
        
        const finalEnglishAnswer = optimisticOpening + restOfResponse;
        
        // Finalize translations and save to history
        let finalPersianAnswer = '';
        let finalQuestionTranslation = '';

        if (translationsEnabled) {
            const targetLang = interviewerLanguage === 'en-US' ? 'Persian' : 'English';
            const [pAnswer, qTranslation] = await Promise.all([
                translateSimple(finalEnglishAnswer, 'Persian'),
                translateSimple(finalTranscript, targetLang)
            ]);
            finalPersianAnswer = pAnswer;
            finalQuestionTranslation = qTranslation;
        }

        setAiResponse({ english: finalEnglishAnswer, persian: finalPersianAnswer });
        setTranslatedTranscript(finalQuestionTranslation);

        setChatHistory(prev => [...prev, {
            id: Date.now(),
            transcript: finalTranscript,
            translatedTranscript: finalQuestionTranslation,
            interviewerLanguage,
            aiResponse: { english: finalEnglishAnswer, persian: finalPersianAnswer }
        }]);

    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Error streaming final answer:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setAiError(`Sorry, something went wrong. ${errorMessage}`);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsAiLoading(false);
        setIsFinalizing(false);
      }
    }
  };

  useEffect(() => {
    const fullTranscript = (transcript + ' ' + interimTranscript).trim();
    if (!interviewStarted || !fullTranscript || isFinalizing) {
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      streamOpeningPhrase(fullTranscript);
    }, 300); // Generate opener quickly as user pauses

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [transcript, interimTranscript, interviewStarted, isFinalizing]);


  useEffect(() => {
    if (!recognition) {
        setAiError("Speech recognition not supported in this browser.");
        return;
    }
    
    const onResult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final += event.results[i][0].transcript;
            } else {
                interim += event.results[i][0].transcript;
            }
        }
        setInterimTranscript(interim);
        if (final) {
            setTranscript(prev => (prev + final + ' ').trimStart());
        }
    };

    const onEnd = () => {
      if (isListening) recognition.start();
    };
    
    recognition.addEventListener('result', onResult);
    recognition.addEventListener('end', onEnd);
    
    return () => {
        recognition?.removeEventListener('result', onResult);
        recognition?.removeEventListener('end', onEnd);
        recognition?.stop();
    };
  }, [isListening]);

  const handleStartInterview = (resume: string, jobInfo: string) => {
    if (!process.env.API_KEY) {
        setAiError("API_KEY environment variable not set.");
        return;
    }
    const systemInstruction = `You are an expert career coach. The user is in a job interview and needs your help crafting the perfect, human-sounding answer to the interviewer's questions.

**Your Primary Goal:** Craft a response that the user can say out loud in English. The answer must be concise, authentic, and sound completely natural—as if it came from a real person, not a formulaic AI.

**CRITICAL RULES FOR YOUR RESPONSE:**

1.  **BE BRIEF AND TO THE POINT:**
    *   **Short & Sweet:** Keep answers extremely concise. Aim for 3-5 impactful sentences. Only provide more detail if the question absolutely requires it. Get straight to the point.
    *   **No Fluff:** Cut all filler words and sentences that don't add value. Every word should count.

2.  **SOUND HUMAN, NOT ROBOTIC:**
    *   **Use Contractions:** Always use "I'm," "I've," "that's," etc. Avoid formal language like "I am."
    *   **Vary Your Style:** **This is crucial.** Do not use the same opening phrases (like "That's a great question" or "In my previous role...") for every answer. Your responses must be varied and not follow a predictable pattern. Avoid repetitive sentence structures.
    *   **Avoid AI Jargon:** Do not use buzzwords, corporate clichés (e.g., "synergy," "leverage"), or overly formal vocabulary.

3.  **BE AUTHENTIC & PERSONAL:**
    *   **Synthesize, Don't List:** Weave the user's resume details into a natural narrative. Don't just list skills. Connect their experience directly to the job.
    *   **Show, Don't Tell:** Instead of saying "I'm a good leader," give a micro-example: "On the last project, I helped the team by..."

4.  **OUTPUT FORMATTING:**
    *   **Deliver the Answer ONLY:** Your entire output is the text the user will speak.
    *   **No Commentary:** Do NOT add advice, explanations, or phrases like "Here's a good answer:". Just provide the answer itself.

**User's Resume:**
---
${resume}
---

**Company & Job Information:**
---
${jobInfo}
---
`;
    systemInstructionRef.current = systemInstruction;
    setInterviewStarted(true);
  };
  
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      recognition?.stop();
      generateFinalAnswer();
    } else {
      if(!recognition) return;
      setTranscript('');
      setInterimTranscript('');
      setAiResponse(null);
      setTranslatedTranscript('');
      setAiError(null);
      setOptimisticOpening('');
      recognition.lang = interviewerLanguage;
      recognition.start();
      setIsListening(true);
    }
  };

  const handleTranscriptChange = (newText: string) => {
    setTranscript(newText);
    setInterimTranscript(''); // Clear interim when user types manually
  };

  const handleSubmitText = () => {
    if (transcript.trim() && !isListening) {
        generateFinalAnswer();
    }
  };

  const TabButton = ({ isActive, onClick, children }: { isActive: boolean, onClick: () => void, children: React.ReactNode }) => {
    const baseClasses = "px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors w-1/2";
    const activeClasses = "bg-slate-700 text-white shadow";
    const inactiveClasses = "text-slate-500 hover:bg-slate-200 hover:text-slate-700";
    return <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>{children}</button>;
  };

  const mainContent = !interviewStarted ? (
    <PreInterviewForm onSubmit={handleStartInterview} isLoading={isAiLoading} />
  ) : (
    <div className="space-y-6">
      <header className="flex justify-between items-center pb-4 border-b border-slate-200">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center tracking-tight bg-gradient-to-r from-cyan-500 to-teal-500 text-transparent bg-clip-text mx-auto">
          Interview Answer Assistant
        </h1>
      </header>
      
      <div className="flex justify-center p-1 bg-slate-200 rounded-lg max-w-sm mx-auto">
        <TabButton isActive={activeTab === 'live'} onClick={() => setActiveTab('live')}>Live Interview</TabButton>
        <TabButton isActive={activeTab === 'history'} onClick={() => setActiveTab('history')}>History</TabButton>
      </div>

      {activeTab === 'live' && (
        <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 md:gap-8 min-h-[60vh]">
                <div className="md:col-span-2">
                  <TranscriptDisplay 
                      transcript={transcript} 
                      interimTranscript={interimTranscript}
                      translatedTranscript={translatedTranscript}
                      interviewerLanguage={interviewerLanguage}
                      onTranscriptChange={handleTranscriptChange}
                      onSubmit={handleSubmitText}
                      disabled={isListening}
                  />
                </div>
                <div className="md:col-span-3">
                  <AiResponseDisplay 
                    aiResponse={aiResponse} 
                    isLoading={isAiLoading} 
                    error={aiError} 
                    loadingMessage={isFinalizing ? "Generating full answer..." : "Processing..."} 
                  />
                </div>
            </div>

            <div className="mt-6 p-4 bg-slate-100 rounded-xl shadow-inner border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-center justify-center gap-4">
                    <LanguageSelector 
                      language={interviewerLanguage}
                      setLanguage={setInterviewerLanguage}
                      disabled={isListening || isFinalizing}
                    />
                    <TranslationToggle
                      enabled={translationsEnabled}
                      onChange={setTranslationsEnabled}
                      disabled={isListening || isFinalizing}
                    />
                    <MicrophoneSelector 
                        microphones={microphones} 
                        selectedMicId={selectedMicId} 
                        setSelectedMicId={setSelectedMicId} 
                        disabled={isListening || isFinalizing}
                        className="sm:col-span-2 lg:col-span-1"
                    />
                    <div className="sm:col-span-2 lg:col-span-1 flex justify-center items-center">
                        <ControlButton isListening={isListening} onClick={toggleListening} disabled={isFinalizing}/>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="animate-fade-in">
          <ChatHistory history={chatHistory} />
        </div>
      )}

    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans">
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        {mainContent}
      </main>
    </div>
  );
};

export default App;

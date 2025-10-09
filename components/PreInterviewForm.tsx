import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { DocumentArrowUpIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

// Configure the worker source for pdfjs-dist from the CDN specified in the import map
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

interface PreInterviewFormProps {
  onSubmit: (resume: string, jobInfo: string) => void;
  isLoading: boolean;
}

const PreInterviewForm: React.FC<PreInterviewFormProps> = ({ onSubmit, isLoading }) => {
  const [resumeText, setResumeText] = useState('');
  const [jobInfo, setJobInfo] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError(null);
    setFileName(file.name);
    setResumeText(''); // Clear previous resume text

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;
      let fullText = '';
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
        fullText += pageText + '\n';
      }
      
      setResumeText(fullText.trim());
    } catch (error) {
      console.error("Failed to parse PDF:", error);
      setParseError("Could not read the PDF file. Please try another file.");
      setFileName(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeText.trim() && jobInfo.trim() && !isParsing) {
      onSubmit(resumeText, jobInfo);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-2xl border border-slate-200">
      <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center bg-gradient-to-r from-cyan-500 to-teal-500 text-transparent bg-clip-text">
        Interview Answer Assistant
      </h2>
      <p className="text-slate-600 mb-8 text-center leading-relaxed">
        Get started by providing your resume and the job details below.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="resume-upload" className="block text-sm font-medium text-slate-600 mb-2">
            Your Resume
          </label>
          <input
            type="file"
            id="resume-upload"
            accept=".pdf"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            disabled={isParsing}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            <DocumentArrowUpIcon className="w-6 h-6" />
            <span>Upload PDF</span>
          </button>
          <div className="mt-2 text-sm text-slate-500 h-5">
            {isParsing && (
              <div className="flex items-center gap-2">
                <LoadingSpinner /> <span>Parsing PDF...</span>
              </div>
            )}
            {parseError && <p className="text-red-500">{parseError}</p>}
            {fileName && !isParsing && !parseError && <p>File: {fileName}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="job-info" className="block text-sm font-medium text-slate-600 mb-2">
            Company & Job Information
          </label>
          <textarea
            id="job-info"
            value={jobInfo}
            onChange={(e) => setJobInfo(e.target.value)}
            className="w-full h-40 px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-base leading-relaxed placeholder:text-slate-400"
            placeholder="Paste the job description, company website, or any relevant details..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || isParsing || !resumeText || !jobInfo}
          className="w-full flex justify-center items-center px-6 py-3 font-semibold rounded-lg shadow-md bg-cyan-500 hover:bg-cyan-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-cyan-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Initializing...' : 'Start Session'}
        </button>
      </form>
    </div>
  );
};

export default PreInterviewForm;
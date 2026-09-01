import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Sparkles, X, Loader2, AlertCircle, Settings, HelpCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface DocumentInputProps {
  onAnalyze: (text: string, title: string) => void;
  isAnalyzing: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  engine: 'local' | 'gemini';
  setEngine: (engine: 'local' | 'gemini') => void;
}

const SAMPLE_DOCS = [
  {
    title: 'README - Technical Library',
    text: `# Antigravity SDK

This is a library designed to help developers build frontend applications. By integrating our SDK, you can quickly configure database endpoints.

To setup the application, run these commands:

$ npm install antigravity-sdk
$ npm run configure

## Usage
Simply import the library in your code:
import { Antigravity } from 'antigravity-sdk';

The SDK will load the credentials. The front-end layout is fully customisable.

## Configuration
The environment details can be stored in the config file.`,
  },
  {
    title: 'User Manual - SmartHome Hub',
    text: `SmartHome Hub User Manual
Version 2.4.0

Congratulations on purchasing the SmartHome Hub. This device is used to connect all smart plugs and cameras in your house.

Usage Instructions:
Step 1: Plug the device into the wall.
Step 2: Open the application on your smartphone.
Step 3: Press the pairing button on the side of the hub.

If the pairing light does not turn green, it is obviously a connectivity issue. You should simply reset the device by holding the power button.

This manual explains how everything is operated. The settings are automatically synced to the cloud.`,
  },
  {
    title: 'Product Requirements (PRD)',
    text: `# Product Requirements Document: SmartSearch Feature

## Introduction
We are building a smart search feature inside the app. This feature enables users to query their database in natural language.

## Goals
1. Increase search conversion rates.
2. Provide sub-second query latency.

## Scope
Includes backend parsing, keyword mapping, and results rendering. Does not include multi-language voice search in Phase 1.`,
  },
];

export function DocumentInput({
  onAnalyze,
  isAnalyzing,
  apiKey,
  setApiKey,
  engine,
  setEngine,
}: DocumentInputProps) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileDetails, setFileDetails] = useState<{ size: number; type: string } | null>(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setFileName(file.name);
    setFileDetails({ size: file.size, type: file.type });
    setIsExtracting(true);

    // 1. Validate File Size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. The maximum supported size is 10MB.');
      setFileName('');
      setFileDetails(null);
      setIsExtracting(false);
      return;
    }

    // 2. Validate Empty File
    if (file.size === 0) {
      setError('The uploaded file is empty. Please upload a valid document.');
      setFileName('');
      setFileDetails(null);
      setIsExtracting(false);
      return;
    }

    // 3. Extract Text & Handle Corruption/Errors
    try {
      const { extractTextFromFile } = await import('@/lib/fileExtractor');
      const extracted = await extractTextFromFile(file);
      if (!extracted.text || extracted.text.trim().length === 0) {
        throw new Error('Extracted text is empty or could not be decoded.');
      }
      setText(extracted.text);
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Corrupted or unreadable document file.');
      setFileName('');
      setFileDetails(null);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = () => {
    if (text.trim().length < 10) {
      setError('Please enter or upload at least 10 characters of text to analyze.');
      return;
    }
    if (engine === 'gemini' && !apiKey.trim()) {
      setError('Please enter your Gemini API Key in the settings below to use the AI engine, or switch to the Local Rules Engine.');
      setShowSettings(true);
      return;
    }
    setError('');
    onAnalyze(text, title || 'Untitled Document');
  };

  const handleTextKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !isAnalyzing && !isExtracting) {
      event.preventDefault();
      handleAnalyze();
    }
  };

  const loadSample = (sample: { title: string; text: string }) => {
    setText(sample.text);
    setTitle(sample.title);
    setError('');
    setFileName('');
    setFileDetails(null);
  };

  const clearAll = () => {
    setText('');
    setTitle('');
    setFileName('');
    setFileDetails(null);
    setError('');
  };

  const removeFile = () => {
    setFileName('');
    setFileDetails(null);
    setText('');
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8 animate-fade-in flex flex-col items-center">
        <div className="p-3 rounded-2xl bg-surface border border-border shadow-sm mb-3">
          <img src="/logo.png" alt="DocuLint QA Logo" className="w-12 h-12 object-contain" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-text-primary mb-2">
          Documentation Auditor
        </h1>
        <p className="text-text-secondary max-w-lg mx-auto text-sm leading-relaxed">
          Upload technical manuals, API guides, READMEs, or PRDs to assess structure, completeness, readability, and technical accuracy.
        </p>
      </div>

      {/* Upload Zone (The ENTIRE box is a keyboard-accessible click target) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!isExtracting && !isAnalyzing) {
            fileInputRef.current?.click();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isExtracting && !isAnalyzing) {
              fileInputRef.current?.click();
            }
          }
        }}
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 mb-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-[#0D0D0D] ${
          isDragging
            ? 'border-primary bg-primary-soft scale-[1.005]'
            : 'border-border bg-surface-secondary hover:border-border-strong hover:bg-surface-hover'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.md,.pdf,.docx"
          onChange={handleFileSelect}
        />
        <div className="w-full px-6 py-12 flex flex-col items-center gap-3 text-center">
          {isExtracting ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-text-secondary font-semibold">Extracting document text...</span>
            </>
          ) : fileName ? (
            <div className="flex flex-col items-center gap-3 w-full max-w-md">
              <div className="w-12 h-12 rounded-xl bg-surface border border-border text-text-secondary flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-center w-full">
                <p className="text-sm font-semibold text-text-primary truncate">{fileName}</p>
                <div className="flex items-center justify-center gap-2 text-xs text-text-muted mt-1">
                  <span>{formatSize(fileDetails?.size || 0)}</span>
                  <span>•</span>
                  <span className="uppercase">{fileDetails?.type?.split('/')[1] || fileName.split('.').pop() || 'unknown'}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Avoid triggering file select click again
                  removeFile();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover text-text-secondary border border-border text-xs font-semibold transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Remove File
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-text-muted" />
              <div>
                <span className="text-sm font-bold text-text-primary">
                  Drop your document here
                </span>
                <span className="text-sm text-text-secondary"> or click anywhere to browse</span>
                <p className="text-xs text-text-muted mt-2 font-medium">
                  PDF • DOCX • TXT • MD (up to 10MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title Input */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Document Title</label>
        <input
          type="text"
          placeholder="e.g. API Integration Guide"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isAnalyzing}
          className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text-primary placeholder-text-muted/60 text-sm focus-ring transition-all"
        />
      </div>

      {/* Text Area */}
      <div className="relative mb-5">
        <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Document Content</label>
        <textarea
          placeholder="Paste or type document text here, or upload a file above..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleTextKeyDown}
          disabled={isAnalyzing}
          rows={8}
          className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-text-primary placeholder-text-muted/60 text-sm leading-relaxed resize-y focus-ring transition-all scrollbar-hidden"
        />
        <p className="mt-1.5 text-[11px] text-text-muted">Tip: press Ctrl + Enter (or ⌘ + Enter) to run an audit.</p>
        {text && (
          <span className="absolute bottom-3 right-3 text-xs text-text-secondary font-mono bg-surface border border-border px-2 py-1 rounded" aria-live="polite">
            {wordCount.toLocaleString()} words · {text.length.toLocaleString()} chars · ~{readingMinutes} min read
          </span>
        )}
      </div>

      {/* Settings Panel */}
      <div className="rounded-xl bg-surface-secondary border border-border mb-5 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-text-secondary hover:bg-surface-hover transition-all"
        >
          <span className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-text-muted" />
            Audit Settings & AI Engine
          </span>
          <span className="text-xs text-text-muted hover:underline">
            {showSettings ? 'Hide Settings' : 'Configure Settings'}
          </span>
        </button>

        {showSettings && (
          <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Radio Toggles */}
              <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                engine === 'local' 
                  ? 'border-primary bg-primary-soft text-text-primary' 
                  : 'border-border bg-surface hover:bg-surface-hover'
              }`}>
                <input
                  type="radio"
                  name="engine"
                  checked={engine === 'local'}
                  onChange={() => setEngine('local')}
                  className="mt-1 accent-primary"
                />
                <div>
                  <span className="text-xs font-bold block">Local Rules Engine</span>
                  <span className="text-[11px] text-text-muted block mt-0.5">Runs offline in your browser. Audit sections, readability, and consistency checks.</span>
                </div>
              </label>

              <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                engine === 'gemini' 
                  ? 'border-primary bg-primary-soft text-text-primary' 
                  : 'border-border bg-surface hover:bg-surface-hover'
              }`}>
                <input
                  type="radio"
                  name="engine"
                  checked={engine === 'gemini'}
                  onChange={() => setEngine('gemini')}
                  className="mt-1 accent-primary"
                />
                <div>
                  <span className="text-xs font-bold block flex items-center gap-1.5">
                    Gemini AI Engine
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-primary text-white leading-none">AI</span>
                  </span>
                  <span className="text-[11px] text-text-muted block mt-0.5">Use Google Gemini API for deep contextual feedback and English-only translations.</span>
                </div>
              </label>
            </div>

            {engine === 'gemini' && (
              <div className="bg-surface p-3.5 rounded-lg border border-border animate-slide-up">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-text-secondary block uppercase tracking-wider">Gemini API Key</label>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline hover:text-primary-hover flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Get API Key
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded bg-surface border border-border text-text-primary placeholder-text-muted/60 text-xs focus-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-text-muted">
                  <ShieldCheck className="w-3.5 h-3.5 text-success animate-pulse-custom" />
                  <span>Key is stored only locally in your browser's localStorage and sent directly to Google APIs.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm mb-4 animate-slide-up">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || isExtracting || text.trim().length < 10}
          className="flex-1 px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Auditing Documentation...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run Documentation Audit
            </>
          )}
        </button>
        {(text || title) && (
          <button
            onClick={clearAll}
            disabled={isAnalyzing}
            className="px-4 py-3 rounded-lg bg-surface border border-border text-text-secondary hover:bg-surface-hover disabled:opacity-40 transition-all text-sm font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sample texts */}
      <div className="border-t border-border pt-6">
        <p className="text-xs text-text-muted mb-3 text-center uppercase tracking-wider font-bold">Or try a sample documentation draft:</p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          {SAMPLE_DOCS.map((sample) => (
            <button
              key={sample.title}
              onClick={() => loadSample(sample)}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-hover text-text-secondary border border-border hover:border-border-strong disabled:opacity-40 transition-all text-xs font-bold text-left sm:text-center flex-1"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

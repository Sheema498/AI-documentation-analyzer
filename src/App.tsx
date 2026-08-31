import { useState, useCallback, useEffect } from 'react';
import { FileSearch, Clock, Trash2, Sun, Moon, AlertCircle, Check, Loader2, Info, ArrowLeft } from 'lucide-react';
import type { AnalysisResult, SavedDocument } from '@/types';
import { analyzeText } from '@/lib/analysis';
import { loadHistory, saveDocument, deleteDocument, clearHistory, generateId } from '@/lib/storage';
import { analyzeDocumentWithGemini } from '@/lib/analysis/docAnalyzer';
import { DocumentInput } from '@/components/DocumentInput';
import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import { HistoryPanel } from '@/components/HistoryPanel';
import { AboutView } from '@/components/AboutView';

type View = 'input' | 'results' | 'history' | 'about';
type LoadingPhase = 'reading' | 'structure' | 'quality' | 'completeness' | 'recommendations' | 'report' | 'gemini_api' | null;

function App() {
  const [view, setView] = useState<View>('input');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentDoc, setCurrentDoc] = useState<SavedDocument | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [history, setHistory] = useState<SavedDocument[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Settings states from localStorage
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini-api-key') || '');
  const [engine, setEngine] = useState<'local' | 'gemini'>(
    () => (localStorage.getItem('audit-engine') as 'local' | 'gemini') || 'local'
  );
  const [theme, setTheme] = useState(() => localStorage.getItem('doc-analyzer-theme') || 'dark');

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Save Settings to localStorage
  const handleSetApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini-api-key', key);
  }, []);

  const handleSetEngine = useCallback((eng: 'local' | 'gemini') => {
    setEngine(eng);
    localStorage.setItem('audit-engine', eng);
  }, []);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('doc-analyzer-theme', theme);
  }, [theme]);

  // Main analyze logic
  const handleAnalyze = useCallback(async (text: string, title: string) => {
    setIsAnalyzing(true);
    setIsSaved(false);
    setErrorMsg(null);
    
    try {
      // Stage 1: Reading document
      setLoadingPhase('reading');
      await new Promise(r => setTimeout(r, 450));
      
      // Stage 2: Extracting structure
      setLoadingPhase('structure');
      await new Promise(r => setTimeout(r, 450));
      
      let result: AnalysisResult;
      
      if (engine === 'gemini') {
        setLoadingPhase('gemini_api');
        // Remote Gemini query
        const docAnalysis = await analyzeDocumentWithGemini(text, title, apiKey);
        
        // Populate standard local analytics for charts/metrics compatibility
        const baseResult = analyzeText(text, title);
        result = {
          ...baseResult,
          docAnalysis,
        };
      } else {
        // Stage 3: Checking content quality
        setLoadingPhase('quality');
        await new Promise(r => setTimeout(r, 400));
        
        // Stage 4: Evaluating completeness
        setLoadingPhase('completeness');
        await new Promise(r => setTimeout(r, 400));
        
        // Run local quality audits
        result = analyzeText(text, title);
      }
      
      // Stage 5: Generating recommendations
      setLoadingPhase('recommendations');
      await new Promise(r => setTimeout(r, 350));
      
      // Stage 6: Preparing report
      setLoadingPhase('report');
      await new Promise(r => setTimeout(r, 300));
      
      setAnalysis(result);
      const newDoc: SavedDocument = {
        id: generateId(),
        title,
        content: text,
        createdAt: new Date().toISOString(),
        analysis: result,
      };
      setCurrentDoc(newDoc);
      
      // AUTOMATICALLY save audit results into persistent history log
      const updatedHistory = saveDocument(newDoc);
      setHistory(updatedHistory);
      setIsSaved(true);
      
      setView('results');
    } catch (err) {
      console.error('Audit failure:', err);
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred during documentation auditing.');
    } finally {
      setIsAnalyzing(false);
      setLoadingPhase(null);
    }
  }, [engine, apiKey]);

  const handleSave = useCallback(() => {
    if (!currentDoc) return;
    const updated = saveDocument(currentDoc);
    setHistory(updated);
    setIsSaved(true);
  }, [currentDoc]);

  // Load saved document and select it
  const handleSelectHistory = useCallback((doc: SavedDocument) => {
    setCurrentDoc(doc);
    setAnalysis(doc.analysis);
    setView('results');
    setIsSaved(true);
    setErrorMsg(null);
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    const updated = deleteDocument(id);
    setHistory(updated);
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const handleBack = useCallback(() => {
    setView('input');
    setAnalysis(null);
    setCurrentDoc(null);
    setIsSaved(false);
    setErrorMsg(null);
  }, []);

  const getPhaseStatus = (phase: string) => {
    const phases = engine === 'gemini' 
      ? ['reading', 'structure', 'gemini_api', 'recommendations', 'report']
      : ['reading', 'structure', 'quality', 'completeness', 'recommendations', 'report'];
      
    const currentIdx = phases.indexOf(loadingPhase || '');
    const phaseIdx = phases.indexOf(phase);
    
    if (currentIdx === -1) return 'pending';
    if (phaseIdx < currentIdx) return 'completed';
    if (phaseIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-extrabold shadow-sm">
              <FileSearch className="w-4.5 h-4.5" />
            </div>
            <div className="text-left leading-none">
              <h1 className="text-xs font-black text-text-primary uppercase tracking-wider">
                DocuLint
              </h1>
              <p className="text-[8px] font-extrabold text-text-muted uppercase tracking-widest mt-0.5">
                QA Auditor
              </p>
            </div>
          </button>

          {/* Navigation Controls */}
          <div className="flex items-center gap-5">
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setView('input')}
                aria-current={view === 'input' || view === 'results' ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  view === 'input' || view === 'results'
                    ? 'text-primary font-black bg-primary-soft'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Analyzer
              </button>

              <button
                onClick={() => setView('history')}
                aria-current={view === 'history' ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all relative ${
                  view === 'history'
                    ? 'text-primary font-black bg-primary-soft'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                History
                {history.length > 0 && (
                  <span aria-label={`${history.length} saved audits`} className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-primary text-white dark:text-slate-900 text-[8px] font-black leading-none">
                    {history.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setView('about')}
                aria-current={view === 'about' ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  view === 'about'
                    ? 'text-primary font-black bg-primary-soft'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Help & About
              </button>
            </nav>

            {/* Saved indicator state */}
            {isSaved && (
              <span className="flex items-center gap-1 text-xs font-bold text-success animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}

            {/* Theme switcher */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all focus:outline-none"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-text-secondary" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Error State Banner */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm mb-6 animate-slide-up max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Documentation Audit Failed</span>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">{errorMsg}</p>
              <button 
                onClick={() => setErrorMsg(null)}
                className="mt-2 text-xs font-bold hover:underline block text-text-secondary"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {view === 'about' ? (
          <AboutView onBack={handleBack} />
        ) : view === 'history' ? (
          <HistoryPanel
            documents={history}
            onSelect={handleSelectHistory}
            onDelete={handleDeleteHistory}
            onClear={handleClearHistory}
            onClose={() => setView('input')}
          />
        ) : view === 'input' ? (
          <DocumentInput
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            apiKey={apiKey}
            setApiKey={handleSetApiKey}
            engine={engine}
            setEngine={handleSetEngine}
          />
        ) : (
          analysis && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  New Analysis
                </button>
                {currentDoc && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <span className="text-border">|</span>
                    <span className="font-semibold text-text-secondary truncate max-w-xs">{currentDoc.title}</span>
                  </div>
                )}
              </div>
              <AnalysisDashboard result={analysis} />
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-5 text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>DocuLint &bull; Runs locally or securely via Google Gemini API in your browser</span>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 text-danger hover:underline transition-colors font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear audit history
            </button>
          )}
        </div>
      </footer>

      {/* Audit Checklist Loading Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111F]/70 dark:bg-[#07111F]/80 backdrop-blur-[1px]">
          <div className="p-6 rounded-2xl bg-surface border border-border max-w-sm w-full mx-4 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <h3 className="text-sm font-bold text-text-primary">Auditing Documentation</h3>
            </div>
            <p className="text-[11px] text-text-muted leading-normal">Evaluating document structure, syntax, and completeness metrics.</p>
            
            <div className="space-y-2 pt-2 border-t border-border">
              <LoadingPhaseItem label="Reading document..." status={getPhaseStatus('reading')} />
              <LoadingPhaseItem label="Extracting document structure..." status={getPhaseStatus('structure')} />
              
              {engine === 'gemini' ? (
                <LoadingPhaseItem label="Analyzing content via Gemini AI..." status={getPhaseStatus('gemini_api')} />
              ) : (
                <>
                  <LoadingPhaseItem label="Analyzing content..." status={getPhaseStatus('quality')} />
                  <LoadingPhaseItem label="Evaluating documentation quality..." status={getPhaseStatus('completeness')} />
                </>
              )}
              
              <LoadingPhaseItem label="Generating recommendations..." status={getPhaseStatus('recommendations')} />
              <LoadingPhaseItem label="Preparing results..." status={getPhaseStatus('report')} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingPhaseItem({ label, status }: { label: string; status: 'completed' | 'active' | 'pending' }) {
  return (
    <div className="flex items-center gap-2.5">
      {status === 'completed' && <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />}
      {status === 'active' && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />}
      {status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-border bg-surface-secondary flex-shrink-0" />}
      <span className={`text-xs ${status === 'active' ? 'text-text-primary font-bold' : status === 'completed' ? 'text-text-secondary' : 'text-text-muted'}`}>
        {label}
      </span>
    </div>
  );
}

export default App;

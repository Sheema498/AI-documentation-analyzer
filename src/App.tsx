import { useState, useCallback, useEffect } from 'react';
import { FileSearch, History, Save, ArrowLeft, Trash2, Download } from 'lucide-react';
import type { AnalysisResult, SavedDocument } from '@/types';
import { analyzeText } from '@/lib/analysis';
import { loadHistory, saveDocument, deleteDocument, clearHistory, generateId } from '@/lib/storage';
import { DocumentInput } from '@/components/DocumentInput';
import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import { HistoryPanel } from '@/components/HistoryPanel';

type View = 'input' | 'results';

function App() {
  const [view, setView] = useState<View>('input');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentDoc, setCurrentDoc] = useState<SavedDocument | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<SavedDocument[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleAnalyze = useCallback(async (text: string, title: string) => {
    setIsAnalyzing(true);
    setIsSaved(false);
    await new Promise((r) => setTimeout(r, 300));
    const result = analyzeText(text);
    setAnalysis(result);
    setCurrentDoc({
      id: generateId(),
      title,
      content: text,
      createdAt: new Date().toISOString(),
      analysis: result,
    });
    setView('results');
    setIsAnalyzing(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!currentDoc) return;
    const updated = saveDocument(currentDoc);
    setHistory(updated);
    setIsSaved(true);
  }, [currentDoc]);

  const handleSelectHistory = useCallback((doc: SavedDocument) => {
    setCurrentDoc(doc);
    setAnalysis(doc.analysis);
    setView('results');
    setShowHistory(false);
    setIsSaved(true);
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
  }, []);

  const handleExport = useCallback(() => {
    if (!analysis || !currentDoc) return;
    const exportData = {
      title: currentDoc.title,
      analyzedAt: analysis.analyzedAt,
      stats: analysis.stats,
      readability: analysis.readability,
      sentiment: analysis.sentiment,
      language: analysis.language,
      keywords: analysis.keywords,
      keyPhrases: analysis.keyPhrases,
      summary: analysis.summary,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.title.replace(/[^a-z0-9]/gi, '_')}_analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysis, currentDoc]);

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileSearch className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-bold text-slate-100 leading-tight">
                AI Document Analyzer
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight">
                Text Intelligence Platform
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {view === 'results' && analysis && (
              <>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
                    isSaved
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Save</span>
                    </>
                  )}
                </button>
              </>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-xs font-medium relative"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {view === 'input' ? (
          <DocumentInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        ) : (
          analysis && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-xs font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  New Analysis
                </button>
                {currentDoc && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="text-slate-600">|</span>
                    <span className="font-medium text-slate-300">{currentDoc.title}</span>
                  </div>
                )}
              </div>
              <AnalysisDashboard result={analysis} />
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-slate-600">
          <span>AI Document Analyzer - All analysis runs locally in your browser</span>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear all history
            </button>
          )}
        </div>
      </footer>

      {/* History Drawer */}
      {showHistory && (
        <HistoryPanel
          documents={history}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

export default App;

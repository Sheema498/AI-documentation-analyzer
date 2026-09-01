import type { SavedDocument } from '@/types';
import { Clock, ChevronRight, AlertCircle, ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react';

interface HistoryPanelProps {
  documents: SavedDocument[];
  onSelect: (doc: SavedDocument) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function HistoryPanel({ documents, onSelect, onDelete, onClear, onClose }: HistoryPanelProps) {
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire documentation audit history? This action cannot be undone.')) {
      onClear();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="DocuLint Logo" className="w-5 h-5 object-contain" />
          <h2 className="text-lg font-bold text-text-primary">Audit History</h2>
        </div>
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 text-xs font-semibold transition-all"
            >
              Clear All History
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Analyzer
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6 rounded-xl bg-surface border border-border shadow-sm">
          <img src="/logo.png" alt="DocuLint" className="w-12 h-12 object-contain opacity-70 mb-3" />
          <h3 className="text-sm font-bold text-text-primary">No analyses yet</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-xs leading-relaxed">
            Upload a document to create your first analysis report.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-sm"
          >
            Upload a Document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const docAnalysis = doc.analysis.docAnalysis;
            const score = docAnalysis?.score?.overall ?? 0;
            const type = docAnalysis?.overview?.type ?? 'Document';
            const summary = docAnalysis?.overview?.summary ?? 'No summary available.';
            const issuesCount = docAnalysis?.issues?.length ?? 0;

            return (
              <div
                key={doc.id}
                onClick={() => onSelect(doc)}
                className="group p-4 rounded-xl bg-surface border border-border hover:border-border-strong hover:bg-surface-hover cursor-pointer transition-all flex items-start gap-4 shadow-sm"
              >
                {/* Score badge */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-primary/30 bg-primary-soft text-primary flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold">{score}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider leading-none text-primary/90">Score</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-text-primary truncate pr-4">
                      {doc.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-surface-secondary border border-border text-text-secondary">
                      {type}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(doc.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {summary}
                  </p>
                  
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {issuesCount > 0 ? (
                      <div className="flex items-center gap-1 text-[11px] text-warning font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                        <span>{issuesCount} quality issues found</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-success font-medium">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-success" />
                        <span>0 issues - documentation perfect</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 self-center flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(doc);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    View
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${doc.title}" audit run?`)) {
                        onDelete(doc.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 transition-all"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

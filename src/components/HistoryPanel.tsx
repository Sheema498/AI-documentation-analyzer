import type { SavedDocument } from '@/types';
import { FileText, Trash2, Clock, ChevronRight } from 'lucide-react';

interface HistoryPanelProps {
  documents: SavedDocument[];
  onSelect: (doc: SavedDocument) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function HistoryPanel({ documents, onSelect, onDelete, onClose }: HistoryPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-md h-full glass-strong overflow-y-auto animate-slide-in-left"
        onClick={(e) => e.stopPropagation()}
        style={{ animationName: 'fadeIn' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-700/50 glass-strong">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Analysis History
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            Close
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <FileText className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">No saved analyses yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              Analyze a document and save it to see it here.
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group rounded-lg bg-slate-800/40 border border-slate-700/40 hover:border-blue-500/40 transition-all duration-200 cursor-pointer animate-slide-up"
                onClick={() => onSelect(doc)}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-slate-200 truncate">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {doc.analysis.stats.words} words · {doc.analysis.stats.sentences} sentences
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {new Date(doc.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(doc.id);
                        }}
                        className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                      {doc.analysis.readability.readabilityLabel}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                      background: doc.analysis.sentiment.label === 'positive' ? 'rgba(16,185,129,0.15)' : doc.analysis.sentiment.label === 'negative' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      color: doc.analysis.sentiment.label === 'positive' ? '#10b981' : doc.analysis.sentiment.label === 'negative' ? '#ef4444' : '#f59e0b',
                    }}>
                      {doc.analysis.sentiment.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                      {doc.analysis.language.language}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import type { SentimentResult } from '@/types';
import { Smile, Meh, Frown } from 'lucide-react';

interface SentimentIndicatorProps {
  sentiment: SentimentResult;
}

export function SentimentIndicator({ sentiment }: SentimentIndicatorProps) {
  const { label, score, confidence, positiveCount, negativeCount } = sentiment;

  const config = {
    positive: {
      icon: <Smile className="w-8 h-8" />,
      color: '#10b981',
      bg: 'from-emerald-500/20 to-emerald-600/5',
      text: 'Positive',
    },
    neutral: {
      icon: <Meh className="w-8 h-8" />,
      color: '#f59e0b',
      bg: 'from-amber-500/20 to-amber-600/5',
      text: 'Neutral',
    },
    negative: {
      icon: <Frown className="w-8 h-8" />,
      color: '#ef4444',
      bg: 'from-red-500/20 to-red-600/5',
      text: 'Negative',
    },
  };

  const c = config[label];

  const posPct = positiveCount + negativeCount > 0
    ? (positiveCount / (positiveCount + negativeCount)) * 100
    : 50;
  const negPct = 100 - posPct;

  return (
    <div className={`rounded-xl p-5 bg-gradient-to-br ${c.bg} border border-slate-700/50`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: `${c.color}20`, color: c.color }}
          >
            {c.icon}
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: c.color }}>{c.text}</div>
            <div className="text-xs text-slate-400">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: c.color }}>
            {score > 0 ? '+' : ''}{score.toFixed(3)}
          </div>
          <div className="text-xs text-slate-400">Sentiment Score</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-medium">{positiveCount} positive</span>
          <span className="text-red-400 font-medium">{negativeCount} negative</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${posPct}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700 ease-out"
            style={{ width: `${negPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

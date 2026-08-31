import type { AnalysisResult } from '@/types';
import { StatCard, InfoCard } from './StatCard';
import { SentimentIndicator } from './SentimentIndicator';
import { BarChart, HorizontalBar, DonutChart, Gauge, WordCloud } from './Charts';
import {
  FileText, Type, Hash, AlignLeft, BookOpen, Clock,
  Mic, Gauge as GaugeIcon, TrendingUp, Languages, Sparkles, BarChart3,
  CheckCircle2, Info,
} from 'lucide-react';

interface AnalysisDashboardProps {
  result: AnalysisResult;
}

export function AnalysisDashboard({ result }: AnalysisDashboardProps) {
  const { stats, readability, keywords, keyPhrases, sentiment, summary, language, sentenceAnalysis, wordLengthDistribution, sentenceLengthDistribution, topWords } = result;

  const uniqueRatio = stats.words > 0 ? (stats.uniqueWords / stats.words) * 100 : 0;

  const sentimentSegments = [
    { label: 'Positive', value: sentiment.positiveCount, color: '#10b981' },
    { label: 'Neutral', value: Math.max(stats.words - sentiment.positiveCount - sentiment.negativeCount, 0), color: '#64748b' },
    { label: 'Negative', value: sentiment.negativeCount, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<FileText className="w-5 h-5" />} label="Characters" value={stats.characters} color="#3b82f6" delay={0} />
        <StatCard icon={<Type className="w-5 h-5" />} label="Words" value={stats.words} color="#06b6d4" delay={50} />
        <StatCard icon={<Hash className="w-5 h-5" />} label="Sentences" value={stats.sentences} color="#8b5cf6" delay={100} />
        <StatCard icon={<AlignLeft className="w-5 h-5" />} label="Paragraphs" value={stats.paragraphs} color="#ec4899" delay={150} />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Read Time" value={stats.readingTimeMinutes} decimals={1} suffix="m" color="#10b981" delay={200} />
        <StatCard icon={<Mic className="w-5 h-5" />} label="Speak Time" value={stats.speakingTimeMinutes} decimals={1} suffix="m" color="#f59e0b" delay={250} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Unique Words" value={stats.uniqueWords} color="#14b8a6" delay={300} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Vocabulary Diversity" value={uniqueRatio} decimals={1} suffix="%" color="#f97316" delay={350} />
        <StatCard icon={<Hash className="w-5 h-5" />} label="Avg Words/Sentence" value={stats.avgWordsPerSentence} decimals={1} color="#6366f1" delay={400} />
        <StatCard icon={<Type className="w-5 h-5" />} label="Avg Chars/Word" value={stats.avgCharsPerWord} decimals={1} color="#a855f7" delay={450} />
      </div>

      {/* Readability + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoCard title="Readability Analysis" icon={<GaugeIcon className="w-4 h-4" />} delay={0}>
          <div className="flex flex-col items-center gap-4">
            <Gauge value={readability.fleschReadingEase} min={0} max={100} label="Flesch Reading Ease" />
            <div className="w-full text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{
                background: readability.fleschReadingEase >= 60 ? 'rgba(16,185,129,0.15)' : readability.fleschReadingEase >= 30 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                color: readability.fleschReadingEase >= 60 ? '#10b981' : readability.fleschReadingEase >= 30 ? '#f59e0b' : '#ef4444',
              }}>
                {readability.readabilityLabel}
              </div>
              <p className="text-xs text-slate-400 mt-2 max-w-xs">{readability.readabilityDescription}</p>
              <div className="text-xs text-slate-500 mt-1">Grade Level: {readability.gradeLevel}</div>
            </div>
            <div className="w-full space-y-2 mt-2">
              <HorizontalBar label="F-K Grade" value={readability.fleschKincaidGrade} max={20} color="linear-gradient(90deg, #3b82f6, #06b6d4)" />
              <HorizontalBar label="Gunning Fog" value={readability.gunningFog} max={20} color="linear-gradient(90deg, #8b5cf6, #ec4899)" />
              <HorizontalBar label="SMOG Index" value={readability.smogIndex} max={20} color="linear-gradient(90deg, #f59e0b, #f97316)" />
              <HorizontalBar label="ARI" value={readability.automatedReadabilityIndex} max={20} color="linear-gradient(90deg, #10b981, #14b8a6)" />
              <HorizontalBar label="Coleman-Liau" value={readability.colemanLiauIndex} max={20} color="linear-gradient(90deg, #6366f1, #a855f7)" />
            </div>
          </div>
        </InfoCard>

        <div className="space-y-4">
          <InfoCard title="Sentiment Analysis" icon={<Sparkles className="w-4 h-4" />} delay={50}>
            <SentimentIndicator sentiment={sentiment} />
            <div className="mt-4 flex items-center justify-center">
              <DonutChart
                segments={sentimentSegments}
                size={140}
                centerValue={sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1)}
                centerLabel={`${Math.round(sentiment.confidence * 100)}% conf.`}
              />
            </div>
          </InfoCard>

          <InfoCard title="Language Detection" icon={<Languages className="w-4 h-4" />} delay={100}>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-bold text-blue-400">{language.language}</div>
                <div className="text-xs text-slate-400">
                  {Math.round(language.confidence * 100)}% confidence
                </div>
              </div>
              {language.alternatives.length > 0 && (
                <div className="flex-1 space-y-1">
                  <div className="text-xs text-slate-500 mb-1">Other possibilities:</div>
                  {language.alternatives.map((alt, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{alt.language}</span>
                      <span className="text-slate-500 font-mono">{Math.round(alt.score * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </InfoCard>
        </div>
      </div>

      {/* Summary */}
      <InfoCard title="AI Summary" icon={<Sparkles className="w-4 h-4" />} delay={0}>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              {summary.sentences.length} key sentences
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {Math.round((1 - summary.compressionRatio) * 100)}% compression
            </span>
            <span>
              {summary.summaryWordCount} / {summary.originalWordCount} words
            </span>
          </div>
          <div className="space-y-2.5">
            {summary.sentences.map((sentence, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 animate-slide-in-left"
                style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{sentence}</p>
              </div>
            ))}
          </div>
        </div>
      </InfoCard>

      {/* Keywords + Key Phrases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoCard title="Top Keywords" icon={<Hash className="w-4 h-4" />} delay={0}>
          <div className="space-y-2">
            {keywords.slice(0, 15).map((kw, i) => (
              <HorizontalBar
                key={i}
                label={kw.word}
                value={kw.count}
                max={keywords[0]?.count || 1}
                color={`linear-gradient(90deg, hsl(${210 + i * 8}, 70%, 55%), hsl(${190 + i * 8}, 70%, 50%))`}
              />
            ))}
          </div>
        </InfoCard>

        <InfoCard title="Key Phrases" icon={<Sparkles className="w-4 h-4" />} delay={50}>
          <div className="flex flex-wrap gap-2">
            {keyPhrases.length > 0 ? keyPhrases.map((phrase, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all duration-200 cursor-default animate-scale-in"
                style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
              >
                {phrase.phrase}
                <span className="ml-2 text-xs text-slate-500 font-mono">{phrase.score.toFixed(2)}</span>
              </span>
            )) : (
              <p className="text-sm text-slate-500">No key phrases detected. Try analyzing a longer text.</p>
            )}
          </div>
        </InfoCard>
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoCard title="Word Length Distribution" icon={<BarChart3 className="w-4 h-4" />} delay={0}>
          <BarChart
            data={wordLengthDistribution.map((b) => ({
              label: b.range,
              value: b.count,
            }))}
            height={180}
            unit=""
          />
        </InfoCard>

        <InfoCard title="Sentence Length Distribution" icon={<BarChart3 className="w-4 h-4" />} delay={50}>
          <BarChart
            data={sentenceLengthDistribution.map((b) => ({
              label: b.range,
              value: b.count,
              color: 'linear-gradient(180deg, #8b5cf6, #6d28d9)',
            }))}
            height={180}
          />
        </InfoCard>
      </div>

      {/* Word Cloud */}
      <InfoCard title="Word Cloud" icon={<Sparkles className="w-4 h-4" />} delay={0}>
        <WordCloud words={topWords} maxItems={40} />
      </InfoCard>

      {/* Sentence-by-Sentence Analysis */}
      <InfoCard title="Sentence-by-Sentence Breakdown" icon={<AlignLeft className="w-4 h-4" />} delay={0}>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hidden">
          {sentenceAnalysis.map((sentence, i) => {
            const sentimentColor = sentence.sentimentLabel === 'positive' ? '#10b981' : sentence.sentimentLabel === 'negative' ? '#ef4444' : '#64748b';
            const sentimentBg = sentence.sentimentLabel === 'positive' ? 'rgba(16,185,129,0.08)' : sentence.sentimentLabel === 'negative' ? 'rgba(239,68,68,0.08)' : 'rgba(100,116,139,0.08)';
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border animate-slide-in-left"
                style={{
                  borderColor: `${sentimentColor}30`,
                  background: sentimentBg,
                  animationDelay: `${Math.min(i * 30, 600)}ms`,
                  opacity: 0,
                }}
              >
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500 font-mono">#{sentence.index + 1}</span>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: sentimentColor }}
                  />
                </div>
                <p className="flex-1 text-sm text-slate-300 leading-relaxed">{sentence.text}</p>
                <div className="flex-shrink-0 text-right text-xs space-y-0.5">
                  <div className="text-slate-400 font-mono">{sentence.wordCount} words</div>
                  <div style={{ color: sentimentColor }} className="font-mono">
                    {sentence.sentimentScore > 0 ? '+' : ''}{sentence.sentimentScore.toFixed(2)}
                  </div>
                  <div className="text-slate-500 font-mono">RE: {sentence.readabilityScore.toFixed(0)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </InfoCard>

      {/* Notable Findings */}
      <InfoCard title="Notable Findings" icon={<CheckCircle2 className="w-4 h-4" />} delay={0}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FindingItem
            icon={<Type className="w-4 h-4" />}
            label="Longest Word"
            value={stats.longestWord || 'N/A'}
            color="#3b82f6"
          />
          <FindingItem
            icon={<AlignLeft className="w-4 h-4" />}
            label="Longest Sentence"
            value={`${stats.longestSentence.slice(0, 80)}${stats.longestSentence.length > 80 ? '...' : ''}`}
            color="#06b6d4"
          />
          <FindingItem
            icon={<TrendingUp className="w-4 h-4" />}
            label="Vocabulary Richness"
            value={`${uniqueRatio.toFixed(1)}% unique`}
            color="#10b981"
          />
          <FindingItem
            icon={<BookOpen className="w-4 h-4" />}
            label="Reading Difficulty"
            value={readability.readabilityLabel}
            color="#f59e0b"
          />
          <FindingItem
            icon={<Sparkles className="w-4 h-4" />}
            label="Dominant Sentiment"
            value={`${sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1)} (${Math.round(sentiment.confidence * 100)}%)`}
            color={sentiment.label === 'positive' ? '#10b981' : sentiment.label === 'negative' ? '#ef4444' : '#f59e0b'}
          />
          <FindingItem
            icon={<Languages className="w-4 h-4" />}
            label="Detected Language"
            value={`${language.language} (${Math.round(language.confidence * 100)}%)`}
            color="#8b5cf6"
          />
        </div>
      </InfoCard>
    </div>
  );
}

function FindingItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm font-medium text-slate-200 truncate">{value}</div>
      </div>
    </div>
  );
}

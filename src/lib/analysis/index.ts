import type { AnalysisResult } from '@/types';
import { computeStats } from './stats';
import { computeReadability } from './readability';
import { extractKeywords, extractKeyPhrases } from './keywords';
import { analyzeSentiment } from './sentiment';
import { summarize } from './summary';
import { detectLanguage } from './language';
import { analyzeSentences, computeWordLengthDistribution, computeSentenceLengthDistribution } from './sentences';
import { tokenize, isStopWord } from '../textUtils';
import { analyzeDocumentLocally } from './docAnalyzer';

export function analyzeText(text: string, title = 'Untitled Document'): AnalysisResult {
  const stats = computeStats(text);
  const readability = computeReadability(text);
  const keywords = extractKeywords(text);
  const keyPhrases = extractKeyPhrases(text);
  const sentiment = analyzeSentiment(text);
  const summary = summarize(text);
  const language = detectLanguage(text);
  const sentenceAnalysis = analyzeSentences(text);
  const wordLengthDistribution = computeWordLengthDistribution(text);
  const sentenceLengthDistribution = computeSentenceLengthDistribution(text);

  const words = tokenize(text);
  const freq = new Map<string, number>();
  for (const word of words) {
    if (word.length < 3 || isStopWord(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  const topWords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));

  const docAnalysis = analyzeDocumentLocally(text, title);

  return {
    stats,
    readability,
    keywords,
    keyPhrases,
    sentiment,
    summary,
    language,
    sentenceAnalysis,
    wordLengthDistribution,
    sentenceLengthDistribution,
    topWords,
    analyzedAt: new Date().toISOString(),
    docAnalysis,
  };
}

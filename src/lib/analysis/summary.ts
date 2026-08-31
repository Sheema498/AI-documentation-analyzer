import type { SummaryResult } from '@/types';
import { tokenize, splitSentences, isStopWord, round } from '../textUtils';

interface ScoredSentence {
  text: string;
  index: number;
  score: number;
  wordCount: number;
}

export function summarize(text: string, compressionRatio = 0.3): SummaryResult {
  const sentences = splitSentences(text);
  if (sentences.length <= 3) {
    const words = tokenize(text);
    return {
      sentences,
      compressionRatio: 1,
      originalWordCount: words.length,
      summaryWordCount: words.length,
    };
  }

  const wordFreq = new Map<string, number>();
  for (const word of tokenize(text)) {
    if (word.length < 3 || isStopWord(word)) continue;
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  const maxFreq = Math.max(...wordFreq.values(), 1);
  for (const [word, freq] of wordFreq) {
    wordFreq.set(word, freq / maxFreq);
  }

  const scored: ScoredSentence[] = sentences.map((sentence, index) => {
    const words = tokenize(sentence);
    const meaningfulWords = words.filter((w) => !isStopWord(w) && w.length >= 3);
    let score = 0;

    for (const word of meaningfulWords) {
      score += wordFreq.get(word) || 0;
    }

    score = score / Math.max(words.length, 1);

    if (index === 0) score *= 1.25;
    if (index === sentences.length - 1) score *= 1.1;

    const wordCount = words.length;
    if (wordCount < 5) score *= 0.5;
    if (wordCount > 50) score *= 0.8;

    const hasKeyword = meaningfulWords.some((w) => (wordFreq.get(w) || 0) > 0.5);
    if (hasKeyword) score *= 1.15;

    return { text: sentence, index, score, wordCount };
  });

  const summaryLength = Math.max(
    Math.ceil(sentences.length * compressionRatio),
    1,
  );

  const topSentences = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, summaryLength)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.text);

  const originalWordCount = tokenize(text).length;
  const summaryWordCount = topSentences.reduce(
    (sum, s) => sum + tokenize(s).length,
    0,
  );

  return {
    sentences: topSentences,
    compressionRatio: round(summaryWordCount / Math.max(originalWordCount, 1), 2),
    originalWordCount,
    summaryWordCount,
  };
}

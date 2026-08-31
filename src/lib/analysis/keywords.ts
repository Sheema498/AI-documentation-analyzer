import type { KeywordResult, KeyPhraseResult } from '@/types';
import { tokenize, isStopWord, round } from '../textUtils';

export function extractKeywords(text: string, limit = 20): KeywordResult[] {
  const words = tokenize(text);
  const freq = new Map<string, number>();

  for (const word of words) {
    if (word.length < 3 || isStopWord(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  const maxFreq = Math.max(...freq.values(), 1);
  const results: KeywordResult[] = [];

  for (const [word, count] of freq) {
    const weight = round(count / maxFreq, 3);
    results.push({ word, count, weight });
  }

  results.sort((a, b) => b.count - a.count || b.weight - a.weight);
  return results.slice(0, limit);
}

export function extractKeyPhrases(text: string, limit = 10): KeyPhraseResult[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  const phrases = new Map<string, number>();

  for (const sentence of sentences) {
    const tokens = tokenize(sentence);
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        const ngram = tokens.slice(i, i + n);
        if (ngram.every((w) => !isStopWord(w) || (n === 3 && w.length > 4))) {
          const phrase = ngram.join(' ');
          if (phrase.length < 6) continue;
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
      }
    }
  }

  const filtered = new Map<string, number>();
  for (const [phrase, count] of phrases) {
    if (count >= 2) {
      filtered.set(phrase, count);
    }
  }

  if (filtered.size === 0) {
    for (const [phrase, count] of phrases) {
      filtered.set(phrase, count);
    }
  }

  const maxCount = Math.max(...filtered.values(), 1);
  const results: KeyPhraseResult[] = [];

  for (const [phrase, count] of filtered) {
    const score = round((count / maxCount) * (1 + phrase.split(' ').length * 0.1), 3);
    results.push({ phrase, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

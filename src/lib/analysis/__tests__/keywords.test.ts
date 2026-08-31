import { describe, it, expect } from 'vitest';
import { extractKeywords, extractKeyPhrases } from '../keywords';

describe('extractKeywords', () => {
  it('extracts frequent non-stop words', () => {
    const text =
      'Machine learning is a subset of artificial intelligence. Machine learning models learn from data. Artificial intelligence systems use machine learning.';
    const keywords = extractKeywords(text);
    expect(keywords.length).toBeGreaterThan(0);
    const words = keywords.map((k) => k.word);
    expect(words).toContain('machine');
    expect(words).toContain('learning');
  });

  it('returns empty array for empty input', () => {
    expect(extractKeywords('')).toEqual([]);
  });

  it('assigns higher weight to more frequent terms', () => {
    const text = 'apple banana apple apple orange banana apple';
    const keywords = extractKeywords(text);
    const apple = keywords.find((k) => k.word === 'apple');
    const banana = keywords.find((k) => k.word === 'banana');
    expect(apple).toBeDefined();
    expect(banana).toBeDefined();
    if (apple && banana) {
      expect(apple.count).toBeGreaterThan(banana.count);
      expect(apple.weight).toBeGreaterThanOrEqual(banana.weight);
    }
  });
});

describe('extractKeyPhrases', () => {
  it('returns phrases from multi-word text', () => {
    const text =
      'Natural language processing enables computers to understand human language. Machine learning improves natural language processing accuracy.';
    const phrases = extractKeyPhrases(text);
    expect(Array.isArray(phrases)).toBe(true);
  });

  it('handles short text', () => {
    const phrases = extractKeyPhrases('Hello world');
    expect(Array.isArray(phrases)).toBe(true);
  });
});

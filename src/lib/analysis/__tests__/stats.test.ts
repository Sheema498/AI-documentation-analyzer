import { describe, it, expect } from 'vitest';
import { computeStats } from '../stats';

describe('computeStats', () => {
  it('returns zeroed stats for empty text', () => {
    const result = computeStats('');
    expect(result.characters).toBe(0);
    expect(result.words).toBe(0);
    expect(result.sentences).toBe(0);
    expect(result.paragraphs).toBe(0);
  });

  it('counts characters, words, and sentences correctly', () => {
    const text = 'Hello world. This is a test.';
    const result = computeStats(text);
    expect(result.characters).toBe(text.length);
    expect(result.words).toBe(6);
    expect(result.sentences).toBe(2);
    expect(result.uniqueWords).toBe(6);
  });

  it('computes average words per sentence', () => {
    const text = 'One two three. Four five.';
    const result = computeStats(text);
    expect(result.avgWordsPerSentence).toBe(2.5);
  });

  it('estimates reading time', () => {
    // ~200 words per minute
    const words = Array(200).fill('word').join(' ');
    const result = computeStats(words);
    expect(result.readingTimeMinutes).toBe(1);
  });

  it('finds longest word and sentence', () => {
    const text = 'Short. This is a considerably longer sentence here.';
    const result = computeStats(text);
    expect(result.longestWord).toBe('considerably');
    expect(result.longestSentence).toContain('considerably');
  });
});

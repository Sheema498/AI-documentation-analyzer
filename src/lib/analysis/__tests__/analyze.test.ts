import { describe, it, expect } from 'vitest';
import { analyzeText } from '../index';

describe('analyzeText', () => {
  const sample =
    'Artificial intelligence is transforming the world. Machine learning algorithms process vast amounts of data. This technology brings both opportunities and challenges. We must carefully consider the ethical implications.';

  it('returns a complete analysis result', () => {
    const result = analyzeText(sample);
    expect(result.stats).toBeDefined();
    expect(result.readability).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(result.sentiment).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.language).toBeDefined();
    expect(result.sentenceAnalysis).toBeDefined();
    expect(result.topWords).toBeDefined();
    expect(result.analyzedAt).toBeTruthy();
  });

  it('produces non-empty stats for meaningful text', () => {
    const result = analyzeText(sample);
    expect(result.stats.words).toBeGreaterThan(10);
    expect(result.stats.sentences).toBeGreaterThan(1);
  });

  it('includes top words sorted by frequency', () => {
    const result = analyzeText(sample);
    expect(result.topWords.length).toBeGreaterThan(0);
    if (result.topWords.length > 1) {
      expect(result.topWords[0].count).toBeGreaterThanOrEqual(result.topWords[1].count);
    }
  });
});

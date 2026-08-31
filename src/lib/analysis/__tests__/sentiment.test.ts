import { describe, it, expect } from 'vitest';
import { analyzeSentiment } from '../sentiment';

describe('analyzeSentiment', () => {
  it('detects positive sentiment', () => {
    const result = analyzeSentiment('This is a wonderful and amazing product. I love it!');
    expect(result.label).toBe('positive');
    expect(result.score).toBeGreaterThan(0);
    expect(result.positiveCount).toBeGreaterThan(0);
  });

  it('detects negative sentiment', () => {
    const result = analyzeSentiment('This is terrible and awful. I hate everything about it.');
    expect(result.label).toBe('negative');
    expect(result.score).toBeLessThan(0);
    expect(result.negativeCount).toBeGreaterThan(0);
  });

  it('returns neutral for balanced or empty text', () => {
    const empty = analyzeSentiment('');
    expect(empty.label).toBe('neutral');

    const neutral = analyzeSentiment('The cat sat on the mat.');
    expect(neutral.label).toBe('neutral');
  });

  it('includes matched positive and negative words', () => {
    const result = analyzeSentiment('I love this great idea but hate the bad implementation.');
    expect(result.positiveWords.length).toBeGreaterThan(0);
    expect(result.negativeWords.length).toBeGreaterThan(0);
  });

  it('provides a confidence score between 0 and 1', () => {
    const result = analyzeSentiment('Excellent brilliant fantastic wonderful!');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

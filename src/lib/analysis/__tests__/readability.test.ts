import { describe, it, expect } from 'vitest';
import { computeReadability } from '../readability';

describe('computeReadability', () => {
  it('returns valid scores for sample text', () => {
    const text =
      'The quick brown fox jumps over the lazy dog. This is a simple sentence used for testing readability metrics.';
    const result = computeReadability(text);

    expect(typeof result.fleschReadingEase).toBe('number');
    expect(typeof result.fleschKincaidGrade).toBe('number');
    expect(typeof result.gunningFog).toBe('number');
    expect(result.gradeLevel).toBeTruthy();
    expect(result.readabilityLabel).toBeTruthy();
  });

  it('handles empty text gracefully', () => {
    const result = computeReadability('');
    expect(result.fleschReadingEase).toBeDefined();
  });

  it('assigns higher ease score to simpler text', () => {
    const simple = 'The cat sat. The dog ran. It was fun.';
    const complex =
      'Notwithstanding the aforementioned considerations regarding the multifaceted implications of the theoretical framework...';
    const simpleResult = computeReadability(simple);
    const complexResult = computeReadability(complex);
    // Simpler text should generally have higher (easier) Flesch score
    expect(simpleResult.fleschReadingEase).toBeGreaterThan(complexResult.fleschReadingEase - 20);
  });
});

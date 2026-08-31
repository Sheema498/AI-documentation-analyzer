import { describe, it, expect } from 'vitest';
import { tokenize, splitSentences, splitParagraphs, isStopWord, countSyllables } from '../textUtils';

describe('tokenize', () => {
  it('lowercases and splits on whitespace', () => {
    expect(tokenize('Hello World!')).toEqual(['hello', 'world']);
  });

  it('filters empty tokens', () => {
    expect(tokenize('  a   b  ')).toEqual(['a', 'b']);
  });
});

describe('splitSentences', () => {
  it('splits on sentence-ending punctuation', () => {
    const result = splitSentences('Hello. How are you? Fine!');
    expect(result.length).toBe(3);
  });

  it('returns empty for blank input', () => {
    expect(splitSentences('')).toEqual([]);
  });
});

describe('splitParagraphs', () => {
  it('splits on blank lines', () => {
    const text = 'Para one.\n\nPara two.\n\nPara three.';
    expect(splitParagraphs(text).length).toBe(3);
  });
});

describe('isStopWord', () => {
  it('identifies common stop words', () => {
    expect(isStopWord('the')).toBe(true);
    expect(isStopWord('and')).toBe(true);
    expect(isStopWord('machine')).toBe(false);
  });
});

describe('countSyllables', () => {
  it('counts syllables approximately', () => {
    expect(countSyllables('cat')).toBe(1);
    expect(countSyllables('hello')).toBeGreaterThanOrEqual(2);
    expect(countSyllables('beautiful')).toBeGreaterThanOrEqual(3);
  });
});

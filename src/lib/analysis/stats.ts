import type { TextStats } from '@/types';
import { tokenize, splitSentences, splitParagraphs, round } from '../textUtils';

export function computeStats(text: string): TextStats {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const words = tokenize(text);
  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);

  const wordSet = new Set(words);
  const longestWord = words.reduce((longest, w) => (w.length > longest.length ? w : longest), '');
  const longestSentence = sentences.reduce(
    (longest, s) => (s.length > longest.length ? s : longest),
    '',
  );

  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const paragraphCount = Math.max(paragraphs.length, 1);

  return {
    characters,
    charactersNoSpaces,
    words: wordCount,
    uniqueWords: wordSet.size,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    avgWordsPerSentence: round(wordCount / sentenceCount),
    avgCharsPerWord: wordCount > 0 ? round(charactersNoSpaces / wordCount) : 0,
    avgSentencesPerParagraph: round(sentences.length / paragraphCount),
    readingTimeMinutes: round((wordCount / 200), 1),
    speakingTimeMinutes: round((wordCount / 130), 1),
    longestWord,
    longestSentence,
  };
}

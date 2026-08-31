import type { SentenceAnalysis, WordFrequencyBucket, SentimentLabel } from '@/types';
import { tokenize, splitSentences, countSyllables, round } from '../textUtils';

const POSITIVE_MARKERS = new Set([
  'good', 'great', 'excellent', 'happy', 'love', 'best', 'better',
  'beautiful', 'success', 'win', 'benefit', 'improve', 'progress',
  'delight', 'pleasure', 'enjoy', 'hope', 'optimistic', 'excited',
  'grateful', 'proud', 'strong', 'effective', 'creative', 'inspiring',
  'quality', 'outstanding', 'remarkable', 'positive', 'yes', 'agree',
]);

const NEGATIVE_MARKERS = new Set([
  'bad', 'terrible', 'horrible', 'awful', 'worst', 'worse', 'hate',
  'disgust', 'ugly', 'offensive', 'pain', 'hurt', 'suffer', 'sad',
  'fear', 'afraid', 'scared', 'worry', 'trouble', 'problem', 'difficult',
  'fail', 'failure', 'useless', 'worthless', 'crisis', 'disaster',
  'tragic', 'regret', 'guilt', 'shame', 'angry', 'rage', 'cruel',
  'evil', 'poor', 'starving', 'dull', 'boring', 'mediocre', 'inferior',
  'no', 'not', 'never', 'disagree', 'oppose', 'reject',
]);

export function analyzeSentences(text: string): SentenceAnalysis[] {
  const sentences = splitSentences(text);

  return sentences.map((sentence, index) => {
    const words = tokenize(sentence);
    const wordCount = words.length;
    let sentimentScore = 0;

    for (const word of words) {
      if (POSITIVE_MARKERS.has(word)) sentimentScore += 1;
      if (NEGATIVE_MARKERS.has(word)) sentimentScore -= 1;
    }

    sentimentScore = wordCount > 0 ? round(sentimentScore / Math.sqrt(wordCount), 3) : 0;

    let sentimentLabel: SentimentLabel;
    if (sentimentScore > 0.1) sentimentLabel = 'positive';
    else if (sentimentScore < -0.1) sentimentLabel = 'negative';
    else sentimentLabel = 'neutral';

    const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const readabilityScore = wordCount > 0
      ? round(206.835 - 1.015 * wordCount - 84.6 * (syllables / wordCount), 1)
      : 0;

    return {
      text: sentence,
      index,
      wordCount,
      sentimentScore,
      sentimentLabel,
      readabilityScore,
    };
  });
}

export function computeWordLengthDistribution(text: string): WordFrequencyBucket[] {
  const words = tokenize(text);
  const buckets = new Map<string, number>();
  const ranges = ['1-3', '4-6', '7-9', '10-12', '13-15', '16+'];

  for (const range of ranges) buckets.set(range, 0);

  for (const word of words) {
    const len = word.length;
    let range: string;
    if (len <= 3) range = '1-3';
    else if (len <= 6) range = '4-6';
    else if (len <= 9) range = '7-9';
    else if (len <= 12) range = '10-12';
    else if (len <= 15) range = '13-15';
    else range = '16+';
    buckets.set(range, (buckets.get(range) || 0) + 1);
  }

  return ranges.map((range) => ({ range, count: buckets.get(range) || 0 }));
}

export function computeSentenceLengthDistribution(text: string): WordFrequencyBucket[] {
  const sentences = splitSentences(text);
  const buckets = new Map<string, number>();
  const ranges = ['1-5', '6-10', '11-15', '16-20', '21-30', '31+'];

  for (const range of ranges) buckets.set(range, 0);

  for (const sentence of sentences) {
    const wordCount = tokenize(sentence).length;
    let range: string;
    if (wordCount <= 5) range = '1-5';
    else if (wordCount <= 10) range = '6-10';
    else if (wordCount <= 15) range = '11-15';
    else if (wordCount <= 20) range = '16-20';
    else if (wordCount <= 30) range = '21-30';
    else range = '31+';
    buckets.set(range, (buckets.get(range) || 0) + 1);
  }

  return ranges.map((range) => ({ range, count: buckets.get(range) || 0 }));
}

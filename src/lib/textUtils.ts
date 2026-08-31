import { SYLLABLES_DATA } from './data/syllables';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'that', 'this', 'these', 'those', 'i', 'you',
  'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers',
  'ours', 'theirs', 'as', 'if', 'then', 'than', 'so', 'not', 'no', 'nor',
  'too', 'very', 'just', 'only', 'also', 'about', 'above', 'after',
  'again', 'against', 'all', 'am', 'any', 'because', 'before', 'below',
  'between', 'both', 'down', 'during', 'each', 'few', 'further', 'get',
  'got', 'here', 'how', 'into', 'more', 'most', 'off', 'other', 'out',
  'over', 'own', 'same', 'some', 'such', 'there', 'through', 'under',
  'up', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'once', 'twice', 'go', 'going', 'gone', 'one', 'two', 'three',
  'said', 'say', 'says', 'saying', 'make', 'made', 'makes', 'making',
  'like', 'well', 'even', 'still', 'back', 'now', 'way', 'want',
  'wants', 'wanted', 'let', 'lets', 'let\'s', 'see', 'seen', 'seen',
  'come', 'came', 'comes', 'coming', 'take', 'took', 'taken', 'takes',
  'know', 'knew', 'known', 'knows', 'think', 'thought', 'thinks',
  'look', 'looked', 'looks', 'use', 'used', 'uses', 'using', 'find',
  'found', 'finds', 'give', 'gave', 'given', 'gives', 'tell', 'told',
  'tells', 'work', 'worked', 'works', 'call', 'called', 'calls',
  'try', 'tried', 'tries', 'ask', 'asked', 'asks', 'feel', 'felt',
  'feels', 'become', 'became', 'leaves', 'put', 'mean', 'meant',
  'keep', 'kept', 'let', 'begin', 'seem', 'help', 'show', 'hear',
  'play', 'run', 'move', 'live', 'believe', 'hold', 'bring', 'happen',
  'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include',
  'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch',
  'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend',
  'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider',
  'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build',
  'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise',
  'pass', 'sell', 'require', 'report', 'decide', 'pull', 'upon', 'per',
  'among', 'many', 'much', 'however', 'though', 'since', 'unless',
  'within', 'without', 'along', 'already', 'yet', 'quite', 'rather',
  'perhaps', 'maybe', 'indeed', 'instead', 'else', 'beside', 'besides',
  'amongst', 'amid', 'amidst', 'whilst', 'whereas', 'whether',
]);

export function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

export function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const sentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return sentences;
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (SYLLABLES_DATA[w as keyof typeof SYLLABLES_DATA] !== undefined) {
    return SYLLABLES_DATA[w as keyof typeof SYLLABLES_DATA];
  }
  if (w.length <= 3) return 1;
  const wordCleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  const wordCleaned2 = wordCleaned.replace(/^y/, '');
  const matches = wordCleaned2.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function countWordSyllablesInText(text: string): number {
  const words = tokenize(text);
  return words.reduce((sum, w) => sum + countSyllables(w), 0);
}

export function isComplexWord(word: string): boolean {
  return countSyllables(word) >= 3;
}

export function countComplexWords(text: string): number {
  return tokenize(text).filter(isComplexWord).length;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

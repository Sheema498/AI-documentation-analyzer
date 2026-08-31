import type { LanguageResult } from '@/types';


function buildTrigrams(text: string): Map<string, number> {
  const cleanText = text.toLowerCase().replace(/[^a-zà-ÿ\s]/g, ' ');
  const trigrams = new Map<string, number>();
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);

  for (const word of words) {
    const padded = `_` + word + `_`;
    for (let i = 0; i < padded.length - 2; i++) {
      const trigram = padded.slice(i, i + 3);
      trigrams.set(trigram, (trigrams.get(trigram) || 0) + 1);
    }
  }

  return trigrams;
}

const LANGUAGE_PROFILES: Record<string, string[]> = {
  English: ['the', 'and', 'ing', 'tion', 'her', 'hat', 'his', 'tha', 'ere', 'ent', 'for', 'ion', 'ter', 'was', 'you', 'ith', 'ver', 'all', 'ati', 'hat'],
  Spanish: ['que', 'de_', 'la_', 'ion', 'con', 'ado', 'aci', 'ent', 'ado', 'que', 'los', 'del', 'las', 'por', 'una', 'ado', 'par', 'ado', 'ent', 'ado'],
  French: ['les', 'de_', 'le_', 'la_', 'ion', 'ent', 'que', 'des', 'tio', 'est', 'ati', 'ent', 'tio', 'par', 'une', 'sur', 'tio', 'ent', 'que', 'par'],
  German: ['der', 'die', 'und', 'ich', 'ein', 'sch', 'ung', 'ich', 'ter', 'cht', 'die', 'den', 'ist', 'ung', 'ich', 'ein', 'ich', 'der', 'und', 'die'],
  Italian: ['che', 'del', 'gli', 'are', 'ion', 'ent', 'con', 'non', 'tio', 'chi', 'par', 'que', 'del', 'gli', 'are', 'con', 'ent', 'ion', 'que', 'del'],
  Portuguese: ['que', 'cao', 'ent', 'ado', 'par', 'com', 'dos', 'ais', 'ado', 'que', 'uma', 'dos', 'par', 'ado', 'ent', 'com', 'que', 'ado', 'ent', 'par'],
  Dutch: ['een', 'het', 'de_', 'van', 'en_', 'ing', 'nde', 'dat', 'tee', 'ent', 'ver', 'een', 'het', 'van', 'de_', 'ing', 'nde', 'dat', 'ent', 'ver'],
  Russian: ['ост', 'ени', 'ова', 'ани', 'ост', 'пол', 'ост', 'ени', 'ова', 'ани'],
};

export function detectLanguage(text: string): LanguageResult {
  const textTrigrams = buildTrigrams(text);
  if (textTrigrams.size === 0) {
    return {
      language: 'Unknown',
      confidence: 0,
      alternatives: [],
    };
  }

  const sortedTextTrigrams = [...textTrigrams.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 300)
    .map(([t]) => t);

  const textTrigramSet = new Set(sortedTextTrigrams);
  const results: { language: string; score: number }[] = [];

  for (const [lang, profileTrigrams] of Object.entries(LANGUAGE_PROFILES)) {
    let matches = 0;
    for (const trigram of profileTrigrams) {
      if (textTrigramSet.has(trigram)) matches++;
    }
    const score = matches / profileTrigrams.length;
    results.push({ language: lang, score: Math.round(score * 100) / 100 });
  }

  results.sort((a, b) => b.score - a.score);

  const top = results[0];
  const alternatives = results.slice(1, 4);

  const confidence = top.score > 0
    ? Math.round((top.score / (results.reduce((sum, r) => sum + r.score, 0) || 1)) * 100) / 100
    : 0;

  return {
    language: top.score > 0.1 ? top.language : 'Unknown',
    confidence,
    alternatives,
  };
}

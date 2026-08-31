import type { SavedDocument } from '@/types';

const STORAGE_KEY = 'doc-analyzer-history';
const MAX_HISTORY = 50;

export function loadHistory(): SavedDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Safety check: Filter out malformed, corrupted, or old data schemas
    return parsed.filter((doc) => {
      try {
        return (
          doc &&
          typeof doc === 'object' &&
          typeof doc.id === 'string' &&
          typeof doc.title === 'string' &&
          typeof doc.content === 'string' &&
          doc.analysis &&
          typeof doc.analysis === 'object' &&
          doc.analysis.docAnalysis &&
          typeof doc.analysis.docAnalysis === 'object' &&
          doc.analysis.docAnalysis.score &&
          typeof doc.analysis.docAnalysis.score.overall === 'number'
        );
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

export function saveDocument(doc: SavedDocument): SavedDocument[] {
  const history = loadHistory();
  
  // Storage optimization: Truncate raw content text & strip massive collections
  // to avoid localStorage QuotaExceeded limits on massive documents
  const optimizedDoc: SavedDocument = {
    ...doc,
    content: doc.content.length > 10000 
      ? doc.content.slice(0, 10000) + '\n\n... [Raw Content Truncated for Storage] ...' 
      : doc.content,
    analysis: {
      ...doc.analysis,
      // Truncate heavy sentence analysis array
      sentenceAnalysis: doc.analysis.sentenceAnalysis && doc.analysis.sentenceAnalysis.length > 100
        ? doc.analysis.sentenceAnalysis.slice(0, 100)
        : doc.analysis.sentenceAnalysis,
      // Truncate heavy word distributions
      topWords: doc.analysis.topWords && doc.analysis.topWords.length > 30
        ? doc.analysis.topWords.slice(0, 30)
        : doc.analysis.topWords
    }
  };

  const filtered = history.filter((d) => d.id !== optimizedDoc.id);
  let updated = [optimizedDoc, ...filtered].slice(0, MAX_HISTORY);
  
  let success = false;
  let attempts = 0;
  
  // Self-healing eviction loop for QuotaExceededError
  while (!success && updated.length > 0 && attempts < MAX_HISTORY) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      success = true;
    } catch (err) {
      attempts++;
      // Remove the oldest item (last) and retry saving
      if (updated.length > 1) {
        updated.pop();
      } else {
        // Only one item and it's too big to save
        break;
      }
    }
  }
  
  return updated;
}

export function deleteDocument(id: string): SavedDocument[] {
  const history = loadHistory();
  const updated = history.filter((d) => d.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

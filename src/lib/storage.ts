import type { SavedDocument } from '@/types';

const STORAGE_KEY = 'doc-analyzer-history';
const MAX_HISTORY = 50;

export function loadHistory(): SavedDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveDocument(doc: SavedDocument): SavedDocument[] {
  const history = loadHistory();
  const filtered = history.filter((d) => d.id !== doc.id);
  const updated = [doc, ...filtered].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // storage may be full; keep going
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

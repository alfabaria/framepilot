export type HistoryEntry = { url: string; title: string; visitedAt: number };

export const HISTORY_LIMIT = 100;
const STORAGE_KEY = 'framepilot.urlHistory';

/** The address without its #fragment, so in-page anchors don't create separate history entries. */
function historyKey(url: string): string {
  const hash = url.indexOf('#');
  return hash === -1 ? url : url.slice(0, hash);
}

/** Records a visit: the newest visit of a page moves to the front, older duplicates are dropped, and the list is capped. */
export function recordVisit(entries: readonly HistoryEntry[], url: string, title: string, now: number): HistoryEntry[] {
  if (!/^https?:\/\//i.test(url)) return [...entries];
  const key = historyKey(url);
  const previous = entries.find((entry) => entry.url === key);
  const next: HistoryEntry = { url: key, title: title || previous?.title || '', visitedAt: now };
  return [next, ...entries.filter((entry) => entry.url !== key)].slice(0, HISTORY_LIMIT);
}

/** Entries matching every word of the query in the address or title; the most recent come first. An empty query lists everything. */
export function searchHistory(entries: readonly HistoryEntry[], query: string, limit = 8): HistoryEntry[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = words.length === 0
    ? entries
    : entries.filter((entry) => {
      const haystack = `${entry.url} ${entry.title}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  return matches.slice(0, limit);
}

export function loadHistory(): HistoryEntry[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is HistoryEntry => typeof entry?.url === 'string' && typeof entry?.title === 'string' && typeof entry?.visitedAt === 'number')
      .slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function saveHistory(entries: readonly HistoryEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage unavailable: history simply isn't kept across launches.
  }
}

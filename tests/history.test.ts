import { describe, expect, it } from 'vitest';
import { HISTORY_LIMIT, recordVisit, searchHistory } from '../src/renderer/history';
import type { HistoryEntry } from '../src/renderer/history';

describe('url history', () => {
  it('moves a revisited page to the front without duplicating it, ignoring #fragments', () => {
    let entries: HistoryEntry[] = [];
    entries = recordVisit(entries, 'https://a.test/', 'A', 1);
    entries = recordVisit(entries, 'https://b.test/', 'B', 2);
    entries = recordVisit(entries, 'https://a.test/#section', '', 3);
    expect(entries.map((entry) => entry.url)).toEqual(['https://a.test/', 'https://b.test/']);
    expect(entries[0]).toMatchObject({ title: 'A', visitedAt: 3 });
  });

  it('only records http(s) pages and caps the list', () => {
    expect(recordVisit([], 'file:///etc/passwd', '', 1)).toEqual([]);
    let entries: HistoryEntry[] = [];
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) entries = recordVisit(entries, `https://s.test/${i}`, '', i);
    expect(entries).toHaveLength(HISTORY_LIMIT);
    expect(entries[0]?.url).toBe(`https://s.test/${HISTORY_LIMIT + 9}`);
  });

  it('matches every typed word against address or title, most recent first', () => {
    const entries: HistoryEntry[] = [
      { url: 'http://localhost:3001/events', title: 'Sarga Events', visitedAt: 3 },
      { url: 'http://localhost:3001/', title: 'Sarga Horse Sport', visitedAt: 2 },
      { url: 'https://example.com/', title: 'Example Domain', visitedAt: 1 },
    ];
    expect(searchHistory(entries, 'sarga ev').map((entry) => entry.url)).toEqual(['http://localhost:3001/events']);
    expect(searchHistory(entries, 'LOCALHOST').map((entry) => entry.visitedAt)).toEqual([3, 2]);
    expect(searchHistory(entries, '', 2)).toHaveLength(2);
  });
});

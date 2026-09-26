import { beforeEach, describe, expect, it } from 'vitest';

import {
  MAX_SEARCH_HISTORY,
  SEARCH_HISTORY_KEY,
  pushSearchHistory,
  readSearchHistory,
} from '../searchHistory';

describe('searchHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses tdmusic.searchHistory key and starts empty', () => {
    expect(SEARCH_HISTORY_KEY).toBe('tdmusic.searchHistory');
    expect(readSearchHistory()).toEqual([]);
  });

  it('pushes trimmed queries newest-first', () => {
    pushSearchHistory('  alpha  ');
    pushSearchHistory('beta');
    expect(readSearchHistory()).toEqual(['beta', 'alpha']);
  });

  it('ignores blank queries', () => {
    pushSearchHistory('   ');
    pushSearchHistory('');
    expect(readSearchHistory()).toEqual([]);
  });

  it('dedupes case-insensitively and moves to front', () => {
    pushSearchHistory('Rock');
    pushSearchHistory('jazz');
    pushSearchHistory('rock');
    expect(readSearchHistory()).toEqual(['rock', 'jazz']);
  });

  it(`keeps at most ${MAX_SEARCH_HISTORY} entries`, () => {
    for (let i = 1; i <= 12; i++) {
      pushSearchHistory(`q${i}`);
    }
    const history = readSearchHistory();
    expect(history).toHaveLength(MAX_SEARCH_HISTORY);
    expect(history[0]).toBe('q12');
    expect(history[9]).toBe('q3');
    expect(history).not.toContain('q1');
    expect(history).not.toContain('q2');
  });
});

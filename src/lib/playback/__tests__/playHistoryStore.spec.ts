import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearPlayHistory,
  listPlayHistory,
  resetPlayHistoryDbForTests,
  savePlayRecord,
} from '../playHistoryStore';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('playHistoryStore', () => {
  beforeEach(async () => {
    await resetPlayHistoryDbForTests();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('saves every play session including sub-minute ones', async () => {
    const startedAt = Date.now() - 2_000;
    const endedAt = Date.now() - 1_000;
    await savePlayRecord({
      trackId: 'a',
      startedAt,
      endedAt,
    });

    const rows = await listPlayHistory();
    expect(rows).toEqual([
      expect.objectContaining({
        trackId: 'a',
        startedAt,
        endedAt,
      }),
    ]);
    expect(rows[0]?.id).toEqual(expect.any(Number));
  });

  it('async cleans records older than 30 days when saving a new record', async () => {
    const later = 1_700_000_000_000;
    const earlier = later - 31 * DAY_MS;

    vi.spyOn(Date, 'now').mockReturnValue(earlier);
    await savePlayRecord({
      trackId: 'old',
      startedAt: earlier,
      endedAt: earlier + 5_000,
    });

    vi.spyOn(Date, 'now').mockReturnValue(later);
    await savePlayRecord({
      trackId: 'keep',
      startedAt: later - DAY_MS,
      endedAt: later - DAY_MS + 5_000,
    });
    await savePlayRecord({
      trackId: 'fresh',
      startedAt: later - 1_000,
      endedAt: later,
    });

    await vi.waitFor(async () => {
      const rows = await listPlayHistory();
      expect(rows.map((r) => r.trackId).sort()).toEqual(['fresh', 'keep']);
    });
  });
  it('clearPlayHistory removes all records', async () => {
    const now = Date.now();
    await savePlayRecord({ trackId: 'a', startedAt: now - 2_000, endedAt: now - 1_000 });
    await clearPlayHistory();
    expect(await listPlayHistory()).toEqual([]);
  });
});

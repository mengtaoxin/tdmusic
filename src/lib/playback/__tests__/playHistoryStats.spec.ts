import { describe, expect, it } from 'vitest';

import {
  MIN_COUNTED_PLAY_DURATION_MS,
  aggregatePlayCounts,
  type PlayHistoryRecordInput,
} from '../playHistoryStats';

const DAY_MS = 24 * 60 * 60 * 1000;

function record(trackId: string, startedAt: number, durationMs: number): PlayHistoryRecordInput {
  return { trackId, startedAt, endedAt: startedAt + durationMs };
}

describe('aggregatePlayCounts', () => {
  const now = 1_700_000_000_000;

  it('counts only sessions longer than one minute within the range, sorted high to low', () => {
    const records = [
      record('a', now - DAY_MS, MIN_COUNTED_PLAY_DURATION_MS + 1),
      record('a', now - DAY_MS, MIN_COUNTED_PLAY_DURATION_MS + 1),
      record('b', now - DAY_MS, MIN_COUNTED_PLAY_DURATION_MS + 1),
      record('c', now - DAY_MS, MIN_COUNTED_PLAY_DURATION_MS),
      record('d', now - DAY_MS, 1_000),
    ];

    expect(aggregatePlayCounts(records, { now, rangeDays: 3 })).toEqual([
      { trackId: 'a', playCount: 2 },
      { trackId: 'b', playCount: 1 },
    ]);
  });

  it('excludes sessions that started before the selected range', () => {
    const records = [
      record('old', now - 8 * DAY_MS, MIN_COUNTED_PLAY_DURATION_MS + 1),
      record('recent', now - 2 * DAY_MS, MIN_COUNTED_PLAY_DURATION_MS + 1),
    ];

    expect(aggregatePlayCounts(records, { now, rangeDays: 7 })).toEqual([
      { trackId: 'recent', playCount: 1 },
    ]);
  });

  it('supports a 30-day window', () => {
    const records = [
      record('inside', now - 29 * DAY_MS, MIN_COUNTED_PLAY_DURATION_MS + 1),
      record('outside', now - 31 * DAY_MS, MIN_COUNTED_PLAY_DURATION_MS + 1),
    ];

    expect(aggregatePlayCounts(records, { now, rangeDays: 30 })).toEqual([
      { trackId: 'inside', playCount: 1 },
    ]);
  });
});

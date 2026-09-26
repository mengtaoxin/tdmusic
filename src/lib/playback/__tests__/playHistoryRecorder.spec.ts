import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPlayHistoryRecorder } from '../playHistoryRecorder';

describe('createPlayHistoryRecorder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves a session from play start until pause, including sub-minute plays', () => {
    const saveRecord =
      vi.fn<(record: { trackId: string; startedAt: number; endedAt: number }) => Promise<void>>();
    saveRecord.mockResolvedValue(undefined);
    const recorder = createPlayHistoryRecorder({ saveRecord });

    recorder.onPlay('song-a');
    vi.advanceTimersByTime(1_000);
    recorder.onStop();

    expect(saveRecord).toHaveBeenCalledExactlyOnceWith({
      trackId: 'song-a',
      startedAt: Date.parse('2024-01-15T12:00:00.000Z'),
      endedAt: Date.parse('2024-01-15T12:00:01.000Z'),
    });
  });

  it('ends the open session when the track switches before a new play', () => {
    const saveRecord =
      vi.fn<(record: { trackId: string; startedAt: number; endedAt: number }) => Promise<void>>();
    saveRecord.mockResolvedValue(undefined);
    const recorder = createPlayHistoryRecorder({ saveRecord });

    recorder.onPlay('song-a');
    vi.advanceTimersByTime(5_000);
    recorder.onStop();
    recorder.onPlay('song-b');
    vi.advanceTimersByTime(2_000);
    recorder.onStop();

    expect(saveRecord).toHaveBeenNthCalledWith(1, {
      trackId: 'song-a',
      startedAt: Date.parse('2024-01-15T12:00:00.000Z'),
      endedAt: Date.parse('2024-01-15T12:00:05.000Z'),
    });
    expect(saveRecord).toHaveBeenNthCalledWith(2, {
      trackId: 'song-b',
      startedAt: Date.parse('2024-01-15T12:00:05.000Z'),
      endedAt: Date.parse('2024-01-15T12:00:07.000Z'),
    });
  });

  it('ignores stop when no session is open and does not double-save', () => {
    const saveRecord =
      vi.fn<(record: { trackId: string; startedAt: number; endedAt: number }) => Promise<void>>();
    saveRecord.mockResolvedValue(undefined);
    const recorder = createPlayHistoryRecorder({ saveRecord });

    recorder.onStop();
    recorder.onPlay('song-a');
    vi.advanceTimersByTime(500);
    recorder.onStop();
    recorder.onStop();

    expect(saveRecord).toHaveBeenCalledOnce();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { PLAYER_STORAGE_KEY, serializePlayerState } from '../playerStateCodec';
import { createPlayerPersist } from '../playerPersist';

describe('createPlayerPersist', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedulePersist writes after the debounce delay', () => {
    vi.useFakeTimers();
    const setItem = vi.fn<(key: string, value: string) => void>();
    const persist = createPlayerPersist({
      getPayload: () => ({
        queue: ['a'],
        originalQueue: ['a'],
        currentId: 'a',
        currentIndex: 0,
        currentTime: 12,
        repeatMode: 'off',
        shuffle: false,
      }),
      setItem,
    });

    persist.schedulePersist();
    expect(setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(setItem).toHaveBeenCalledWith(
      PLAYER_STORAGE_KEY,
      serializePlayerState({
        queue: ['a'],
        originalQueue: ['a'],
        currentId: 'a',
        currentIndex: 0,
        currentTime: 12,
        repeatMode: 'off',
        shuffle: false,
      }),
    );
  });

  it('flushPersist writes immediately and cancels a pending debounce', () => {
    vi.useFakeTimers();
    const setItem = vi.fn<(key: string, value: string) => void>();
    const persist = createPlayerPersist({
      getPayload: () => ({
        queue: [],
        originalQueue: [],
        currentId: null,
        currentIndex: -1,
        currentTime: 0,
        repeatMode: 'off',
        shuffle: false,
      }),
      setItem,
    });

    persist.schedulePersist();
    persist.flushPersist();
    expect(setItem).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(400);
    expect(setItem).toHaveBeenCalledOnce();
  });
});

import { describe, expect, it, vi } from 'vitest';

import {
  createPlaybackSession,
  formatDownloadFailureLog,
  type PlaybackAudioElement,
} from '@/lib/playback/playbackSession';

type TestAudio = PlaybackAudioElement & { emit: (type: string) => void };

function makeAudio(): TestAudio {
  const listeners = new Map<string, Set<() => void>>();
  return {
    src: '',
    currentTime: 0,
    duration: 0,
    loop: false,
    ended: false,
    error: null,
    load: vi.fn<() => void>(),
    play: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    pause: vi.fn<() => void>(),
    addEventListener: (type: string, handler: EventListener) => {
      const set = listeners.get(type) ?? new Set();
      set.add(handler as () => void);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, handler: EventListener) => {
      listeners.get(type)?.delete(handler as () => void);
    },
    emit(type: string) {
      for (const handler of listeners.get(type) ?? []) handler();
    },
  };
}

describe('playbackSession', () => {
  it('formatDownloadFailureLog includes track id, path, and error detail', () => {
    const message = formatDownloadFailureLog(
      { id: 'bad', path: 'https://example.com/bad.mp3' },
      new Error('downloadFailed:404'),
    );
    expect(message).toContain('bad');
    expect(message).toContain('https://example.com/bad.mp3');
    expect(message).toMatch(/downloadFailed:404/);
  });

  it('loadCurrent resolves URL, sets audio src, enriches, and prefetches', async () => {
    const audio = makeAudio();
    const resolvePlayableUrl = vi
      .fn<(path: string, id: string) => Promise<string>>()
      .mockResolvedValue('blob:good');
    const scheduleEnrichTrack = vi.fn<(id: string) => void>();
    const schedulePrefetch = vi.fn<() => void>();
    const appendAppLog = vi.fn<(message: string) => void>();
    const onTrackResolved = vi.fn<(id: string) => void>();
    const skip = vi.fn<() => void>();
    const pause = vi.fn<() => void>();
    let seekTo: number | null = 12;
    const pendingPlay = true;

    const session = createPlaybackSession(
      () => audio,
      {
        getCurrentId: () => 't1',
        getQueueLength: () => 1,
        getSeekTo: () => seekTo,
        getPendingPlay: () => pendingPlay,
        clearSeekTo: () => {
          seekTo = null;
        },
        pause,
        skip,
        getTrack: (id) =>
          id === 't1'
            ? { id: 't1', path: 'https://example.com/t1.mp3', volumeRatio: 100 }
            : undefined,
      },
      {
        resolvePlayableUrl,
        appendAppLog,
        scheduleEnrichTrack,
        schedulePrefetch,
        onTrackResolved,
        setVolumeRatio: vi.fn<(percent: number) => void>(),
      },
    );

    await session.loadCurrent();
    expect(resolvePlayableUrl).toHaveBeenCalledWith('https://example.com/t1.mp3', 't1');
    expect(onTrackResolved).toHaveBeenCalledWith('t1');
    expect(audio.src).toBe('blob:good');
    expect(audio.load).toHaveBeenCalledOnce();
    expect(scheduleEnrichTrack).toHaveBeenCalledWith('t1');
    expect(schedulePrefetch).not.toHaveBeenCalled();
    expect(skip).not.toHaveBeenCalled();
    expect(appendAppLog).not.toHaveBeenCalled();

    audio.emit('loadedmetadata');
    expect(schedulePrefetch).toHaveBeenCalledOnce();
    expect(audio.currentTime).toBe(12);
    expect(seekTo).toBeNull();
    expect(audio.play).toHaveBeenCalledOnce();
  });

  it('loadCurrent skips on download failure and pauses after a full queue of failures', async () => {
    const audio = makeAudio();
    const resolvePlayableUrl = vi
      .fn<(path: string, id: string) => Promise<string>>()
      .mockRejectedValue(new Error('boom'));
    const appendAppLog = vi.fn<(message: string) => void>();
    const skip = vi.fn<() => void>();
    const pause = vi.fn<() => void>();
    let currentId: string | null = 'a';

    const session = createPlaybackSession(
      () => audio,
      {
        getCurrentId: () => currentId,
        getQueueLength: () => 2,
        getSeekTo: () => null,
        getPendingPlay: () => true,
        clearSeekTo: () => {},
        pause,
        skip: () => {
          skip();
          currentId = 'b';
        },
        getTrack: (id) => ({ id, path: `https://example.com/${id}.mp3`, volumeRatio: 100 }),
      },
      {
        resolvePlayableUrl,
        appendAppLog,
        scheduleEnrichTrack: vi.fn<(id: string) => void>(),
        setVolumeRatio: vi.fn<(percent: number) => void>(),
        schedulePrefetch: vi.fn<() => void>(),
      },
    );

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await session.loadCurrent();
    expect(appendAppLog).toHaveBeenCalledExactlyOnceWith(
      'Failed to download track "a" from https://example.com/a.mp3: boom',
    );
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to download track "a" from https://example.com/a.mp3: boom',
    );
    expect(skip).toHaveBeenCalledOnce();
    expect(pause).not.toHaveBeenCalled();

    await session.loadCurrent();
    expect(appendAppLog).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledTimes(2);
    expect(skip).toHaveBeenCalledOnce();
    expect(pause).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('prints play() rejection to the console and does not write an app log', async () => {
    const audio = makeAudio();
    const playError = new Error('NotAllowedError');
    vi.mocked(audio.play).mockRejectedValueOnce(playError);
    const appendAppLog = vi.fn<(message: string) => void>();
    const pause = vi.fn<() => void>();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const session = createPlaybackSession(
      () => audio,
      {
        getCurrentId: () => 't1',
        getQueueLength: () => 1,
        getSeekTo: () => null,
        getPendingPlay: () => true,
        clearSeekTo: () => {},
        pause,
        skip: vi.fn<() => void>(),
        getTrack: (id) => ({ id, path: `https://example.com/${id}.mp3`, volumeRatio: 100 }),
      },
      {
        resolvePlayableUrl: async () => 'blob:t1',
        appendAppLog,
        scheduleEnrichTrack: vi.fn<(id: string) => void>(),
        setVolumeRatio: vi.fn<(percent: number) => void>(),
        schedulePrefetch: vi.fn<() => void>(),
      },
    );

    await session.loadCurrent();
    audio.emit('loadedmetadata');
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(playError);
    expect(pause).toHaveBeenCalledOnce();
    expect(appendAppLog).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('pauses the previous src before waiting for the next playable URL', async () => {
    const audio = makeAudio();
    audio.src = 'blob:old';
    let release: ((url: string) => void) | null = null;
    const resolvePlayableUrl = vi
      .fn<(path: string, id: string) => Promise<string>>()
      .mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            release = resolve;
          }),
      );
    const onLoadStart = vi.fn<(id: string) => void>();
    const session = createPlaybackSession(
      () => audio,
      {
        getCurrentId: () => 't2',
        getQueueLength: () => 2,
        getSeekTo: () => null,
        getPendingPlay: () => true,
        clearSeekTo: () => {},
        pause: vi.fn<() => void>(),
        skip: vi.fn<() => void>(),
        getTrack: (id) => ({ id, path: `https://example.com/${id}.mp3`, volumeRatio: 100 }),
      },
      {
        resolvePlayableUrl,
        appendAppLog: vi.fn<(message: string) => void>(),
        scheduleEnrichTrack: vi.fn<(id: string) => void>(),
        setVolumeRatio: vi.fn<(percent: number) => void>(),
        schedulePrefetch: vi.fn<() => void>(),
        onLoadStart,
      },
    );

    const loading = session.loadCurrent();
    expect(onLoadStart).toHaveBeenCalledWith('t2');
    expect(audio.pause).toHaveBeenCalledOnce();
    expect(audio.src).toBe('blob:old');

    expect(release).not.toBeNull();
    release!('blob:t2');
    await loading;
    expect(audio.src).toBe('blob:t2');
  });

  it('ignores a stale loadedmetadata after a newer loadCurrent started', async () => {
    const audio = makeAudio();
    let currentId = 't1';
    let seekTo: number | null = 40;
    const resolvers = new Map<string, (url: string) => void>();
    const resolvePlayableUrl = vi
      .fn<(path: string, id: string) => Promise<string>>()
      .mockImplementation((_path, id) => {
        if (id === 't1') return Promise.resolve('blob:t1');
        return new Promise<string>((resolve) => {
          resolvers.set(id, resolve);
        });
      });
    const schedulePrefetch = vi.fn<() => void>();
    const session = createPlaybackSession(
      () => audio,
      {
        getCurrentId: () => currentId,
        getQueueLength: () => 2,
        getSeekTo: () => seekTo,
        getPendingPlay: () => true,
        clearSeekTo: () => {
          seekTo = null;
        },
        pause: vi.fn<() => void>(),
        skip: vi.fn<() => void>(),
        getTrack: (id) => ({ id, path: `https://example.com/${id}.mp3`, volumeRatio: 100 }),
      },
      {
        resolvePlayableUrl,
        appendAppLog: vi.fn<(message: string) => void>(),
        scheduleEnrichTrack: vi.fn<(id: string) => void>(),
        setVolumeRatio: vi.fn<(percent: number) => void>(),
        schedulePrefetch,
      },
    );

    await session.loadCurrent();
    expect(audio.src).toBe('blob:t1');

    currentId = 't2';
    seekTo = 0;
    const loadT2 = session.loadCurrent();
    (audio.play as ReturnType<typeof vi.fn>).mockClear();

    audio.emit('loadedmetadata');
    expect(audio.play).not.toHaveBeenCalled();
    expect(audio.currentTime).toBe(0);
    expect(schedulePrefetch).not.toHaveBeenCalled();

    resolvers.get('t2')!('blob:t2');
    await loadT2;
    audio.emit('loadedmetadata');
    expect(audio.src).toBe('blob:t2');
    expect(audio.play).toHaveBeenCalledOnce();
    expect(schedulePrefetch).toHaveBeenCalledOnce();
  });

  it('loadCurrent applies setVolumeRatio before assigning audio src', async () => {
    const audio = makeAudio();
    const setVolumeRatio = vi.fn<(percent: number) => void>();
    const resolvePlayableUrl = vi
      .fn<(path: string, id: string) => Promise<string>>()
      .mockResolvedValue('blob:good');
    let currentId: string | null = 'quiet';

    const session = createPlaybackSession(
      () => audio,
      {
        getCurrentId: () => currentId,
        getQueueLength: () => 2,
        getSeekTo: () => null,
        getPendingPlay: () => false,
        clearSeekTo: () => {},
        pause: vi.fn<() => void>(),
        skip: vi.fn<() => void>(),
        getTrack: (id) => {
          if (id === 'quiet') return { id: 'quiet', path: '/quiet.mp3', volumeRatio: 50 };
          if (id === 'full') return { id: 'full', path: '/full.mp3', volumeRatio: 100 };
          return undefined;
        },
      },
      {
        resolvePlayableUrl,
        appendAppLog: vi.fn<(message: string) => void>(),
        scheduleEnrichTrack: vi.fn<(id: string) => void>(),
        schedulePrefetch: vi.fn<() => void>(),
        setVolumeRatio,
      },
    );

    await session.loadCurrent();
    expect(setVolumeRatio).toHaveBeenCalledWith(50);
    expect(audio.src).toBe('blob:good');

    currentId = 'full';
    await session.loadCurrent();
    expect(setVolumeRatio).toHaveBeenLastCalledWith(100);
    expect(setVolumeRatio).toHaveBeenCalledTimes(2);
  });
});

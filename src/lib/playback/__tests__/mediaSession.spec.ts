import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { syncMediaSession } from '@/lib/playback/mediaSession';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';

function makeTrack(overrides: Partial<DisplayTrack> = {}): DisplayTrack {
  return {
    id: 't1',
    path: '/music/t1.mp3',
    volumeRatio: 100,
    displayTitle: 'Song One',
    displayArtist: 'Artist One',
    displayAlbum: 'Album One',
    displayCover: 'blob:cover',
    ...overrides,
  };
}

function makePlayer(
  overrides: Partial<{
    play: () => void;
    pause: () => void;
    prev: () => void;
    next: () => void;
    seek: (time: number) => void;
    playing: boolean;
    duration: number;
    currentTime: number;
  }> = {},
) {
  return {
    play: vi.fn<() => void>(),
    pause: vi.fn<() => void>(),
    prev: vi.fn<() => void>(),
    next: vi.fn<() => void>(),
    seek: vi.fn<(time: number) => void>(),
    playing: true,
    duration: 120,
    currentTime: 30,
    ...overrides,
  };
}

describe('syncMediaSession', () => {
  let setPositionState: ReturnType<typeof vi.fn<(state?: MediaPositionState) => void>>;
  let setActionHandler: ReturnType<
    typeof vi.fn<(action: MediaSessionAction, handler: MediaSessionActionHandler | null) => void>
  >;

  beforeEach(() => {
    setPositionState = vi.fn<(state?: MediaPositionState) => void>();
    setActionHandler =
      vi.fn<(action: MediaSessionAction, handler: MediaSessionActionHandler | null) => void>();
    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: {
        metadata: null,
        playbackState: 'none',
        setActionHandler,
        setPositionState,
      },
    });
    vi.stubGlobal(
      'MediaMetadata',
      class {
        title: string;
        artist: string;
        album: string;
        artwork: MediaImage[];
        constructor(init: MediaMetadataInit) {
          this.title = init.title ?? '';
          this.artist = init.artist ?? '';
          this.album = init.album ?? '';
          this.artwork = init.artwork ?? [];
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (navigator as any).mediaSession;
  });

  it('sets position state from player duration and currentTime', () => {
    syncMediaSession(makeTrack(), makePlayer({ duration: 200, currentTime: 45 }));

    expect(setPositionState).toHaveBeenCalledWith({
      duration: 200,
      playbackRate: 1,
      position: 45,
    });
  });

  it('clamps position to duration', () => {
    syncMediaSession(makeTrack(), makePlayer({ duration: 100, currentTime: 150 }));

    expect(setPositionState).toHaveBeenCalledWith({
      duration: 100,
      playbackRate: 1,
      position: 100,
    });
  });

  it('does not set position state when duration is invalid', () => {
    syncMediaSession(makeTrack(), makePlayer({ duration: 0, currentTime: 10 }));
    expect(setPositionState).not.toHaveBeenCalled();

    setPositionState.mockClear();
    syncMediaSession(makeTrack(), makePlayer({ duration: Number.NaN, currentTime: 10 }));
    expect(setPositionState).not.toHaveBeenCalled();
  });

  it('does not set position state when there is no track', () => {
    syncMediaSession(undefined, makePlayer());
    expect(setPositionState).not.toHaveBeenCalled();
  });

  it('binds prev/next track and clears seek ±N so lock screen shows track skip', () => {
    const player = makePlayer();
    syncMediaSession(makeTrack(), player);

    expect(setActionHandler).toHaveBeenCalledWith('previoustrack', expect.any(Function));
    expect(setActionHandler).toHaveBeenCalledWith('nexttrack', expect.any(Function));
    expect(setActionHandler).toHaveBeenCalledWith('seekbackward', null);
    expect(setActionHandler).toHaveBeenCalledWith('seekforward', null);

    const prevHandler = setActionHandler.mock.calls.find((c) => c[0] === 'previoustrack')?.[1] as
      | (() => void)
      | undefined;
    const nextHandler = setActionHandler.mock.calls.find((c) => c[0] === 'nexttrack')?.[1] as
      | (() => void)
      | undefined;
    prevHandler?.();
    nextHandler?.();
    expect(player.prev).toHaveBeenCalledOnce();
    expect(player.next).toHaveBeenCalledOnce();
    expect(player.seek).not.toHaveBeenCalled();
  });
});

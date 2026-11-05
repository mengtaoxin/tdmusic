import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { beginQuickPlay } from '@/lib/routes/beginQuickPlay';
import { useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

function track(id: string): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    volumeRatio: 100,
    displayTitle: id,
    displayArtist: 'Artist',
    displayAlbum: 'Album',
  };
}

describe('beginQuickPlay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts playback for a known track or playlist', () => {
    useCatalogStore.getState().setTracks([track('a'), track('b')]);
    useCatalogStore.setState({
      playlists: [{ id: 'evening', trackIds: ['b', 'a'] }],
    });
    const playFrom = vi.spyOn(usePlayerStore.getState(), 'playFrom');

    expect(beginQuickPlay({ type: 'trick', id: 'a' })).toEqual({
      kind: 'play',
      sourceIds: ['a'],
    });
    expect(playFrom).toHaveBeenCalledWith(0, ['a'], { shuffle: false });

    playFrom.mockClear();
    expect(beginQuickPlay({ type: 'playlist', id: 'evening' })).toEqual({
      kind: 'play',
      sourceIds: ['b', 'a'],
    });
    expect(playFrom).toHaveBeenCalledWith(0, ['b', 'a'], { shuffle: false });
  });

  it('resumes the current queue from its saved progress', () => {
    useCatalogStore.getState().setTracks([track('a'), track('b')]);
    useCatalogStore.setState({
      playlists: [{ id: 'now-playing', trackIds: ['b'] }],
    });
    usePlayerStore.setState({
      queue: ['b', 'a'],
      originalQueue: ['b', 'a'],
      currentId: 'a',
      currentIndex: 1,
      currentTime: 42,
      seekTo: 42,
      shuffle: true,
      pendingPlay: false,
      playing: false,
    });
    const playFrom = vi.spyOn(usePlayerStore.getState(), 'playFrom');

    expect(beginQuickPlay({ type: 'playlist', id: 'now-playing' })).toEqual({ kind: 'resume' });

    expect(playFrom).not.toHaveBeenCalled();
    expect(usePlayerStore.getState()).toMatchObject({
      queue: ['b', 'a'],
      currentId: 'a',
      currentIndex: 1,
      currentTime: 42,
      seekTo: 42,
      shuffle: true,
      pendingPlay: true,
      playing: true,
    });
  });

  it('does not start playback when nothing is queued', () => {
    usePlayerStore.setState({ queue: [], currentId: null, currentTime: 12, pendingPlay: false });
    const playFrom = vi.spyOn(usePlayerStore.getState(), 'playFrom');

    expect(beginQuickPlay({ type: 'playlist', id: 'now-playing' })).toEqual({ kind: 'idle' });

    expect(playFrom).not.toHaveBeenCalled();
    expect(usePlayerStore.getState().pendingPlay).toBe(false);
    expect(usePlayerStore.getState().currentTime).toBe(12);
  });

  it('does not touch the player when the link cannot play', () => {
    const playFrom = vi.spyOn(usePlayerStore.getState(), 'playFrom');
    expect(beginQuickPlay({ type: 'track', id: 'missing' })).toEqual({
      kind: 'not-found',
      target: 'track',
    });
    expect(playFrom).not.toHaveBeenCalled();
  });
});

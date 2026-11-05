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

  it('does not touch the player when the link cannot play', () => {
    const playFrom = vi.spyOn(usePlayerStore.getState(), 'playFrom');
    expect(beginQuickPlay({ type: 'track', id: 'missing' })).toEqual({
      kind: 'not-found',
      target: 'track',
    });
    expect(playFrom).not.toHaveBeenCalled();
  });
});

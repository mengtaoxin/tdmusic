import { describe, expect, it } from 'vitest';

import type { NormalizedPlaylist } from '../../catalog/normalizeCatalog';
import { planQuickPlay, type QuickPlayCatalog } from '../quickPlay';

const playlists: NormalizedPlaylist[] = [
  { id: 'evening', title: 'Evening', trackIds: ['a', 'missing', 'b', 'a'] },
  { id: 'empty-list', trackIds: ['gone'] },
];

function catalog(): QuickPlayCatalog {
  return {
    trackIds: new Set(['a', 'b']),
    playlists,
  };
}

describe('planQuickPlay', () => {
  it('plays one known track from type track or trick', () => {
    expect(planQuickPlay({ type: 'track', id: 'a' }, catalog())).toEqual({
      kind: 'play',
      sourceIds: ['a'],
    });
    expect(planQuickPlay({ type: 'trick', id: ' b ' }, catalog())).toEqual({
      kind: 'play',
      sourceIds: ['b'],
    });
    expect(planQuickPlay({ type: 'TRACK', id: 'a' }, catalog())).toEqual({
      kind: 'play',
      sourceIds: ['a'],
    });
  });

  it('plays a playlist in listed order, skipping ids that are not in the catalog', () => {
    expect(planQuickPlay({ type: 'playlist', id: 'evening' }, catalog())).toEqual({
      kind: 'play',
      sourceIds: ['a', 'b', 'a'],
    });
  });

  it('resumes the current queue when the playlist id is now-playing', () => {
    const withSameId: QuickPlayCatalog = {
      ...catalog(),
      playlists: [...playlists, { id: 'now-playing', trackIds: ['b'] }],
    };
    const session = { queue: ['b', 'a'], currentId: 'a' };

    expect(planQuickPlay({ type: 'playlist', id: 'now-playing' }, withSameId, session)).toEqual({
      kind: 'resume',
    });
    expect(planQuickPlay({ type: ' Playlist ', id: ' Now-Playing ' }, catalog(), session)).toEqual({
      kind: 'resume',
    });
    expect(
      planQuickPlay({ type: 'playlist', id: 'now-playing' }, catalog(), {
        queue: [],
        currentId: null,
      }),
    ).toEqual({ kind: 'idle' });
    expect(
      planQuickPlay({ type: 'playlist', id: 'now-playing' }, catalog(), {
        queue: ['a'],
        currentId: null,
      }),
    ).toEqual({ kind: 'idle' });
  });

  it('does not play when the type or id cannot be resolved', () => {
    expect(planQuickPlay({ type: 'album', id: 'a' }, catalog())).toEqual({ kind: 'invalid' });
    expect(planQuickPlay({ type: 'track', id: '  ' }, catalog())).toEqual({ kind: 'invalid' });
    expect(planQuickPlay({ type: 'track', id: 'nope' }, catalog())).toEqual({
      kind: 'not-found',
      target: 'track',
    });
    expect(planQuickPlay({ type: 'playlist', id: 'missing' }, catalog())).toEqual({
      kind: 'not-found',
      target: 'playlist',
    });
    expect(planQuickPlay({ type: 'playlist', id: 'empty-list' }, catalog())).toEqual({
      kind: 'empty',
    });
  });
});

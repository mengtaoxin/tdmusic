import { defaultParseSearch } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import type { NormalizedPlaylist } from '../../catalog/normalizeCatalog';
import { parseQuickPlaySearch, planQuickPlay, type QuickPlayCatalog } from '../quickPlay';

const playlists: NormalizedPlaylist[] = [
  { id: 'evening', title: 'Evening', trackIds: ['a', 'missing', 'b', 'a'] },
  { id: 'empty-list', trackIds: ['gone'] },
];

function catalog(orderedTrackIds: readonly string[] = ['a', 'b']): QuickPlayCatalog {
  return {
    trackIds: new Set(orderedTrackIds),
    orderedTrackIds,
    playlists,
  };
}

describe('parseQuickPlaySearch', () => {
  it('keeps a numeric catalog id after the router JSON-parses the query', () => {
    expect(parseQuickPlaySearch(defaultParseSearch('?type=song&id=1332'))).toEqual({
      type: 'song',
      id: '1332',
    });
    expect(parseQuickPlaySearch(defaultParseSearch('?type=playlist&id=7'))).toEqual({
      type: 'playlist',
      id: '7',
    });
  });
});

describe('planQuickPlay', () => {
  it('plays one known track from type song, or legacy track/trick', () => {
    expect(planQuickPlay({ type: 'song', id: 'a' }, catalog())).toEqual({
      kind: 'play',
      sourceIds: ['a'],
    });
    expect(planQuickPlay({ type: 'track', id: 'a' }, catalog())).toEqual({
      kind: 'play',
      sourceIds: ['a'],
    });
    expect(planQuickPlay({ type: 'trick', id: ' b ' }, catalog())).toEqual({
      kind: 'play',
      sourceIds: ['b'],
    });
    expect(planQuickPlay({ type: 'SONG', id: 'a' }, catalog())).toEqual({
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

  it('plays every catalog track in listed order when the playlist id is all-tricks', () => {
    const withSameId: QuickPlayCatalog = {
      ...catalog(),
      playlists: [...playlists, { id: 'all-tricks', trackIds: ['b'] }],
    };

    expect(planQuickPlay({ type: 'playlist', id: 'all-tricks' }, withSameId)).toEqual({
      kind: 'play',
      sourceIds: ['a', 'b'],
    });
    expect(planQuickPlay({ type: 'playlist', id: ' All-Tricks ' }, catalog(['b', 'a']))).toEqual({
      kind: 'play',
      sourceIds: ['b', 'a'],
    });
    expect(planQuickPlay({ type: 'playlist', id: 'all-tricks' }, catalog([]))).toEqual({
      kind: 'empty',
    });
  });

  it('does not play when the type or id cannot be resolved', () => {
    expect(planQuickPlay({ type: 'album', id: 'a' }, catalog())).toEqual({ kind: 'invalid' });
    expect(planQuickPlay({ type: 'song', id: '  ' }, catalog())).toEqual({ kind: 'invalid' });
    expect(planQuickPlay({ type: 'song', id: 'nope' }, catalog())).toEqual({
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

import { describe, expect, it } from 'vitest';

import { findPlaylistByName, playlistPath } from '../playlistRoutes';
import type { NormalizedPlaylist } from '../../catalog/normalizeCatalog';

const playlists: NormalizedPlaylist[] = [
  { title: 'My Playlist1', trackIds: ['a'] },
  { title: 'Favorites', trackIds: ['b'] },
];

describe('playlistPath', () => {
  it('builds an encoded playlist detail path from the title', () => {
    expect(playlistPath('My Playlist1')).toBe('/playlists/My%20Playlist1');
  });
});

describe('findPlaylistByName', () => {
  it('finds a playlist by decoded route name', () => {
    expect(findPlaylistByName(playlists, 'My%20Playlist1')).toEqual(playlists[0]);
    expect(findPlaylistByName(playlists, 'Favorites')).toEqual(playlists[1]);
  });

  it('returns undefined when no playlist matches', () => {
    expect(findPlaylistByName(playlists, 'Missing')).toBeUndefined();
  });
});

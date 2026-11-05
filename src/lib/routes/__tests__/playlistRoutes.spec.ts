import { describe, expect, it } from 'vitest';

import { findPlaylistById, playlistLabel, playlistPath } from '../playlistRoutes';
import type { NormalizedPlaylist } from '../../catalog/normalizeCatalog';

const playlists: NormalizedPlaylist[] = [
  { id: 'my playlist 1', title: 'My Playlist1', trackIds: ['a'] },
  { id: 'favorites', trackIds: ['b'] },
];

describe('playlistPath', () => {
  it('builds an encoded playlist detail path from the id', () => {
    expect(playlistPath('my playlist 1')).toBe('/playlists/my%20playlist%201');
  });
});

describe('findPlaylistById', () => {
  it('finds a playlist by decoded route id', () => {
    expect(findPlaylistById(playlists, 'my%20playlist%201')).toEqual(playlists[0]);
    expect(findPlaylistById(playlists, 'favorites')).toEqual(playlists[1]);
  });

  it('returns undefined when no playlist matches', () => {
    expect(findPlaylistById(playlists, 'Missing')).toBeUndefined();
  });
});

describe('playlistLabel', () => {
  it('uses the title when set and the id otherwise', () => {
    expect(playlistLabel(playlists[0]!)).toBe('My Playlist1');
    expect(playlistLabel(playlists[1]!)).toBe('favorites');
  });
});

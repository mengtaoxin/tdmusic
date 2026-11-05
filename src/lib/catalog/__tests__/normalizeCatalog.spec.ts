import { describe, expect, it } from 'vitest';

import {
  normalizeConfigs,
  normalizePlaylist,
  normalizePlaylists,
  normalizeSongs,
} from '../normalizeCatalog';

describe('normalizeSongs', () => {
  it('keeps entries with id and path', () => {
    const { tracks, errors } = normalizeSongs([
      { id: 'a', path: '/a.mp3', title: 'A' },
      { id: 'b', path: 'https://ex.com/b.mp3' },
    ]);
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toMatchObject({ id: 'a', path: '/a.mp3', title: 'A' });
    expect(errors).toEqual([]);
  });

  it('drops entries missing id or path and records errors', () => {
    const { tracks, errors } = normalizeSongs([
      { path: '/a.mp3' },
      { id: 'b' },
      { id: 'c', path: '/c.mp3' },
    ]);
    expect(tracks.map((t) => t.id)).toEqual(['c']);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/missing id/i);
    expect(errors[1]).toMatch(/missing path/i);
  });

  it('drops duplicate ids and records errors', () => {
    const { tracks, errors } = normalizeSongs([
      { id: 'dup', path: '/1.mp3' },
      { id: 'dup', path: '/2.mp3' },
    ]);
    expect(tracks).toHaveLength(1);
    expect(tracks[0]!.path).toBe('/1.mp3');
    expect(errors[0]).toMatch(/id already exists/i);
  });

  it('defaults volumeRatio to 100 when volume-ratio is missing', () => {
    const { tracks } = normalizeSongs([{ id: 'a', path: '/a.mp3' }]);
    expect(tracks[0]!.volumeRatio).toBe(100);
  });

  it('keeps valid volume-ratio percentages in [0, 100]', () => {
    const { tracks } = normalizeSongs([
      { id: 'quiet', path: '/q.mp3', 'volume-ratio': 50 },
      { id: 'unity', path: '/u.mp3', 'volume-ratio': 100 },
      { id: 'zero', path: '/z.mp3', 'volume-ratio': 0 },
    ]);
    expect(tracks.map((t) => t.volumeRatio)).toEqual([50, 100, 0]);
  });

  it('clamps volume-ratio above 100 down to 100', () => {
    const { tracks } = normalizeSongs([
      { id: 'a', path: '/a.mp3', 'volume-ratio': 101 },
      { id: 'b', path: '/b.mp3', 'volume-ratio': 150 },
      { id: 'c', path: '/c.mp3', 'volume-ratio': 500 },
    ]);
    expect(tracks.map((t) => t.volumeRatio)).toEqual([100, 100, 100]);
  });

  it('defaults volumeRatio to 100 for invalid volume-ratio values', () => {
    const { tracks } = normalizeSongs([
      { id: 'a', path: '/a.mp3', 'volume-ratio': -1 },
      { id: 'b', path: '/b.mp3', 'volume-ratio': Number.NaN },
      { id: 'c', path: '/c.mp3', 'volume-ratio': Number.POSITIVE_INFINITY },
      { id: 'd', path: '/d.mp3', 'volume-ratio': '80' },
      { id: 'e', path: '/e.mp3', 'volume-ratio': null },
    ]);
    expect(tracks.map((t) => t.volumeRatio)).toEqual([100, 100, 100, 100, 100]);
  });
});

describe('normalizePlaylist', () => {
  const tracks = [
    { id: 'a', path: '/a.mp3', volumeRatio: 100 },
    { id: 'b', path: '/b.mp3', volumeRatio: 100 },
  ];

  it('resolves playlist entries to known track ids', () => {
    const playlist = normalizePlaylist(
      { id: 'mine', title: 'Mine', songs: [{ id: 'a' }, { id: 'missing' }, { id: 'b' }] },
      tracks,
    );
    expect(playlist).toEqual({ id: 'mine', title: 'Mine', trackIds: ['a', 'b'] });
  });

  it('keeps a playlist when title is omitted', () => {
    const playlist = normalizePlaylist({ id: 'mine', songs: [{ id: 'a' }] }, tracks);
    expect(playlist).toEqual({ id: 'mine', trackIds: ['a'] });
  });

  it('drops a playlist that has no id', () => {
    expect(normalizePlaylist({ title: 'Mine', songs: [{ id: 'a' }] }, tracks)).toBeNull();
  });
});

describe('normalizePlaylists', () => {
  const tracks = [
    { id: 'a', path: '/a.mp3', volumeRatio: 100 },
    { id: 'b', path: '/b.mp3', volumeRatio: 100 },
    { id: 'c', path: '/c.mp3', volumeRatio: 100 },
  ];

  it('normalizes multiple playlists from playlists array', () => {
    const { playlists, errors } = normalizePlaylists(
      [
        { id: 'pl-1', title: 'My Playlist1', songs: [{ id: 'a' }, { id: 'b' }] },
        { id: 'pl-2', title: 'My Playlist2', songs: [{ id: 'c' }, { id: 'missing' }] },
      ],
      tracks,
    );
    expect(playlists).toEqual([
      { id: 'pl-1', title: 'My Playlist1', trackIds: ['a', 'b'] },
      { id: 'pl-2', title: 'My Playlist2', trackIds: ['c'] },
    ]);
    expect(errors).toEqual([]);
  });

  it('drops playlists missing id or with a duplicate id and records errors', () => {
    const { playlists, errors } = normalizePlaylists(
      [
        { title: 'No Id', songs: [{ id: 'a' }] },
        { id: 'keep', title: 'Keep', songs: [{ id: 'a' }] },
        { id: 'keep', title: 'Dup', songs: [{ id: 'b' }] },
      ],
      tracks,
    );
    expect(playlists).toEqual([{ id: 'keep', title: 'Keep', trackIds: ['a'] }]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/missing id/i);
    expect(errors[1]).toMatch(/id already exists/i);
  });
});

describe('normalizeConfigs', () => {
  it('reads playlists array from configs', () => {
    const { playlists } = normalizeConfigs({
      songs: [
        { id: 'sample-1', path: '/sample-1.mp3' },
        { id: '9277', path: '/9277.mp3' },
      ],
      playlists: [
        {
          id: 'my-playlist-1',
          title: 'My Playlist1',
          songs: [{ id: 'sample-1' }, { id: '9277' }],
        },
      ],
    });
    expect(playlists).toEqual([
      { id: 'my-playlist-1', title: 'My Playlist1', trackIds: ['sample-1', '9277'] },
    ]);
  });

  it('records playlist id errors alongside song errors', () => {
    const { playlists, errors } = normalizeConfigs({
      songs: [{ id: 'sample-1', path: '/sample-1.mp3' }],
      playlists: [{ title: 'No Id', songs: [{ id: 'sample-1' }] }],
    });
    expect(playlists).toEqual([]);
    expect(errors.some((error) => /missing id/i.test(error))).toBe(true);
  });

  it('ignores legacy singular playlist', () => {
    const { playlists } = normalizeConfigs({
      songs: [{ id: 'sample-1', path: '/sample-1.mp3' }],
      playlist: {
        title: 'Legacy',
        songs: [{ id: 'sample-1' }],
      },
    });
    expect(playlists).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest'

import {
  normalizeConfigs,
  normalizeMusicList,
  normalizePlaylist,
  normalizePlaylists,
} from '../normalizeCatalog'

describe('normalizeMusicList', () => {
  it('keeps entries with id and path', () => {
    const { tracks, errors } = normalizeMusicList([
      { id: 'a', path: '/a.mp3', title: 'A' },
      { id: 'b', path: 'https://ex.com/b.mp3' },
    ])
    expect(tracks).toHaveLength(2)
    expect(tracks[0]).toMatchObject({ id: 'a', path: '/a.mp3', title: 'A' })
    expect(errors).toEqual([])
  })

  it('drops entries missing id or path and records errors', () => {
    const { tracks, errors } = normalizeMusicList([
      { path: '/a.mp3' },
      { id: 'b' },
      { id: 'c', path: '/c.mp3' },
    ])
    expect(tracks.map((t) => t.id)).toEqual(['c'])
    expect(errors).toHaveLength(2)
    expect(errors[0]).toMatch(/missing id/i)
    expect(errors[1]).toMatch(/missing path/i)
  })

  it('drops duplicate ids and records errors', () => {
    const { tracks, errors } = normalizeMusicList([
      { id: 'dup', path: '/1.mp3' },
      { id: 'dup', path: '/2.mp3' },
    ])
    expect(tracks).toHaveLength(1)
    expect(tracks[0]!.path).toBe('/1.mp3')
    expect(errors[0]).toMatch(/id already exists/i)
  })

  it('defaults volumeRatio to 100 when volume-ratio is missing', () => {
    const { tracks } = normalizeMusicList([{ id: 'a', path: '/a.mp3' }])
    expect(tracks[0]!.volumeRatio).toBe(100)
  })

  it('keeps valid volume-ratio percentages including values above 100', () => {
    const { tracks } = normalizeMusicList([
      { id: 'quiet', path: '/q.mp3', 'volume-ratio': 50 },
      { id: 'loud', path: '/l.mp3', 'volume-ratio': 150 },
      { id: 'zero', path: '/z.mp3', 'volume-ratio': 0 },
      { id: 'cap', path: '/c.mp3', 'volume-ratio': 200 },
    ])
    expect(tracks.map((t) => t.volumeRatio)).toEqual([50, 150, 0, 200])
  })

  it('clamps volume-ratio above 200 down to 200', () => {
    const { tracks } = normalizeMusicList([
      { id: 'a', path: '/a.mp3', 'volume-ratio': 201 },
      { id: 'b', path: '/b.mp3', 'volume-ratio': 500 },
    ])
    expect(tracks.map((t) => t.volumeRatio)).toEqual([200, 200])
  })

  it('defaults volumeRatio to 100 for invalid volume-ratio values', () => {
    const { tracks } = normalizeMusicList([
      { id: 'a', path: '/a.mp3', 'volume-ratio': -1 },
      { id: 'b', path: '/b.mp3', 'volume-ratio': Number.NaN },
      { id: 'c', path: '/c.mp3', 'volume-ratio': Number.POSITIVE_INFINITY },
      { id: 'd', path: '/d.mp3', 'volume-ratio': '80' },
      { id: 'e', path: '/e.mp3', 'volume-ratio': null },
    ])
    expect(tracks.map((t) => t.volumeRatio)).toEqual([100, 100, 100, 100, 100])
  })
})

describe('normalizePlaylist', () => {
  it('resolves playlist entries to known track ids', () => {
    const tracks = [
      { id: 'a', path: '/a.mp3', volumeRatio: 100 },
      { id: 'b', path: '/b.mp3', volumeRatio: 100 },
    ]
    const playlist = normalizePlaylist(
      { title: 'Mine', 'music-list': [{ id: 'a' }, { id: 'missing' }, { id: 'b' }] },
      tracks,
    )
    expect(playlist).toEqual({ title: 'Mine', trackIds: ['a', 'b'] })
  })
})

describe('normalizePlaylists', () => {
  it('normalizes multiple playlists from playlists array', () => {
    const tracks = [
      { id: 'a', path: '/a.mp3', volumeRatio: 100 },
      { id: 'b', path: '/b.mp3', volumeRatio: 100 },
      { id: 'c', path: '/c.mp3', volumeRatio: 100 },
    ]
    const playlists = normalizePlaylists(
      [
        { title: 'My Playlist1', 'music-list': [{ id: 'a' }, { id: 'b' }] },
        { title: 'My Playlist2', 'music-list': [{ id: 'c' }, { id: 'missing' }] },
      ],
      tracks,
    )
    expect(playlists).toEqual([
      { title: 'My Playlist1', trackIds: ['a', 'b'] },
      { title: 'My Playlist2', trackIds: ['c'] },
    ])
  })
})

describe('normalizeConfigs', () => {
  it('reads playlists array from configs', () => {
    const { playlists } = normalizeConfigs({
      'music-list': [
        { id: 'sample-1', path: '/sample-1.mp3' },
        { id: '9277', path: '/9277.mp3' },
      ],
      playlists: [
        {
          title: 'My Playlist1',
          'music-list': [{ id: 'sample-1' }, { id: '9277' }],
        },
      ],
    })
    expect(playlists).toEqual([{ title: 'My Playlist1', trackIds: ['sample-1', '9277'] }])
  })

  it('ignores legacy singular playlist', () => {
    const { playlists } = normalizeConfigs({
      'music-list': [{ id: 'sample-1', path: '/sample-1.mp3' }],
      playlist: {
        title: 'Legacy',
        'music-list': [{ id: 'sample-1' }],
      },
    })
    expect(playlists).toEqual([])
  })
})

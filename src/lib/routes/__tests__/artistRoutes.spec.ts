import { describe, expect, it } from 'vitest'

import { UNKNOWN_ALBUM, UNKNOWN_ARTIST } from '../../catalog/displayLabels'
import {
  artistAlbumPath,
  artistAlbumsPath,
  artistPath,
  findArtistGroup,
  albumsForArtist,
  artistAlbumsGalleryEntries,
  tracksForArtistAlbum,
  type ArtistTrackLike,
} from '../artistRoutes'

const tracks: (ArtistTrackLike & { id: string })[] = [
  {
    id: 'a1',
    displayArtist: 'Artist 1',
    displayAlbum: 'Album 1',
  },
  {
    id: 'a2',
    displayArtist: 'Artist 1',
    displayAlbum: 'Album 2',
  },
  {
    id: 'b1',
    displayArtist: 'Artist 2',
    displayAlbum: 'Album 1',
  },
]

const artists = [
  { name: 'Artist 1', tracks: [tracks[0]!, tracks[1]!] },
  { name: 'Artist 2', tracks: [tracks[2]!] },
]

describe('artistPath', () => {
  it('builds an encoded all-music path from the artist name', () => {
    expect(artistPath('Artist 1')).toBe('/artists/Artist%201')
  })
})

describe('artistAlbumsPath', () => {
  it('builds an encoded artist albums path', () => {
    expect(artistAlbumsPath('Artist 1')).toBe('/artists/Artist%201/albums')
  })
})

describe('artistAlbumPath', () => {
  it('builds an encoded artist album detail path', () => {
    expect(artistAlbumPath('Artist 1', 'Album 2')).toBe('/artists/Artist%201/albums/Album%202')
  })
})

describe('findArtistGroup', () => {
  it('finds an artist by decoded route name', () => {
    expect(findArtistGroup(artists, 'Artist%201')).toEqual(artists[0])
    expect(findArtistGroup(artists, 'Artist 2')).toEqual(artists[1])
  })

  it('returns undefined when no artist matches', () => {
    expect(findArtistGroup(artists, 'Missing')).toBeUndefined()
  })
})

describe('albumsForArtist', () => {
  it('returns unique albums for the artist, sorted by name', () => {
    expect(albumsForArtist(tracks, 'Artist 1')).toEqual([
      { name: 'Album 1', tracks: [tracks[0]!] },
      { name: 'Album 2', tracks: [tracks[1]!] },
    ])
  })

  it('does not include albums from other artists with the same album title', () => {
    const albums = albumsForArtist(tracks, 'Artist 1')
    expect(albums.find((a) => a.name === 'Album 1')?.tracks).toEqual([tracks[0]!])
  })

  it('lists every album for Unknown artist tracks, including Unknown album', () => {
    const unknownTracks: (ArtistTrackLike & { id: string })[] = [
      { id: 'u1', displayArtist: UNKNOWN_ARTIST, displayAlbum: 'Album A' },
      { id: 'u2', displayArtist: UNKNOWN_ARTIST, displayAlbum: 'Album B' },
      { id: 'u3', displayArtist: UNKNOWN_ARTIST, displayAlbum: UNKNOWN_ALBUM },
      { id: 'known', displayArtist: 'Artist 1', displayAlbum: 'Album A' },
    ]
    expect(albumsForArtist(unknownTracks, UNKNOWN_ARTIST)).toEqual([
      { name: 'Album A', tracks: [unknownTracks[0]!] },
      { name: 'Album B', tracks: [unknownTracks[1]!] },
      { name: UNKNOWN_ALBUM, tracks: [unknownTracks[2]!] },
    ])
  })
})

describe('tracksForArtistAlbum', () => {
  it('returns tracks matching both artist and album', () => {
    expect(tracksForArtistAlbum(tracks, 'Artist 1', 'Album 1')).toEqual([tracks[0]!])
  })

  it('returns an empty list when the album is missing for that artist', () => {
    expect(tracksForArtistAlbum(tracks, 'Artist 1', 'Missing')).toEqual([])
  })

  it('returns Unknown artist tracks for a given album', () => {
    const unknownTracks: (ArtistTrackLike & { id: string })[] = [
      { id: 'u1', displayArtist: UNKNOWN_ARTIST, displayAlbum: 'Album A' },
      { id: 'u2', displayArtist: UNKNOWN_ARTIST, displayAlbum: 'Album B' },
    ]
    expect(tracksForArtistAlbum(unknownTracks, UNKNOWN_ARTIST, 'Album A')).toEqual([
      unknownTracks[0]!,
    ])
  })
})

describe('artistAlbumsGalleryEntries', () => {
  it('puts all-music first with total track count and first cover, then albums', () => {
    const withCovers: (ArtistTrackLike & { id: string; displayCover?: string })[] = [
      {
        id: 'a1',
        displayArtist: 'Artist 1',
        displayAlbum: 'Album 2',
        displayCover: 'https://example.com/a2.jpg',
      },
      {
        id: 'a2',
        displayArtist: 'Artist 1',
        displayAlbum: 'Album 1',
        displayCover: 'https://example.com/a1.jpg',
      },
      { id: 'a3', displayArtist: 'Artist 1', displayAlbum: 'Album 1' },
    ]

    expect(artistAlbumsGalleryEntries(withCovers, 'Artist 1')).toEqual([
      {
        kind: 'all-music',
        trackCount: 3,
        coverSrc: 'https://example.com/a2.jpg',
      },
      {
        kind: 'album',
        name: 'Album 1',
        trackCount: 2,
        coverSrc: 'https://example.com/a1.jpg',
      },
      {
        kind: 'album',
        name: 'Album 2',
        trackCount: 1,
        coverSrc: 'https://example.com/a2.jpg',
      },
    ])
  })
})

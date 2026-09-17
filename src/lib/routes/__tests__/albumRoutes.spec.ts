import { describe, expect, it } from 'vitest'

import { albumPath, findAlbumGroup, firstAlbumCoverSrc, type AlbumGroup } from '../albumRoutes'

const albums: AlbumGroup<{ id: string }>[] = [
  { name: 'Album 1', tracks: [{ id: 'a1' }, { id: 'a2' }] },
  { name: 'Unknown album', tracks: [{ id: 'u1' }] },
]

describe('albumPath', () => {
  it('builds an encoded album detail path from the album name', () => {
    expect(albumPath('Album 1')).toBe('/albums/Album%201')
  })
})

describe('findAlbumGroup', () => {
  it('finds an album by decoded route name', () => {
    expect(findAlbumGroup(albums, 'Album%201')).toEqual(albums[0])
    expect(findAlbumGroup(albums, 'Unknown album')).toEqual(albums[1])
  })

  it('returns undefined when no album matches', () => {
    expect(findAlbumGroup(albums, 'Missing')).toBeUndefined()
  })
})

describe('firstAlbumCoverSrc', () => {
  it('returns the first track cover in catalog order', () => {
    expect(
      firstAlbumCoverSrc([
        { displayCover: 'https://example.com/a.jpg' },
        { displayCover: 'https://example.com/b.jpg' },
      ]),
    ).toBe('https://example.com/a.jpg')
  })

  it('skips tracks without a cover', () => {
    expect(
      firstAlbumCoverSrc([{}, { displayCover: '' }, { displayCover: 'https://example.com/c.jpg' }]),
    ).toBe('https://example.com/c.jpg')
  })

  it('returns undefined when no track has a cover', () => {
    expect(firstAlbumCoverSrc([{}, { displayCover: '' }])).toBeUndefined()
  })
})

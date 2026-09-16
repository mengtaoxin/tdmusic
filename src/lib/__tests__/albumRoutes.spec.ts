import { describe, expect, it } from 'vitest'

import { albumPath, findAlbumGroup, type AlbumGroup } from '../albumRoutes'

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

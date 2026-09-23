import { describe, expect, it } from 'vitest'

import {
  buildCatalogSnapshot,
  groupTracksByAlbum,
  groupTracksByArtist,
  patchCatalogTrack,
  searchCatalog,
  type DisplayTrack,
} from '../catalogIndex'

function track(
  id: string,
  artist: string,
  album: string,
  extras: Partial<DisplayTrack> = {},
): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    volumeRatio: 100,
    displayTitle: extras.displayTitle ?? id,
    displayArtist: artist,
    displayAlbum: album,
    ...extras,
  }
}

describe('catalogIndex', () => {
  const tracks = [
    track('a', 'Beta', 'Z Album', { displayTitle: 'Alpha Song' }),
    track('b', 'Alpha', 'A Album'),
    track('c', 'Alpha', 'B Album', { displayCover: 'cover-c' }),
  ]

  it('groups artists sorted by name with tracks in catalog order', () => {
    expect(groupTracksByArtist(tracks)).toEqual([
      { name: 'Alpha', tracks: [tracks[1], tracks[2]] },
      { name: 'Beta', tracks: [tracks[0]] },
    ])
  })

  it('groups albums sorted by name with tracks in catalog order', () => {
    expect(groupTracksByAlbum(tracks)).toEqual([
      { name: 'A Album', tracks: [tracks[1]] },
      { name: 'B Album', tracks: [tracks[2]] },
      { name: 'Z Album', tracks: [tracks[0]] },
    ])
  })

  it('buildCatalogSnapshot indexes tracks and derived groups', () => {
    const snap = buildCatalogSnapshot(tracks)
    expect(snap.trackById.get('b')).toBe(tracks[1])
    expect(snap.artists.map((g) => g.name)).toEqual(['Alpha', 'Beta'])
    expect(snap.albums.map((g) => g.name)).toEqual(['A Album', 'B Album', 'Z Album'])
  })

  it('search matches title, id, artist group, and album group', () => {
    const snap = buildCatalogSnapshot(tracks)
    const result = searchCatalog(snap, 'alpha')
    expect(result.tracks.map((t) => t.id)).toEqual(['a', 'b', 'c'])
    expect(result.artists).toEqual(['Alpha'])
    expect(result.albums).toEqual([])

    const byAlbum = searchCatalog(snap, 'z album')
    expect(byAlbum.albums).toEqual(['Z Album'])
    expect(byAlbum.tracks.map((t) => t.id)).toEqual(['a'])
  })

  it('search returns empty buckets for blank query', () => {
    const snap = buildCatalogSnapshot(tracks)
    expect(searchCatalog(snap, '  ')).toEqual({ tracks: [], artists: [], albums: [] })
  })

  it('patchCatalogTrack surgically updates groups when artist/album keys are unchanged', () => {
    const snap = buildCatalogSnapshot(tracks)
    const next = patchCatalogTrack(snap, 'c', {
      displayCover: 'new-cover',
      displayTitle: 'Renamed',
    })
    expect(next).not.toBeNull()
    expect(next!.regrouped).toBe(false)
    expect(next!.snapshot.trackById.get('c')?.displayCover).toBe('new-cover')
    expect(next!.snapshot.trackById.get('c')?.displayTitle).toBe('Renamed')
    // Membership unchanged; track refs inside groups stay current for cover/title UI.
    expect(next!.snapshot.artists.map((g) => g.name)).toEqual(['Alpha', 'Beta'])
    expect(next!.snapshot.artists[0]!.tracks.map((t) => t.id)).toEqual(['b', 'c'])
    expect(next!.snapshot.artists[0]!.tracks.find((t) => t.id === 'c')?.displayCover).toBe(
      'new-cover',
    )
    expect(next!.snapshot.albums[1]!.tracks.find((t) => t.id === 'c')?.displayTitle).toBe('Renamed')
  })

  it('patchCatalogTrack rebuilds groups when artist or album changes', () => {
    const snap = buildCatalogSnapshot(tracks)
    const next = patchCatalogTrack(snap, 'c', { displayArtist: 'Beta' })
    expect(next).not.toBeNull()
    expect(next!.regrouped).toBe(true)
    expect(next!.snapshot.artists.map((g) => g.name)).toEqual(['Alpha', 'Beta'])
    expect(next!.snapshot.artists.find((g) => g.name === 'Beta')?.tracks.map((t) => t.id)).toEqual([
      'a',
      'c',
    ])
  })

  it('patchCatalogTrack returns null for unknown id', () => {
    const snap = buildCatalogSnapshot(tracks)
    expect(patchCatalogTrack(snap, 'missing', { displayTitle: 'x' })).toBeNull()
  })
})

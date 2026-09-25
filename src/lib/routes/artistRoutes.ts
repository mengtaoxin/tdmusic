import { UNKNOWN_ALBUM, UNKNOWN_ARTIST } from '../catalog/displayLabels'
import { firstAlbumCoverSrc } from './albumRoutes'
import { decodeRouteParam } from './routeParams'

export type ArtistTrackLike = {
  displayArtist: string
  displayAlbum: string
}

export type ArtistGroup<T extends ArtistTrackLike> = {
  name: string
  tracks: T[]
}

export type AlbumGroup<T extends ArtistTrackLike> = {
  name: string
  tracks: T[]
}

export function artistPath(name: string): string {
  return `/artists/${encodeURIComponent(name)}`
}

export function artistAlbumsPath(name: string): string {
  return `/artists/${encodeURIComponent(name)}/albums`
}

export function artistAlbumPath(artist: string, album: string): string {
  return `/artists/${encodeURIComponent(artist)}/albums/${encodeURIComponent(album)}`
}

export function findArtistGroup<T extends ArtistTrackLike>(
  artists: ArtistGroup<T>[],
  name: string,
): ArtistGroup<T> | undefined {
  const decoded = decodeRouteParam(name)
  return artists.find((artist) => artist.name === decoded)
}

export function albumsForArtist<T extends ArtistTrackLike>(
  tracks: T[],
  artistName: string,
): AlbumGroup<T>[] {
  const decoded = decodeRouteParam(artistName)
  const map = new Map<string, T[]>()
  for (const track of tracks) {
    const artist = track.displayArtist || UNKNOWN_ARTIST
    if (artist !== decoded) continue
    const album = track.displayAlbum || UNKNOWN_ALBUM
    const list = map.get(album) ?? []
    list.push(track)
    map.set(album, list)
  }
  return [...map.entries()]
    .map(([name, items]) => ({ name, tracks: items }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function tracksForArtistAlbum<T extends ArtistTrackLike>(
  tracks: T[],
  artistName: string,
  albumName: string,
): T[] {
  const artist = decodeRouteParam(artistName)
  const album = decodeRouteParam(albumName)
  return tracks.filter((track) => {
    const trackArtist = track.displayArtist || UNKNOWN_ARTIST
    const trackAlbum = track.displayAlbum || UNKNOWN_ALBUM
    return trackArtist === artist && trackAlbum === album
  })
}

export type ArtistAlbumsGalleryEntry =
  | {
      kind: 'all-music'
      trackCount: number
      coverSrc?: string
    }
  | {
      kind: 'album'
      name: string
      trackCount: number
      coverSrc?: string
    }

/** All-music tile first, then this artist’s albums (sorted), each with a cover. */
export function artistAlbumsGalleryEntries<
  T extends ArtistTrackLike & { displayCover?: string },
>(tracks: T[], artistName: string): ArtistAlbumsGalleryEntry[] {
  const decoded = decodeRouteParam(artistName)
  const artistTracks = tracks.filter(
    (track) => (track.displayArtist || UNKNOWN_ARTIST) === decoded,
  )
  const albums = albumsForArtist(tracks, artistName)
  return [
    {
      kind: 'all-music',
      trackCount: artistTracks.length,
      coverSrc: firstAlbumCoverSrc(artistTracks),
    },
    ...albums.map((group) => ({
      kind: 'album' as const,
      name: group.name,
      trackCount: group.tracks.length,
      coverSrc: firstAlbumCoverSrc(group.tracks),
    })),
  ]
}

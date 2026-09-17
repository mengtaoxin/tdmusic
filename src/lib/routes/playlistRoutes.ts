import type { NormalizedPlaylist } from '../catalog/normalizeCatalog'
import { decodeRouteParam } from './routeParams'

export function playlistPath(title: string): string {
  return `/playlists/${encodeURIComponent(title)}`
}

export function findPlaylistByName(
  playlists: NormalizedPlaylist[],
  name: string,
): NormalizedPlaylist | undefined {
  const decoded = decodeRouteParam(name)
  return playlists.find((playlist) => playlist.title === decoded)
}

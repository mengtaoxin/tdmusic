import type { NormalizedPlaylist } from './normalizeCatalog'

export function playlistPath(title: string): string {
  return `/playlists/${encodeURIComponent(title)}`
}

export function findPlaylistByName(
  playlists: NormalizedPlaylist[],
  name: string,
): NormalizedPlaylist | undefined {
  let decoded = name
  try {
    decoded = decodeURIComponent(name)
  } catch {
    // keep raw name if decoding fails
  }
  return playlists.find((playlist) => playlist.title === decoded)
}

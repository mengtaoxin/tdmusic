/** Stable catalog label when artist metadata is missing (UI localizes this). */
export const UNKNOWN_ARTIST = 'Unknown artist'

/** Stable catalog label when album metadata is missing (UI localizes this). */
export const UNKNOWN_ALBUM = 'Unknown album'

export function resolveDisplayArtist(artist: string | undefined | null): string {
  const trimmed = artist?.trim()
  return trimmed ? trimmed : UNKNOWN_ARTIST
}

export function resolveDisplayAlbum(album: string | undefined | null): string {
  const trimmed = album?.trim()
  return trimmed ? trimmed : UNKNOWN_ALBUM
}

/** Map stable unknown labels to the active locale for display. */
export function localizeArtistName(name: string, t: (key: string) => string): string {
  return name === UNKNOWN_ARTIST ? t('player.unknownArtist') : name
}

export function localizeAlbumName(name: string, t: (key: string) => string): string {
  return name === UNKNOWN_ALBUM ? t('player.unknownAlbum') : name
}

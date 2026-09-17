import { resolveDisplayAlbum, resolveDisplayArtist } from './displayLabels'
import { mergeTrackDisplay } from './mergeTrackMeta'
import type { MusicTrack } from './normalizeCatalog'
import { ensureTrackMetadata, type MetadataParser } from '../cache/trackMetadata'

export type EnrichableTrack = Pick<MusicTrack, 'id' | 'path'> &
  Partial<Pick<MusicTrack, 'title' | 'artist' | 'album' | 'cover'>>

export type DisplayPatch = {
  displayTitle: string
  displayArtist: string
  displayAlbum: string
  displayCover?: string
}

export type EnrichOptions = {
  parser?: MetadataParser
  /** When false (default), do not fetch audio over the network for ID3. */
  network?: boolean
}

/**
 * Best-effort: extract ID3 from already-available audio (or network when allowed),
 * return display fields. Does not download/cache remote audio.
 * Errors are swallowed; returns null when nothing to apply.
 */
export async function enrichOneTrack(
  track: EnrichableTrack,
  options?: EnrichOptions,
): Promise<DisplayPatch | null> {
  try {
    const network = options?.network ?? false
    const parsed = await ensureTrackMetadata(track.path, {
      network,
      ...(options?.parser ? { parser: options.parser } : {}),
    })
    if (!parsed) return null
    const merged = mergeTrackDisplay(track, parsed)
    return {
      displayTitle: merged.title ?? track.id,
      displayArtist: resolveDisplayArtist(merged.artist),
      displayAlbum: resolveDisplayAlbum(merged.album),
      displayCover: merged.cover,
    }
  } catch {
    return null
  }
}

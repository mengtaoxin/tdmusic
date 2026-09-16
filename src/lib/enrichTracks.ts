import { resolveDisplayAlbum, resolveDisplayArtist } from './displayLabels'
import { mergeTrackDisplay } from './mergeTrackMeta'
import { ensureTrackCached } from './musicCache'
import type { MusicTrack } from './normalizeCatalog'
import { isRemotePath } from './paths'
import { ensureTrackMetadata, type MetadataParser } from './trackMetadata'

export type EnrichableTrack = Pick<MusicTrack, 'id' | 'path'> &
  Partial<Pick<MusicTrack, 'title' | 'artist' | 'album' | 'cover'>>

export type DisplayPatch = {
  displayTitle: string
  displayArtist: string
  displayAlbum: string
  displayCover?: string
}

/**
 * Best-effort: ensure remote audio is cached, extract ID3, return display fields.
 * Errors are swallowed; returns null when nothing to apply.
 */
export async function enrichOneTrack(
  track: EnrichableTrack,
  options?: { parser?: MetadataParser },
): Promise<DisplayPatch | null> {
  try {
    if (isRemotePath(track.path)) {
      await ensureTrackCached(track.path, track.id)
    }
    const parsed = await ensureTrackMetadata(
      track.path,
      options?.parser ? { parser: options.parser } : undefined,
    )
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

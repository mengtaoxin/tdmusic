import type { IAudioMetadata } from 'music-metadata'
import { parseBlob } from 'music-metadata'

import type { ParsedAudioMeta } from './mergeTrackMeta'
import {
  COVER_FILE_KEY,
  getCachedBlobUrl,
  getCachedFile,
  getExtractedTrackMeta,
  putCoverFile,
  putExtractedTrackMeta,
} from './musicCache'
import { isPlayablePath, isRemotePath } from './paths'

export type ExtractedMetaFields = {
  title?: string
  artist?: string
  album?: string
  coverBlob?: Blob
}

export type MetadataParser = (blob: Blob) => Promise<ExtractedMetaFields>

function pictureToBlob(
  picture: { format?: string; data: Uint8Array } | undefined,
): Blob | undefined {
  if (!picture?.data?.length) return undefined
  const format = picture.format || 'image/jpeg'
  // Copy into a fresh ArrayBuffer-backed view for Blob compatibility.
  const copy = new Uint8Array(picture.data.byteLength)
  copy.set(picture.data)
  return new Blob([copy], { type: format })
}

export function parsedFromMusicMetadata(meta: IAudioMetadata): ExtractedMetaFields {
  const common = meta.common
  return {
    title: common.title?.trim() || undefined,
    artist: common.artist?.trim() || undefined,
    album: common.album?.trim() || undefined,
    coverBlob: pictureToBlob(common.picture?.[0]),
  }
}

const defaultParser: MetadataParser = async (blob) => {
  const meta = await parseBlob(blob)
  return parsedFromMusicMetadata(meta)
}

async function resolveAudioBlob(
  path: string,
  options?: { network?: boolean },
): Promise<Blob | null> {
  if (!isPlayablePath(path)) return null

  const cached = await getCachedFile(path)
  if (cached) return cached

  // Remote audio is only read from IndexedDB (downloaded on play).
  if (isRemotePath(path)) return null

  if (options?.network === false) return null
  try {
    const response = await fetch(path)
    if (!response.ok) return null
    return response.blob()
  } catch {
    return null
  }
}

async function toParsedAudioMeta(
  fields: Pick<ExtractedMetaFields, 'title' | 'artist' | 'album'>,
  sourceUrl: string,
): Promise<ParsedAudioMeta> {
  const coverUrl = (await getCachedBlobUrl(sourceUrl, COVER_FILE_KEY)) ?? undefined
  return {
    title: fields.title,
    artist: fields.artist,
    album: fields.album,
    coverUrl,
  }
}

/** Extract and cache metadata for a track path. Returns cached if present. */
export async function ensureTrackMetadata(
  sourceUrl: string,
  options?: {
    force?: boolean
    parser?: MetadataParser
    /** When false, skip network fetch for uncached site-absolute paths (cached extract/blob only). */
    network?: boolean
  },
): Promise<ParsedAudioMeta | null> {
  if (!options?.force) {
    const cached = await getExtractedTrackMeta(sourceUrl)
    if (cached) {
      return toParsedAudioMeta(cached, sourceUrl)
    }
  }

  const blob = await resolveAudioBlob(sourceUrl, { network: options?.network })
  if (!blob) return null

  const parser = options?.parser ?? defaultParser
  const parsed = await parser(blob)

  if (parsed.coverBlob) {
    await putCoverFile(sourceUrl, parsed.coverBlob)
  }

  await putExtractedTrackMeta({
    sourceUrl,
    title: parsed.title,
    artist: parsed.artist,
    album: parsed.album,
    updatedAt: Date.now(),
  })

  return toParsedAudioMeta(parsed, sourceUrl)
}

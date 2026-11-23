import type { MusicTrack } from './normalizeCatalog';
import { titleFromPath } from '../titleFromPath';

export type ParsedAudioMeta = {
  title?: string;
  artist?: string;
  album?: string;
  coverUrl?: string;
};

export type DisplayFields = {
  title?: string;
  artist?: string;
  album?: string;
  cover?: string;
};

/** Config fields win; extracted values fill gaps; url filename is last title fallback. */
export function mergeTrackDisplay(
  track: Pick<MusicTrack, 'url' | 'title' | 'artist' | 'album' | 'cover'>,
  parsed: ParsedAudioMeta | null | undefined,
): DisplayFields {
  const fromPath = titleFromPath(track.url);
  return {
    title: track.title ?? parsed?.title ?? (fromPath || undefined),
    artist: track.artist ?? parsed?.artist,
    album: track.album ?? parsed?.album,
    cover: track.cover ?? parsed?.coverUrl,
  };
}

export type RawMusicEntry = {
  id?: unknown;
  path?: unknown;
  title?: unknown;
  artist?: unknown;
  album?: unknown;
  cover?: unknown;
  'volume-ratio'?: unknown;
};

export type MusicTrack = {
  id: string;
  path: string;
  title?: string;
  artist?: string;
  album?: string;
  cover?: string;
  /** Playback volume as a percent of normal loudness (100 = unity; max 100). */
  volumeRatio: number;
};

export type CatalogError = string;

export type RawPlaylist = {
  id?: unknown;
  title?: unknown;
  songs?: unknown;
};

export type NormalizedPlaylist = {
  id: string;
  title?: string;
  trackIds: string[];
};

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const DEFAULT_VOLUME_RATIO = 100;
const MAX_VOLUME_RATIO = 100;

/** Finite number in [0, 100]; otherwise default 100. Values above 100 clamp to 100. */
export function parseVolumeRatio(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return DEFAULT_VOLUME_RATIO;
  }
  return Math.min(value, MAX_VOLUME_RATIO);
}

export function normalizeSongs(rawList: unknown): {
  tracks: MusicTrack[];
  errors: CatalogError[];
} {
  const tracks: MusicTrack[] = [];
  const errors: CatalogError[] = [];
  const seen = new Set<string>();

  if (!Array.isArray(rawList)) {
    return { tracks, errors: ['songs must be an array'] };
  }

  for (const raw of rawList) {
    const entry = (raw ?? {}) as RawMusicEntry;
    const id = asOptionalString(entry.id);
    const path = asOptionalString(entry.path);
    const label = id ?? path ?? '(unknown)';

    if (!id) {
      errors.push(`${label}: missing id, ignored`);
      continue;
    }
    if (!path) {
      errors.push(`${id}: missing path, ignored`);
      continue;
    }
    if (seen.has(id)) {
      errors.push(`${id}: id already exists, ignored`);
      continue;
    }

    seen.add(id);
    const track: MusicTrack = {
      id,
      path,
      volumeRatio: parseVolumeRatio(entry['volume-ratio']),
    };
    const title = asOptionalString(entry.title);
    const artist = asOptionalString(entry.artist);
    const album = asOptionalString(entry.album);
    const cover = asOptionalString(entry.cover);
    if (title) track.title = title;
    if (artist) track.artist = artist;
    if (album) track.album = album;
    if (cover) track.cover = cover;
    tracks.push(track);
  }

  return { tracks, errors };
}

export function normalizePlaylist(raw: unknown, tracks: MusicTrack[]): NormalizedPlaylist | null {
  if (!raw || typeof raw !== 'object') return null;
  const playlist = raw as RawPlaylist;
  const id = asOptionalString(playlist.id);
  if (!id) return null;
  const known = new Set(tracks.map((t) => t.id));
  const title = asOptionalString(playlist.title);
  const refs = Array.isArray(playlist.songs) ? playlist.songs : [];
  const trackIds: string[] = [];
  for (const ref of refs) {
    const trackId = asOptionalString((ref as { id?: unknown })?.id);
    if (trackId && known.has(trackId)) trackIds.push(trackId);
  }
  const normalized: NormalizedPlaylist = { id, trackIds };
  if (title) normalized.title = title;
  return normalized;
}

export function normalizePlaylists(
  raw: unknown,
  tracks: MusicTrack[],
): { playlists: NormalizedPlaylist[]; errors: CatalogError[] } {
  const playlists: NormalizedPlaylist[] = [];
  const errors: CatalogError[] = [];
  if (!Array.isArray(raw)) return { playlists, errors };

  const seen = new Set<string>();
  for (const entry of raw) {
    const playlist = (entry ?? {}) as RawPlaylist;
    const id = asOptionalString(playlist.id);
    const label = asOptionalString(playlist.title) ?? id ?? '(unknown)';
    if (!id) {
      errors.push(`playlist ${label}: missing id, ignored`);
      continue;
    }
    if (seen.has(id)) {
      errors.push(`playlist ${id}: id already exists, ignored`);
      continue;
    }
    const normalized = normalizePlaylist(entry, tracks);
    if (!normalized) continue;
    seen.add(id);
    playlists.push(normalized);
  }
  return { playlists, errors };
}

export type MusicConfigs = {
  songs?: unknown;
  playlists?: unknown;
};

export function normalizeConfigs(raw: unknown): {
  tracks: MusicTrack[];
  playlists: NormalizedPlaylist[];
  errors: CatalogError[];
} {
  const data = (raw ?? {}) as MusicConfigs;
  const { tracks, errors } = normalizeSongs(data.songs);
  const { playlists, errors: playlistErrors } = normalizePlaylists(data.playlists, tracks);
  return { tracks, playlists, errors: [...errors, ...playlistErrors] };
}

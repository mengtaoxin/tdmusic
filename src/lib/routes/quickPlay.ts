import type { NormalizedPlaylist } from '../catalog/normalizeCatalog';

export type QuickPlayRequest = {
  type: string;
  id: string;
};

export type QuickPlayCatalog = {
  trackIds: { has(id: string): boolean };
  playlists: readonly NormalizedPlaylist[];
};

export type QuickPlayPlan =
  | { kind: 'play'; sourceIds: string[] }
  | { kind: 'invalid' }
  | { kind: 'not-found'; target: 'track' | 'playlist' }
  | { kind: 'empty' };

const TRACK_TYPES = new Set(['track', 'trick']);

/** Resolve a /quick-play link to a queue, or a reason it cannot play. */
export function planQuickPlay(request: QuickPlayRequest, catalog: QuickPlayCatalog): QuickPlayPlan {
  const type = request.type.trim().toLowerCase();
  const id = request.id.trim();
  if (!id || (type !== 'playlist' && !TRACK_TYPES.has(type))) {
    return { kind: 'invalid' };
  }

  if (TRACK_TYPES.has(type)) {
    if (!catalog.trackIds.has(id)) return { kind: 'not-found', target: 'track' };
    return { kind: 'play', sourceIds: [id] };
  }

  const playlist = catalog.playlists.find((item) => item.id === id);
  if (!playlist) return { kind: 'not-found', target: 'playlist' };
  const sourceIds = playlist.trackIds.filter((trackId) => catalog.trackIds.has(trackId));
  if (!sourceIds.length) return { kind: 'empty' };
  return { kind: 'play', sourceIds };
}

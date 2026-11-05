import type { NormalizedPlaylist } from '../catalog/normalizeCatalog';

export type QuickPlayRequest = {
  type: string;
  id: string;
};

export type QuickPlayCatalog = {
  trackIds: { has(id: string): boolean };
  playlists: readonly NormalizedPlaylist[];
};

/** Queue already in the player. Used when the link asks to continue it. */
export type QuickPlaySession = {
  queue: readonly string[];
  currentId: string | null;
};

export type QuickPlayPlan =
  | { kind: 'play'; sourceIds: string[] }
  | { kind: 'resume' }
  | { kind: 'invalid' }
  | { kind: 'not-found'; target: 'track' | 'playlist' }
  | { kind: 'empty' }
  | { kind: 'idle' };

const TRACK_TYPES = new Set(['track', 'trick']);
const NOW_PLAYING_ID = 'now-playing';

/** Resolve a /quick-play link to a queue, or a reason it cannot play. */
export function planQuickPlay(
  request: QuickPlayRequest,
  catalog: QuickPlayCatalog,
  session: QuickPlaySession = { queue: [], currentId: null },
): QuickPlayPlan {
  const type = request.type.trim().toLowerCase();
  const id = request.id.trim();
  if (!id || (type !== 'playlist' && !TRACK_TYPES.has(type))) {
    return { kind: 'invalid' };
  }

  if (type === 'playlist' && id.toLowerCase() === NOW_PLAYING_ID) {
    if (!session.currentId || !session.queue.includes(session.currentId)) return { kind: 'idle' };
    return { kind: 'resume' };
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

import { resolveDisplayAlbum, resolveDisplayArtist } from '@/lib/catalog/displayLabels';
import { mergeTrackDisplay } from '@/lib/catalog/mergeTrackMeta';
import type { MusicTrack } from '@/lib/catalog/normalizeCatalog';

export type DisplayTrack = MusicTrack & {
  displayTitle: string;
  displayArtist: string;
  displayAlbum: string;
  displayCover?: string;
};

export type CatalogTrackGroup = {
  name: string;
  tracks: DisplayTrack[];
};

/** Immutable snapshot of catalog lookup structures. */
export type CatalogSnapshot = {
  tracks: DisplayTrack[];
  trackById: Map<string, DisplayTrack>;
  artists: CatalogTrackGroup[];
  albums: CatalogTrackGroup[];
};

export type CatalogSearchResult = {
  tracks: DisplayTrack[];
  artists: string[];
  albums: string[];
};

export function toDisplayTrack(track: MusicTrack): DisplayTrack {
  const merged = mergeTrackDisplay(track, null);
  return {
    ...track,
    displayTitle: merged.title ?? track.id,
    displayArtist: resolveDisplayArtist(merged.artist),
    displayAlbum: resolveDisplayAlbum(merged.album),
    displayCover: merged.cover,
  };
}

function groupBy(
  tracks: readonly DisplayTrack[],
  keyOf: (track: DisplayTrack) => string,
): CatalogTrackGroup[] {
  const map = new Map<string, DisplayTrack[]>();
  for (const track of tracks) {
    const key = keyOf(track);
    const list = map.get(key) ?? [];
    list.push(track);
    map.set(key, list);
  }
  return [...map.entries()]
    .map(([name, items]) => ({ name, tracks: items }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function groupTracksByArtist(tracks: readonly DisplayTrack[]): CatalogTrackGroup[] {
  return groupBy(tracks, (track) => resolveDisplayArtist(track.displayArtist));
}

export function groupTracksByAlbum(tracks: readonly DisplayTrack[]): CatalogTrackGroup[] {
  return groupBy(tracks, (track) => resolveDisplayAlbum(track.displayAlbum));
}

export function buildTrackById(tracks: readonly DisplayTrack[]): Map<string, DisplayTrack> {
  const map = new Map<string, DisplayTrack>();
  for (const track of tracks) map.set(track.id, track);
  return map;
}

export function buildCatalogSnapshot(tracks: readonly DisplayTrack[]): CatalogSnapshot {
  const list = [...tracks];
  return {
    tracks: list,
    trackById: buildTrackById(list),
    artists: groupTracksByArtist(list),
    albums: groupTracksByAlbum(list),
  };
}

export function searchCatalog(snapshot: CatalogSnapshot, query: string): CatalogSearchResult {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { tracks: [], artists: [], albums: [] };
  }
  return {
    tracks: snapshot.tracks.filter(
      (t) =>
        t.displayTitle.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.displayArtist.toLowerCase().includes(q) ||
        t.displayAlbum.toLowerCase().includes(q),
    ),
    artists: snapshot.artists.filter((a) => a.name.toLowerCase().includes(q)).map((a) => a.name),
    albums: snapshot.albums.filter((a) => a.name.toLowerCase().includes(q)).map((a) => a.name),
  };
}

function groupingKeysChanged(before: DisplayTrack, after: DisplayTrack): boolean {
  return (
    resolveDisplayArtist(before.displayArtist) !== resolveDisplayArtist(after.displayArtist) ||
    resolveDisplayAlbum(before.displayAlbum) !== resolveDisplayAlbum(after.displayAlbum)
  );
}

/** Replace a track reference inside groups without rebuilding group membership. */
function replaceTrackInGroups(
  groups: CatalogTrackGroup[],
  next: DisplayTrack,
): CatalogTrackGroup[] {
  let changed = false;
  const updated = groups.map((group) => {
    const index = group.tracks.findIndex((t) => t.id === next.id);
    if (index < 0) return group;
    changed = true;
    const tracks = group.tracks.slice();
    tracks[index] = next;
    return { ...group, tracks };
  });
  return changed ? updated : groups;
}

/**
 * Apply a display patch. When artist/album keys are unchanged, group membership
 * is updated surgically (no full regroup/sort); `regrouped` is false.
 */
export function patchCatalogTrack(
  snapshot: CatalogSnapshot,
  id: string,
  patch: Partial<DisplayTrack>,
): { snapshot: CatalogSnapshot; regrouped: boolean } | null {
  const index = snapshot.tracks.findIndex((t) => t.id === id);
  if (index < 0) return null;

  const prev = snapshot.tracks[index]!;
  const next: DisplayTrack = { ...prev, ...patch };
  const tracks = snapshot.tracks.slice();
  tracks[index] = next;

  const trackById = new Map(snapshot.trackById);
  trackById.set(id, next);

  if (groupingKeysChanged(prev, next)) {
    return {
      regrouped: true,
      snapshot: {
        tracks,
        trackById,
        artists: groupTracksByArtist(tracks),
        albums: groupTracksByAlbum(tracks),
      },
    };
  }

  return {
    regrouped: false,
    snapshot: {
      tracks,
      trackById,
      artists: replaceTrackInGroups(snapshot.artists, next),
      albums: replaceTrackInGroups(snapshot.albums, next),
    },
  };
}

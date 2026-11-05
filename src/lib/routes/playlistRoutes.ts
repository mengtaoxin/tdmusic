import type { NormalizedPlaylist } from '../catalog/normalizeCatalog';
import { decodeRouteParam } from './routeParams';

export function playlistPath(id: string): string {
  return `/playlists/${encodeURIComponent(id)}`;
}

export function findPlaylistById(
  playlists: NormalizedPlaylist[],
  id: string,
): NormalizedPlaylist | undefined {
  const decoded = decodeRouteParam(id);
  return playlists.find((playlist) => playlist.id === decoded);
}

export function playlistLabel(playlist: NormalizedPlaylist): string {
  return playlist.title ?? playlist.id;
}

import { decodeRouteParam } from './routeParams';

export type AlbumGroup<T> = {
  name: string;
  tracks: T[];
};

export function albumPath(name: string): string {
  return `/albums/${encodeURIComponent(name)}`;
}

export function findAlbumGroup<T>(
  albums: AlbumGroup<T>[],
  name: string,
): AlbumGroup<T> | undefined {
  const decoded = decodeRouteParam(name);
  return albums.find((album) => album.name === decoded);
}

/** First non-empty displayCover among album tracks (catalog order). */
export function firstAlbumCoverSrc(tracks: { displayCover?: string }[]): string | undefined {
  for (const track of tracks) {
    const cover = track.displayCover?.trim();
    if (cover) return cover;
  }
  return undefined;
}

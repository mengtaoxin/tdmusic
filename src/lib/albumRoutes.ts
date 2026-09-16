import { decodeRouteParam } from './artistRoutes'

export type AlbumGroup<T> = {
  name: string
  tracks: T[]
}

export function albumPath(name: string): string {
  return `/albums/${encodeURIComponent(name)}`
}

export function findAlbumGroup<T>(
  albums: AlbumGroup<T>[],
  name: string,
): AlbumGroup<T> | undefined {
  const decoded = decodeRouteParam(name)
  return albums.find((album) => album.name === decoded)
}

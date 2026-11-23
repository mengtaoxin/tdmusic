import { decodeRouteParam } from '@/lib/routes/routeParams';

export type NavBreadcrumbOptions = {
  t: (key: string) => string;
  playlistLabel?: (id: string) => string;
  localizeArtist?: (name: string) => string;
  localizeAlbum?: (name: string) => string;
};

const TOP_LEVEL: Readonly<Record<string, string>> = {
  '/now-playing': 'nav.nowPlaying',
  '/music': 'nav.songs',
  '/search': 'nav.search',
  '/stats': 'nav.stats',
  '/settings': 'nav.settings',
  '/config-guides': 'nav.configGuides',
  '/about': 'nav.about',
  '/logs': 'nav.logs',
  '/quick-play': 'quickPlay.title',
};

function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Resolve display-only header crumbs for the current pathname. */
export function resolveNavBreadcrumbs(pathname: string, options: NavBreadcrumbOptions): string[] {
  const { t, playlistLabel, localizeArtist, localizeAlbum } = options;
  const path = stripTrailingSlash(pathname);

  if (path === '/' || path === '') return [];

  const topKey = TOP_LEVEL[path];
  if (topKey) return [t(topKey)];

  if (path === '/playlists') return [t('nav.playlist')];
  if (path.startsWith('/playlists/')) {
    const id = decodeRouteParam(path.slice('/playlists/'.length));
    return [t('nav.playlist'), playlistLabel?.(id) ?? id];
  }

  if (path === '/artists') return [t('nav.artists')];
  if (path.startsWith('/artists/')) {
    const rest = path.slice('/artists/'.length);
    const albumMatch = /^([^/]+)\/albums(?:\/([^/]+))?$/.exec(rest);
    if (albumMatch) {
      const artist = decodeRouteParam(albumMatch[1] ?? '');
      const album = albumMatch[2] ? decodeRouteParam(albumMatch[2]) : undefined;
      const artistLabel = localizeArtist?.(artist) ?? artist;
      if (album) {
        return [t('nav.artists'), artistLabel, localizeAlbum?.(album) ?? album];
      }
      return [t('nav.artists'), artistLabel];
    }
    const artistOnly = decodeRouteParam(rest);
    return [t('nav.artists'), localizeArtist?.(artistOnly) ?? artistOnly];
  }

  if (path === '/albums') return [t('nav.albums')];
  if (path.startsWith('/albums/')) {
    const album = decodeRouteParam(path.slice('/albums/'.length));
    return [t('nav.albums'), localizeAlbum?.(album) ?? album];
  }

  return [];
}

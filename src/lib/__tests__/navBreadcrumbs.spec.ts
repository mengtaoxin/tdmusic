import { describe, expect, it } from 'vitest';

import { resolveNavBreadcrumbs } from '../navBreadcrumbs';

const labels: Record<string, string> = {
  'nav.nowPlaying': 'Now Playing',
  'nav.songs': 'Songs',
  'nav.playlist': 'Playlists',
  'nav.artists': 'Artists',
  'nav.albums': 'Albums',
  'nav.search': 'Search',
  'nav.stats': 'Stats',
  'nav.settings': 'Settings',
  'nav.configGuides': 'Guidelines for configs.json',
  'nav.about': 'About',
  'nav.logs': 'Logs',
  'quickPlay.title': 'Quick play',
};

function t(key: string): string {
  return labels[key] ?? key;
}

describe('resolveNavBreadcrumbs', () => {
  it('returns no crumbs on the home route', () => {
    expect(resolveNavBreadcrumbs('/', { t })).toEqual([]);
  });

  it('maps top-level nav routes to a single translated label', () => {
    expect(resolveNavBreadcrumbs('/music', { t })).toEqual(['Songs']);
    expect(resolveNavBreadcrumbs('/now-playing', { t })).toEqual(['Now Playing']);
    expect(resolveNavBreadcrumbs('/search', { t })).toEqual(['Search']);
    expect(resolveNavBreadcrumbs('/stats', { t })).toEqual(['Stats']);
    expect(resolveNavBreadcrumbs('/settings', { t })).toEqual(['Settings']);
    expect(resolveNavBreadcrumbs('/config-guides', { t })).toEqual(['Guidelines for configs.json']);
    expect(resolveNavBreadcrumbs('/about', { t })).toEqual(['About']);
    expect(resolveNavBreadcrumbs('/logs', { t })).toEqual(['Logs']);
    expect(resolveNavBreadcrumbs('/quick-play', { t })).toEqual(['Quick play']);
  });

  it('builds playlist crumbs with the resolved playlist label', () => {
    expect(resolveNavBreadcrumbs('/playlists', { t })).toEqual(['Playlists']);
    expect(
      resolveNavBreadcrumbs('/playlists/my-playlist-1', {
        t,
        playlistLabel: (id) => (id === 'my-playlist-1' ? 'My Playlist1' : id),
      }),
    ).toEqual(['Playlists', 'My Playlist1']);
  });

  it('builds artist and album trail crumbs from path segments', () => {
    expect(resolveNavBreadcrumbs('/artists', { t })).toEqual(['Artists']);
    expect(resolveNavBreadcrumbs('/artists/Doubao/albums', { t })).toEqual(['Artists', 'Doubao']);
    expect(resolveNavBreadcrumbs('/artists/Doubao', { t })).toEqual(['Artists', 'Doubao']);
    expect(resolveNavBreadcrumbs('/artists/Doubao/albums/Album%201', { t })).toEqual([
      'Artists',
      'Doubao',
      'Album 1',
    ]);
  });

  it('builds album crumbs from the albums section', () => {
    expect(resolveNavBreadcrumbs('/albums', { t })).toEqual(['Albums']);
    expect(resolveNavBreadcrumbs('/albums/Album%201', { t })).toEqual(['Albums', 'Album 1']);
  });

  it('localizes unknown artist and album sentinel labels when provided', () => {
    expect(
      resolveNavBreadcrumbs('/artists/Unknown%20artist', {
        t,
        localizeArtist: (name) => (name === 'Unknown artist' ? '未知艺人' : name),
      }),
    ).toEqual(['Artists', '未知艺人']);
    expect(
      resolveNavBreadcrumbs('/albums/Unknown%20album', {
        t,
        localizeAlbum: (name) => (name === 'Unknown album' ? '未知专辑' : name),
      }),
    ).toEqual(['Albums', '未知专辑']);
  });
});

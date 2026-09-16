export default {
  nav: {
    home: 'Home',
    musicList: 'Music List',
    playlist: 'Playlist',
    artistList: 'Artist List',
    albumList: 'Album List',
    nowPlaying: 'Now Playing',
    search: 'Search',
    settings: 'Settings',
    about: 'About',
  },
  home: {
    title: 'Welcome to tdmusic',
    lead: 'A simple way to listen to your music in the browser.',
    pointPlay: 'Open the music list, pick a song, and hit play.',
    pointBrowse: 'Browse by artist or album, or search when you know the title.',
    cta: 'Browse music',
  },
  locale: {
    en: 'English',
    zh: '中文',
  },
  catalog: {
    configError: 'Config error: {message}',
  },
  playlist: {
    fromConfig: 'From configs.json playlists',
    trackCount: '{count} tracks',
    notFound: 'Playlist not found.',
  },
  artist: {
    allMusic: 'All music by this artist',
    trackCount: '{count} tracks',
    notFound: 'Artist not found.',
    albumNotFound: 'Album not found.',
  },
  player: {
    unknownArtist: 'Unknown artist',
    unknownAlbum: 'Unknown album',
    empty: 'Nothing playing yet. Pick a track from Music List.',
    queue: 'Now playing queue',
  },
  search: {
    placeholder: 'Search tracks, artists, albums',
    tracks: 'Tracks',
    artists: 'Artists',
    albums: 'Albums',
  },
  settings: {
    configUrl: 'Config URL',
    configUrlHint: 'Where the app loads the music catalog from. Leave empty for the default.',
    configGuidesLink: 'Config Guides',
    save: 'Save',
    reload: 'Reload catalog',
    reloadHint: 'Fetch the catalog again from the current config URL.',
    clearCache: 'Clear all cache',
    clearCacheHint: 'Remove cached audio and extracted metadata. Does not clear the play queue.',
    saved: 'Settings saved and catalog reloaded.',
    reloaded: 'Catalog reloaded.',
    cacheCleared: 'All music cache cleared.',
  },
  configGuides: {
    title: 'Config Guides',
    intro:
      'The app loads its music catalog from a JSON file (usually configs.json). This page explains the shape of that file.',
    whereTitle: 'Where it loads from',
    whereBody:
      'Default URL is /configs.json (from public/configs.json). Change it on the Settings page; leave empty to use the default.',
    musicListTitle: 'music-list',
    musicListBody:
      'An array of tracks. Each entry needs id and path. Missing either, or a duplicate id, drops that entry and shows an error in Music List. Optional fields override extracted ID3 tags when set.',
    fieldId: 'unique track id (required)',
    fieldPath: 'audio URL or site path (required)',
    fieldTitle: 'display title (optional)',
    fieldArtist: 'artist name (optional)',
    fieldAlbum: 'album name (optional)',
    fieldCover: 'cover image URL (optional)',
    playlistsTitle: 'playlists',
    playlistsBody:
      'An array of playlists. Each has a title and a music-list of {\'{\'} "id": "…" {\'}\'} refs that must match accepted tracks. Legacy singular playlist is still accepted as one playlist.',
    exampleTitle: 'Example',
    notesTitle: 'Notes',
    noteFallback:
      'Title fallback order: config → ID3 → filename from path (decoded basename without extension) → id.',
    noteUnknown:
      'Missing artist/album become Unknown artist / Unknown album; tracks still group under artist → albums → tracks.',
    notePaths:
      'http(s):// paths can be cached in IndexedDB; site-absolute paths (/…) play directly without caching.',
  },
  about: {
    github: 'GitHub',
  },
}

export default {
  nav: {
    home: 'Home',
    musicList: 'Music List',
    playlist: 'Playlist',
    artistList: 'Artist List',
    albumList: 'Album List',
    nowPlaying: 'Now Playing',
    search: 'Search',
    more: 'More',
    language: 'Language',
    settings: 'Settings',
    configGuides: 'Guidelines for configs.json',
    about: 'About',
    logs: 'Logs',
    feedback: 'Feedback',
    feedbackConfirm: 'Open GitHub to send feedback?',
    openMenu: 'Open menu',
    beta: 'Beta',
  },
  home: {
    title: 'Welcome to tdmusic',
    lead: 'Bring your own configs.json — describe your library there, point tdmusic at its URL, and play in the browser.',
    pointPlay:
      'List tracks in music-list (each needs an id and a path to the audio). Optional playlists group tracks by id.',
    pointBrowse:
      'Set your catalog URL in Settings. The bundled configs.json is only a sample for trying the app.',
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
    empty: 'No playlists yet. Add a playlists array in your config.',
    trackCount: '{count} tracks',
    notFound: 'Playlist not found.',
  },
  artist: {
    allMusic: 'All music by this artist',
    trackCount: '{count} tracks',
    notFound: 'Artist not found.',
    albumNotFound: 'Album not found.',
  },
  album: {
    trackCount: '{count} tracks',
    notFound: 'Album not found.',
  },
  player: {
    unknownArtist: 'Unknown artist',
    unknownAlbum: 'Unknown album',
    empty: 'Nothing playing yet. Pick a track from Music List.',
    queue: 'Now playing queue',
    playNext: 'Play next',
    addToQueue: 'Add to queue',
    removeFromQueue: 'Remove from queue',
    clearUpcoming: 'Clear upcoming',
    downloading: 'Downloading',
    playAll: 'Play all',
    shuffleAll: 'Shuffle all',
  },
  search: {
    placeholder: 'Search tracks, artists, albums',
    history: 'Recent searches',
    tracks: 'Tracks',
    artists: 'Artists',
    albums: 'Albums',
  },
  settings: {
    configUrl: 'Config URL',
    configUrlHint: 'Where the app loads the music catalog from. Leave empty for the default.',
    configGuidesLink: 'Guidelines for configs.json',
    save: 'Save',
    clearConfigsCache: 'Delete local config cache',
    clearConfigsCacheHint:
      'Remove the cached configs.json from this browser. Also clears now playing and the play queue. It will be downloaded again the next time the catalog loads.',
    clearConfigsCacheConfirm:
      'Delete the local configs.json cache and clear now playing and the play queue? It will be downloaded again next time.',
    clearCache: 'Clear all cache',
    clearCacheHint:
      'Remove cached audio and extracted metadata. Also clears now playing and the play queue.',
    clearCacheConfirm:
      'Clear all cached audio and extracted metadata, and clear now playing and the play queue? This cannot be undone.',
    cacheSize: 'Cached music: {size}',
    cancel: 'Cancel',
    confirm: 'Confirm',
    saved: 'Settings saved and catalog reloaded.',
    configsCacheCleared: 'Local config cache deleted.',
    cacheCleared: 'All music cache cleared.',
  },
  configGuides: {
    loading: 'Loading…',
    loadError: 'Could not load the config guide.',
  },
  about: {
    github: 'GitHub',
  },
  logs: {
    clear: 'Clear logs',
    clearConfirm: 'Clear all logs? This cannot be undone.',
    empty: 'No logs yet.',
  },
}

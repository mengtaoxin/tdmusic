/**
 * Production PWA contract consumed by Vite.
 * Audio stays in IndexedDB (`musicCache`); the service worker only keeps the app shell.
 */
export const pwaOptions = {
  registerType: 'autoUpdate' as const,
  includeAssets: [
    'favicon.png',
    'apple-touch-icon.png',
    'how-to-write-config-file.md',
    'how-to-write-config-file.zh.md',
  ],
  manifest: {
    name: 'tdmusic',
    short_name: 'tdmusic',
    description: 'Your music library, in the browser',
    start_url: '/',
    scope: '/',
    display: 'standalone' as const,
    background_color: '#0b1c22',
    theme_color: '#0b1c22',
    lang: 'en',
    icons: [
      { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
    globIgnores: ['**/*.{mp3,flac,wav,ogg,m4a,aac}'],
    navigateFallback: 'index.html',
    navigateFallbackDenylist: [/^\/configs\.json$/, /\.(?:mp3|flac|wav|ogg|m4a|aac)$/i],
    cleanupOutdatedCaches: true,
  },
};

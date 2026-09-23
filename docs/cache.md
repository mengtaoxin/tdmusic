# Audio cache and covers

Catalog load/enrich: [catalog.md](catalog.md). Prefetch / play download path: [playback.md](playback.md).

## Audio cache (IndexedDB `music-cache`, schema v1)

- Playable paths (`http(s)://` and site-absolute `/…`) are downloaded into IndexedDB on play. Downloads use `fetch(…, { cache: 'no-cache' })` so the browser revalidates with the origin (avoids re-storing a stale HTTP disk-cache copy after Settings clears IndexedDB).
- Audio downloads (play and prefetch) go through `ensureTrackCached` and share a global limiter (`downloadLimiter`): at most **3** music-file fetches run at once. Play-path downloads (`priority: 'high'` via `resolvePlayableUrl`) outrank prefetch (`normal`). While any high job is running or waiting, the limiter does not start a **new** normal job, even if a slot is idle; in-flight normals are not aborted. After every high job finishes, waiting normals run (FIFO among the same priority). Same-URL in-flight work is shared and counts as one slot. In-flight prefetch is not aborted when the user skips.
- After the current track’s playable URL is bound and `loadedmetadata` fires (playback can start), up to the next **3** upcoming queue tracks are also prefetched into IndexedDB (`prefetchUpcoming` / `upcomingQueueIds`): linear forward through the play queue (wraps when repeat **all**); none when repeat **one**. Shuffle reorders the queue itself, so prefetch stays linear. Best-effort; failures are ignored. Queue chunk appends re-trigger prefetch so early `playFrom` heads still fill the window (those jobs stay `normal`, so they wait if a play download is still high-priority). After each successful prefetch cache, that track is re-enqueued for enrichment (`scheduleEnrichTrack`) so list cover art updates when ID3/cover becomes available from the cached blob.
- Object stores: `meta` (download status), `files` (audio + cover blobs), `trackMeta` (extracted title/artist/album text only).
- `meta.status`: `pending` while downloading, `ready` when playable. Only `ready` counts as cached; failed downloads remove partial records and may be retried.
- In-flight ingest publishes progress through `cacheDownloadState` (by source URL / track id) so covers can animate; `done` (success or failure) and cache-clear cancel the marker.
- Audio blob key: `__audio__`. Cover art blob key: `__cover__` (not stored as data URLs in `trackMeta`).
- Playable `blob:` URLs from `getCachedBlobUrl` normalize MIME from the source path extension at read time (e.g. `.flac` → `audio/flac`) when the stored type differs; IndexedDB bytes and stored `type` are not rewritten. Cover object URLs are unchanged.
- Before writing large blobs, soft quota check via `navigator.storage.estimate()`: if `usage + size > quota * 0.85`, evict oldest `ready` tracks by `downloadedAt` until under the limit (no-op when quota unknown).
- Settings → “Clear all cache” asks for confirmation, then `clearMusicCachesAndRefresh` drops the catalog enrich queue, clears audio/cover blobs + extracted metadata (`musicCache.clearAllMusicCaches` does not know about enrich), clears now playing and the play queue (`player.clearNowPlaying`, including `tdmusic.player`), resets in-memory display fields to config-only, and re-enqueues enrichment. The same section shows the current size of cached audio and cover blobs (`getMusicCacheSizeBytes`); that figure refreshes after a successful clear.
- Public cache API for app code: `lib/cache/musicCache` (including `putCoverFile` and `getMusicCacheSizeBytes`). `trackMetadata` / `cacheStore` / `cacheIngest` / `cacheEviction` / `downloadLimiter` are internal to the cache stack. Cache must not import catalog.

## Cover images

- Extracted covers are stored as Blobs in IndexedDB (`files` / `__cover__`) and surfaced to the UI as `blob:` object URLs.
- All cover art goes through `CoverImg`, which loads the image only after the element enters the viewport (`IntersectionObserver`). Pass `eager` only when the image must load immediately.
- While the **current** track’s audio is downloading into IndexedDB, `CoverImg` replaces the still cover (or the music-note placeholder) with a simple circular loading indicator. When ingest finishes (`meta.status` `ready`), the real cover is shown (config URL or extracted `__cover__` blob). Prefetch downloads do not animate other rows.
- Music List, Artist List, Album List, and artist album galleries virtualize with `@tanstack/react-virtual` (host sizing via `useVirtualListHost`), so off-screen rows (and album covers) are not mounted. Album galleries (`AlbumGallery`) chunk tiles into responsive rows first, then virtualize those rows.

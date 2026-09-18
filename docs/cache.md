# Audio cache and covers

Catalog load/enrich: [catalog.md](catalog.md). Prefetch / play download path: [playback.md](playback.md).

## Audio cache (IndexedDB `music-cache`, schema v1)

- Playable paths (`http(s)://` and site-absolute `/…`) are downloaded into IndexedDB on play.
- Audio downloads (play and prefetch) go through `ensureTrackCached` and share a global limiter (`downloadLimiter`): at most **3** music-file fetches run at once; further jobs wait FIFO. Same-URL in-flight work is shared and counts as one slot.
- After the current track loads successfully, up to the next **3** upcoming queue tracks are also prefetched into IndexedDB (`prefetchUpcoming` / `upcomingQueueIds`): linear forward through the play queue (wraps when repeat **all**); none when repeat **one**. Shuffle reorders the queue itself, so prefetch stays linear. Best-effort; failures are ignored. Queue chunk appends re-trigger prefetch so early `playFrom` heads still fill the window. After each successful prefetch cache, that track is re-enqueued for enrichment (`scheduleEnrichTrack`) so list cover art updates when ID3/cover becomes available from the cached blob.
- Object stores: `meta` (download status), `files` (audio + cover blobs), `trackMeta` (extracted title/artist/album text only).
- `meta.status`: `pending` while downloading, `ready` when playable. Only `ready` counts as cached; failed downloads remove partial records and may be retried.
- In-flight ingest publishes progress through `cacheDownloadState` (by source URL / track id) so covers can animate; `done` (success or failure) and cache-clear cancel the marker.
- Audio blob key: `__audio__`. Cover art blob key: `__cover__` (not stored as data URLs in `trackMeta`).
- Before writing large blobs, soft quota check via `navigator.storage.estimate()`: if `usage + size > quota * 0.85`, evict oldest `ready` tracks by `downloadedAt` until under the limit (no-op when quota unknown).
- Settings → “Clear all cache” asks for confirmation, then clears audio/cover blobs + extracted metadata and the enrich queue, clears now playing and the play queue (`player.clearNowPlaying`, including `tdmusic.player`), resets in-memory display fields to config-only, and re-enqueues enrichment. The same section shows the current size of cached audio and cover blobs (`getMusicCacheSizeBytes`); that figure refreshes after a successful clear.
- Public cache API for app code: `lib/cache/musicCache` (including `putCoverFile` and `getMusicCacheSizeBytes`). `trackMetadata` / `cacheStore` / `cacheIngest` / `cacheEviction` / `downloadLimiter` are internal to the cache stack.

## Cover images

- Extracted covers are stored as Blobs in IndexedDB (`files` / `__cover__`) and surfaced to the UI as `blob:` object URLs.
- All cover art goes through `CoverImg`, which loads the image only after the element enters the viewport (`IntersectionObserver`). Pass `eager` only when the image must load immediately.
- While the **current** track’s audio is downloading into IndexedDB, `CoverImg` replaces the still cover (or the music-note placeholder) with a simple circular loading indicator. When ingest finishes (`meta.status` `ready`), the real cover is shown (config URL or extracted `__cover__` blob). Prefetch downloads do not animate other rows.
- Music List, Artist List, Album List, and artist album galleries virtualize with `v-virtual-scroll` (host sizing via `useVirtualListHost`), so off-screen rows (and album covers) are not mounted. Album galleries (`AlbumGallery`) chunk tiles into responsive rows first, then virtualize those rows.

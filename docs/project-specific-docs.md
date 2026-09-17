# Project specific docs

## Catalog (`configs.json`)

- Default URL: `/configs.json` (from `public/configs.json`).
- Override with `localStorage` key `tdmusic.configUrl` (Settings page; via `clientStorage`). Empty/whitespace → default.
- Settings and **More** link to **configs.json guideline** (`/config-guides`) for a field-by-field explanation of `configs.json`, plus a copyable LLM prompt (locale-matched) to generate the file from a track list.
- `music-list` entries require `id` and `path`. Missing either, or duplicate `id`, drops the entry and surfaces an error in Music List.
- Optional fields: `title`, `artist`, `album`, `cover`. Config values win over extracted ID3.
- Track title fallback order: config → ID3 → filename from `path`/`url` (decoded basename without extension) → `id`.
- Missing artist/album metadata resolves to stable labels `Unknown artist` / `Unknown album` (UI shows localized 未知歌手 / 未知专辑). Those tracks still group under artist → albums → tracks.
- `playlists` is an array of playlists; each references tracks by `id` (resolved against accepted tracks only). Legacy singular `playlist` is still accepted as one playlist.
- `/playlists` lists playlists (empty catalog shows a short empty state plus configs.json guideline link); `/playlists/{name}` shows that playlist’s tracks (`name` is the playlist title). When the playlist has tracks, **Play all** starts from the first track with shuffle off; **Shuffle all** starts from the first track with shuffle on (upcoming tail shuffled after queue fill).
- `/artists` lists artists; `/artists/{name}/albums` lists that artist’s albums plus **All music by this artist** (escape hatch when album metadata is wrong); `/artists/{name}/albums/{album}` shows that album’s tracks; `/artists/{name}` shows all tracks by the artist.
- `/albums` lists albums as a cover gallery (each tile shows the first track cover in that album, or a placeholder); `/albums/{name}` shows that album’s tracks (click a track to play).
- After catalog load, track enrichment (ID3 from already-cached audio/extract only — **no** download) runs through an enrich queue with concurrency **2**. Audio downloads into IndexedDB on play via `resolvePlayableUrl` (both `http(s)://` and site-absolute `/…` paths); after a successful load, that track is re-enqueued for enrichment (may use the cached blob for ID3). Orchestration lives in `lib/enrichTracks`; the catalog store schedules and applies display patches. Reloading or clearing cache drops queued enrich work.
- App bootstrap and Settings save/reload use `loadCatalogAndHydratePlayer` (catalog load + player hydrate; concurrent callers share one in-flight promise). Route views that need the catalog call `ensureCatalogLoaded` (no-op when tracks exist; otherwise the same load+hydrate path) — never `catalog.load()` alone. Settings “Clear all cache” confirms, then uses `clearMusicCachesAndRefresh` (IndexedDB clear + reset in-memory `display*` to config-only + re-enqueue enrich).

## Audio cache (IndexedDB `music-cache`, schema v1)

- Playable paths (`http(s)://` and site-absolute `/…`) are downloaded into IndexedDB on play.
- After the current track loads successfully, up to the next **3** upcoming queue tracks are also prefetched into IndexedDB (`prefetchUpcoming` / `upcomingQueueIds`): linear forward through the play queue (wraps when repeat **all**); none when repeat **one**. Shuffle reorders the queue itself, so prefetch stays linear. Best-effort; failures are ignored. Queue chunk appends re-trigger prefetch so early `playFrom` heads still fill the window. After each successful prefetch cache, that track is re-enqueued for enrichment (`scheduleEnrichTrack`) so list cover art updates when ID3/cover becomes available from the cached blob.
- Object stores: `meta` (download status), `files` (audio + cover blobs), `trackMeta` (extracted title/artist/album text only).
- `meta.status`: `pending` while downloading, `ready` when playable. Only `ready` counts as cached; failed downloads remove partial records and may be retried.
- Audio blob key: `__audio__`. Cover art blob key: `__cover__` (not stored as data URLs in `trackMeta`).
- Before writing large blobs, soft quota check via `navigator.storage.estimate()`: if `usage + size > quota * 0.85`, evict oldest `ready` tracks by `downloadedAt` until under the limit (no-op when quota unknown).
- Settings → “Clear all cache” asks for confirmation, then clears audio/cover blobs + extracted metadata and the enrich queue (not the now-playing queue in localStorage), resets in-memory display fields to config-only, and re-enqueues enrichment.
- Public cache API for app code: `lib/musicCache` (including `putCoverFile`). `trackMetadata` / `cacheStore` / `cacheIngest` / `cacheEviction` are internal to the cache stack.

## Client persistence (`localStorage` via `clientStorage`)

- Keys: `tdmusic.locale`, `tdmusic.configUrl`, `tdmusic.player`, `tdmusic.searchHistory`.
- `tdmusic.searchHistory`: JSON string array of recent search queries (newest first, max 10, case-insensitive dedupe). Written when the user presses Enter on Search (or reuses a history chip).
- Writes catch `QuotaExceededError` and return failure instead of throwing.
- Player payload includes `v: 1`; unknown versions are ignored. Legacy payloads without `v` are still accepted.

## Locale

- UI language (`en` / `zh`) persists under `localStorage` key `tdmusic.locale`.
- Missing, blank, or unknown values → default `en`. Header language options (desktop dropdown / drawer Language group) write on change; i18n boots from the stored value.

## Header navigation

- Top-level order: Now Playing, Music List, Playlist, Artist List, Album List, More, Language.
- There is no Home nav item; clicking the brand title (`tdmusic` + icon) navigates to `/`.
- **More** is a submenu (desktop dropdown / drawer group) with Search, Settings, configs.json guideline, About, Logs, and Feedback. Logs (`/logs`) lists persisted app logs and can clear them. Feedback opens the GitHub issues page (`https://github.com/mengtaoxin/tdmusic/issues`) in a new tab.
- **Language** is the same submenu pattern as **More**: one entry in `navItems` with locale children (`English` / `中文`). Desktop uses a dropdown (same `size="small"` / height / font-size as other nav buttons); the drawer uses a `v-list-group` (not a separate flat locale block).
- Desktop nav **More** / **Language** activators use the same computed font-size as the router-link nav items beside them.
- When horizontal nav links fit beside the brand without clipping, show them in the app bar.
- When they would be clipped (narrow viewport or content wider than the remaining space), hide the desktop links and show the hamburger instead — not only at a fixed breakpoint.
- Brand title stays leftmost; when collapsed, the hamburger follows it.
- Brand title text, desktop nav labels, and the hamburger icon share one vertical centerline in the app bar (same mid-row alignment).
- Hamburger opens a temporary left drawer with the same `navItems` (including **More** and **Language** groups). Navigating or choosing a locale closes the drawer.
- Every nav route and locale option shows a prepend MDI icon (drawer and desktop nav). Locale options use `mdi-translate`.
- Brand title (`tdmusic` + icon) does not shrink under desktop nav; the title stays fully visible.

## App logs (IndexedDB `tdmusic-logs`)

- Separate from the music cache DB. Object store `logs` holds `{ id, at, message }` (auto-increment `id`).
- Max **100** entries; appending beyond that drops the oldest.
- Messages are **English only** (see [conventions.md](conventions.md)); Logs page chrome is still i18n.
- Public API: `lib/appLogStore` (`appendAppLog`, `listAppLogs`, `clearAppLogs`).
- When play-time download fails (`resolvePlayableUrl` / cache ingest), `AudioHost` appends a failure log, skips that track (`player.skip`), and continues; after a full queue of consecutive failures it pauses.

## Cover images

- Extracted covers are stored as Blobs in IndexedDB (`files` / `__cover__`) and surfaced to the UI as `blob:` object URLs.
- All cover art goes through `CoverImg`, which loads the image only after the element enters the viewport (`IntersectionObserver`). Pass `eager` only when the image must load immediately.
- Music List also virtualizes rows (`v-virtual-scroll`), so off-screen track rows (and their covers) are not mounted.

## Playback

- Pinia stores: `settings`, `catalog`, `player`.
- Single `<audio>` in `AudioHost` (mounted from `App.vue`) so playback survives route changes. Download/resolve/enrich/prefetch/failure-skip orchestration lives in `lib/playbackSession` (`createPlaybackSession`); `AudioHost` wires the element, Pinia, and Media Session.
- `AudioHost` syncs the Web **Media Session** API (when available): metadata (title / artist / album / cover), `setPositionState` for lock-screen progress, and handlers for play, pause, previous track, next track, and seekto (scrub). Seek ±N (`seekbackward` / `seekforward`) are explicitly cleared so compact lock-screen / notification controls show previous/next track instead of ±10s.
- If another app / the OS pauses the element, `AudioHost` clears `pendingPlay` and `playing` so the next play click re-invokes `audio.play()` (otherwise `pendingPlay` stayed true and the watcher did not re-run).
- `pendingPlay` only resumes when the `<audio>` element is already bound to `currentId`. Changing tracks (queue click / next / prev) autoplays via `loadCurrent` after the new src resolves — it must not play the previous track’s still-loaded src (common after long idle + OS pause).
- On `/now-playing`, queue rows use the underlying queue index (unique row keys `index:id`) so clicks and removes stay correct when catalog ids are missing or duplicated. The active row is keyed by `currentIndex`, not `currentId`, so only the playing occurrence highlights when the same id appears more than once.
- The app footer shows cover, title, artist, previous / play-pause / next, and a seekable progress bar; tapping the meta area opens `/now-playing`.
- Clicking a track in Music List (or other lists) clears the now-playing queue and plays that track with the **full source list** as context (album / playlist / library ids): prefix through the clicked track is applied immediately so Previous works; the remainder fills asynchronously in chunks.
- Now-playing state (`queue`, `originalQueue`, `currentId`, `currentIndex`, `currentTime`, `repeatMode`, `shuffle`) persists under `localStorage` key `tdmusic.player`. On reload, hydrate after catalog load; restore paused at the saved position. Legacy payloads without `originalQueue` treat the saved `queue` as the original order. Legacy payloads without `currentIndex` resolve the first matching `currentId` in the queue.
- Shuffle (Spotify-style): turning **on** keeps the current track (and any prefix before it) and randomly reorders only the upcoming tail; turning **off** restores `originalQueue`. Next/previous always walk the current `queue` in order. Starting playback while shuffle is already on shuffles the upcoming tail once the queue fill finishes.
- Repeat **one** sets `audio.loop` so the current track continues after it ends; repeat **all** / **off** advance (or stop) via the `ended` handler.
- Manual next / previous under repeat **one** still leave the current track and play the adjacent queue item (same advance rules as repeat **off**); only natural end-of-track loops the current song.
- If the current track’s download link fails while loading, skip it, write an English failure log, and try the next queue item (`player.skip`).
- On `/now-playing`, the current track’s artist links to `/artists/{name}/albums` and the album links to `/artists/{name}/albums/{album}`.
- Track rows expose a ⋮ menu: **Play next** inserts after the current track; **Add to queue** appends at the end. Duplicates are allowed. With an empty queue, either action starts playback with that single track.
- On `/now-playing`, each queue row can **Remove from queue**; **Clear upcoming** drops everything after the current track. Removing the current track advances to the next (or previous if none), or clears and pauses when it was the only track.
# Project specific docs

## Catalog (`configs.json`)

- Default URL: `/configs.json` (from `public/configs.json`).
- Override with `localStorage` key `tdmusic.configUrl` (Settings page; via `clientStorage`). Empty/whitespace → default.
- Settings links to **Config Guides** (`/config-guides`) for a field-by-field explanation of `configs.json`.
- `music-list` entries require `id` and `path`. Missing either, or duplicate `id`, drops the entry and surfaces an error in Music List.
- Optional fields: `title`, `artist`, `album`, `cover`. Config values win over extracted ID3.
- Track title fallback order: config → ID3 → filename from `path`/`url` (decoded basename without extension) → `id`.
- Missing artist/album metadata resolves to stable labels `Unknown artist` / `Unknown album` (UI shows localized 未知歌手 / 未知专辑). Those tracks still group under artist → albums → tracks.
- `playlists` is an array of playlists; each references tracks by `id` (resolved against accepted tracks only). Legacy singular `playlist` is still accepted as one playlist.
- `/playlists` lists playlists (empty catalog shows a short empty state plus Config Guides link); `/playlists/{name}` shows that playlist’s tracks (`name` is the playlist title).
- `/artists` lists artists; `/artists/{name}/albums` lists that artist’s albums plus **All music by this artist** (escape hatch when album metadata is wrong); `/artists/{name}/albums/{album}` shows that album’s tracks; `/artists/{name}` shows all tracks by the artist.
- `/albums` lists albums as a cover gallery (each tile shows the first track cover in that album, or a placeholder); `/albums/{name}` shows that album’s tracks (click a track to play).
- After catalog load, track enrichment (ID3 from already-cached audio/extract only — **no** download) runs through an enrich queue with concurrency **2**. Audio downloads into IndexedDB on play via `resolvePlayableUrl` (both `http(s)://` and site-absolute `/…` paths); after a successful load, that track is re-enqueued for enrichment (may use the cached blob for ID3). Orchestration lives in `lib/enrichTracks`; the catalog store schedules and applies display patches. Reloading or clearing cache drops queued enrich work.
- App bootstrap and Settings save/reload use `loadCatalogAndHydratePlayer` (catalog load + player hydrate). Settings “Clear all cache” confirms, then uses `clearMusicCachesAndRefresh` (IndexedDB clear + reset in-memory `display*` to config-only + re-enqueue enrich).

## Audio cache (IndexedDB `music-cache`, schema v1)

- Playable paths (`http(s)://` and site-absolute `/…`) are downloaded into IndexedDB on play.
- After the current track loads successfully, up to the next **3** upcoming queue tracks are also prefetched into IndexedDB (`prefetchUpcoming` / `upcomingQueueIds`): linear forward when shuffle is off (wraps when repeat **all**); up to 3 other distinct ids at random when shuffle is on; none when repeat **one**. Best-effort; failures are ignored. Queue chunk appends re-trigger prefetch so early `playFrom` heads still fill the window.
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
- Missing, blank, or unknown values → default `en`. Header language options (desktop dropdown / drawer) write on change; i18n boots from the stored value.

## Header navigation

- Top-level order: Now Playing, Music List, Playlist, Artist List, Album List, Search, More, Language.
- There is no Home nav item; clicking the brand title (`tdmusic` + icon) navigates to `/`.
- **More** is a submenu (desktop dropdown / drawer group) with Settings, About, and Logs. Logs (`/logs`) lists persisted app logs and can clear them.
- **Language** is a desktop-nav dropdown (same `size="small"` / height / font-size as other nav buttons) with `English` / `中文`. When the nav is collapsed, those locale options appear in the drawer instead.
- Desktop nav **More** / **Language** activators use the same computed font-size as the router-link nav items beside them.
- When horizontal nav links fit beside the brand without clipping, show them in the app bar.
- When they would be clipped (narrow viewport or content wider than the remaining space), hide the desktop links and show the hamburger instead — not only at a fixed breakpoint.
- Brand title stays leftmost; when collapsed, the hamburger follows it.
- Brand title text, desktop nav labels, and the hamburger icon share one vertical centerline in the app bar (same mid-row alignment).
- Hamburger opens a temporary left drawer with the same routes plus language options (`English` / `中文`). Navigating closes the drawer.
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
- Single `<audio>` in `AudioHost` (mounted from `App.vue`) so playback survives route changes.
- If another app / the OS pauses the element, `AudioHost` clears `pendingPlay` and `playing` so the next play click re-invokes `audio.play()` (otherwise `pendingPlay` stayed true and the watcher did not re-run).
- Clicking a track in Music List (or other lists) clears the now-playing queue, plays that track, then asynchronously appends following tracks in chunks.
- Now-playing state (`queue`, `currentId`, `currentTime`, `repeatMode`, `shuffle`) persists under `localStorage` key `tdmusic.player`. On reload, hydrate after catalog load; restore paused at the saved position.
- Repeat **one** sets `audio.loop` so the current track continues after it ends; repeat **all** / **off** advance (or stop) via the `ended` handler.
- Manual next / previous under repeat **one** still leave the current track and play the adjacent queue item (same advance rules as repeat **off**); only natural end-of-track loops the current song.
- If the current track’s download link fails while loading, skip it, write an English failure log, and try the next queue item (`player.skip`).
- On `/now-playing`, the current track’s artist links to `/artists/{name}/albums` and the album links to `/artists/{name}/albums/{album}`.

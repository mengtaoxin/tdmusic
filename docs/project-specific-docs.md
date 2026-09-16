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
- `/playlists` lists playlists; `/playlists/{name}` shows that playlist’s tracks (`name` is the playlist title).
- `/artists` lists artists; `/artists/{name}/albums` lists that artist’s albums plus **All music by this artist** (escape hatch when album metadata is wrong); `/artists/{name}/albums/{album}` shows that album’s tracks; `/artists/{name}` shows all tracks by the artist.
- `/albums` lists albums; `/albums/{name}` shows that album’s tracks (click a track to play).
- After catalog load, track enrichment (ID3 from already-cached audio/extract only — **no** remote download) runs through an enrich queue with concurrency **2**. Remote audio downloads on play via `resolvePlayableUrl`; after a successful load, that track is re-enqueued for enrichment (may fetch site-absolute audio for ID3). Orchestration lives in `lib/enrichTracks`; the catalog store schedules and applies display patches. Reloading or clearing cache drops queued enrich work.
- App bootstrap and Settings save/reload use `loadCatalogAndHydratePlayer` (catalog load + player hydrate). Settings “Clear all cache” confirms, then uses `clearMusicCachesAndRefresh` (IndexedDB clear + reset in-memory `display*` to config-only + re-enqueue enrich).

## Audio cache (IndexedDB `music-cache`, schema v1)

- Only `http(s)://` paths are downloaded into IndexedDB.
- Site-absolute paths (`/…`) play directly without caching.
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
- Missing, blank, or unknown values → default `en`. Header drawer language options write on change; i18n boots from the stored value.

## Header navigation

- When horizontal nav links fit beside the brand without clipping, show them in the app bar.
- When they would be clipped (narrow viewport or content wider than the remaining space), hide the desktop links and show the hamburger instead — not only at a fixed breakpoint.
- Brand title stays leftmost; when collapsed, the hamburger follows it.
- Hamburger opens a temporary left drawer with the same routes plus language options (`English` / `中文`). Language is not a separate app-bar control. Navigating closes the drawer.
- Every nav route and locale option shows a prepend MDI icon (drawer and desktop nav). Locale options use `mdi-translate`.
- Brand title (`tdmusic` + icon) does not shrink under desktop nav; the title stays fully visible.

## Cover images

- Extracted covers are stored as Blobs in IndexedDB (`files` / `__cover__`) and surfaced to the UI as `blob:` object URLs.
- All cover art goes through `CoverImg`, which loads the image only after the element enters the viewport (`IntersectionObserver`). Pass `eager` only when the image must load immediately.
- Music List also virtualizes rows (`v-virtual-scroll`), so off-screen track rows (and their covers) are not mounted.

## Playback

- Pinia stores: `settings`, `catalog`, `player`.
- Single `<audio>` in `AudioHost` (mounted from `App.vue`) so playback survives route changes.
- Clicking a track in Music List (or other lists) clears the now-playing queue, plays that track, then asynchronously appends following tracks in chunks.
- Now-playing state (`queue`, `currentId`, `currentTime`, `repeatMode`, `shuffle`) persists under `localStorage` key `tdmusic.player`. On reload, hydrate after catalog load; restore paused at the saved position.
- Repeat **one** sets `audio.loop` so the current track continues after it ends; repeat **all** / **off** advance (or stop) via the `ended` handler.
- On `/now-playing`, the current track’s artist links to `/artists/{name}/albums` and the album links to `/artists/{name}/albums/{album}`.

# Client persistence, locale, and app logs

Catalog config cache usage: [catalog.md](catalog.md). Player queue fields: [playback.md](playback.md).

## Client persistence (`localStorage` via `clientStorage`)

- Keys: `tdmusic.locale`, `tdmusic.configUrl`, `tdmusic.configs`, `tdmusic.player`, `tdmusic.searchHistory`.
- `tdmusic.configs`: JSON `{ url, data }` for the last successfully fetched `configs.json`. Used when `url` matches the resolved config URL.
- `tdmusic.searchHistory`: JSON string array of recent search queries (newest first, max 10, case-insensitive dedupe). Written when the user presses Enter on Search (or reuses a history chip).
- Writes catch `QuotaExceededError` and return failure instead of throwing.
- Player payload includes `v: 1`; unknown versions are ignored. Legacy payloads without `v` are still accepted.

## Locale

- UI language (`en` / `zh`) persists under `localStorage` key `tdmusic.locale`.
- Missing, blank, or unknown values → default `en`. Changing language from the header writes this key; i18n boots from the stored value. Header Language control layout: [ui-chrome.md](ui-chrome.md).

## App logs (IndexedDB `tdmusic-logs`)

- Separate from the music cache DB. Object store `logs` holds `{ id, at, message }` (auto-increment `id`).
- Max **100** entries; appending beyond that drops the oldest.
- Messages are **English only** (see [conventions.md](conventions.md)); Logs page chrome is still i18n.
- Public API: `lib/appLogStore` (`appendAppLog`, `listAppLogs`, `clearAppLogs`).
- Logs page “Clear logs” asks for confirmation, then calls `clearAppLogs`.
- When play-time download fails (`resolvePlayableUrl` / cache ingest), the playback transport appends a failure log, skips that track (`player.skip`), and continues; after a full queue of consecutive failures it pauses.

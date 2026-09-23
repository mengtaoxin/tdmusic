# tdmusic

[中文说明](docs/README.zh.md)

A browser music player driven by **your** `configs.json`: list tracks (and optional playlists) in that file, point the app at its URL in Settings, and play. No backend — audio is fetched on play, cached in IndexedDB, and browsable by playlist, artist, album, or search. UI is English / 中文.

**How you use it:** host or edit a `configs.json` with a `music-list` of `{ id, path }` entries and optional `playlists` that reference tracks by `id`, then set the catalog URL in Settings. The repo’s `/configs.json` is only a sample for local demos. Field-by-field help lives in the app under **More → Guidelines for configs.json**.

## Features

- Library entirely from your `configs.json` (set the catalog URL in Settings; bundled file is a sample)
- Playback with queue, shuffle, and repeat; state survives reloads
- Offline-friendly audio + cover cache in IndexedDB (prefetch upcoming tracks)
- ID3 enrichment from cached audio when config metadata is incomplete
- Browse: Music List, Playlists, Artists, Albums, Search
- In-app Guidelines for configs.json and Logs

## Requirements

- Node.js `^22.18.0` or `^24.12.0` (see `package.json` `engines`)

## Quick start

```sh
npm install
npx playwright install chromium firefox webkit
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Stop with Ctrl+C.

Commands and options: [docs/commands.md](docs/commands.md).

| Command | Purpose |
| ------- | ------- |
| `npm install` + Playwright install | Install dependencies and browsers |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run format && npm run lint && npm run type-check` | Format + lint + type-check (**writes files**) |
| `npm run test:unit` / `test:e2e` | Unit (Vitest) / e2e (Playwright) |

```sh
npm run test:unit
npm run test:unit -- src/__tests__/App.spec.tsx
npm run test:e2e -- --project chromium
npm run test:e2e -- --project chromium -- e2e/app.spec.ts
```

## Catalog (`configs.json`)

Your library is whatever **your** `configs.json` describes — host it anywhere reachable, set the URL in Settings, and reload. The file under `public/` is only a sample catalog for trying the app locally.

| Piece | Role |
| ----- | ---- |
| Sample (dev) | [`public/configs.json`](public/configs.json) → `/configs.json` |
| Your catalog | Settings → catalog URL (`tdmusic.configUrl`) |
| `music-list` | Required: each track needs unique `id` + `path` (URL to the audio) |
| Optional fields | `title`, `artist`, `album`, `cover`, `volume-ratio` (win over extracted ID3; `volume-ratio` defaults to `100`, max `200`) |
| `playlists` | Arrays of `{ title, music-list: [{ id }] }` referencing track ids |

Example shape:

```json
{
  "music-list": [
    {
      "id": "track-1",
      "title": "Track 1",
      "artist": "Artist 1",
      "album": "Album 1",
      "path": "https://example.com/audio/track-1.mp3"
    }
  ],
  "playlists": [
    {
      "title": "My Playlist1",
      "music-list": [{ "id": "track-1" }]
    }
  ]
}
```

More detail: app **More → Guidelines for configs.json**, and [docs/catalog.md](docs/catalog.md).

## Stack

React · Vite · TypeScript · Zustand · TanStack Router · react-i18next · MUI · Vitest · Playwright

## Docs

| Doc | Contents |
| --- | -------- |
| [docs/README.zh.md](docs/README.zh.md) | Chinese README |
| [docs/change-code-steps.md](docs/change-code-steps.md) | TDD, structure, tests, format/check |
| [docs/file-structure.md](docs/file-structure.md) | Repository layout |
| [docs/tech-stack.md](docs/tech-stack.md) | Versions and libraries |
| [docs/commands.md](docs/commands.md) | Script conventions |
| [docs/conventions.md](docs/conventions.md) | Coding conventions |
| [docs/testing.md](docs/testing.md) | Test layers and naming |
| [docs/catalog.md](docs/catalog.md) | `configs.json`, catalog routes, enrich |
| [docs/cache.md](docs/cache.md) | IndexedDB audio cache and covers |
| [docs/playback.md](docs/playback.md) | Queue, shuffle, Media Session |
| [docs/persistence.md](docs/persistence.md) | localStorage, locale, app logs |
| [docs/ui-chrome.md](docs/ui-chrome.md) | Header layout and nav chrome |

## License

[MIT](LICENSE)

# tdmusic

[中文说明](docs/README.zh.md)

A browser music player that reads your library from a JSON catalog. No backend: tracks are fetched on play, cached in IndexedDB, and browsed by playlist, artist, album, or search. UI is English / 中文.

## Features

- Catalog-driven library via `configs.json` (override URL in Settings)
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

## Catalog

Default catalog: [`public/configs.json`](public/configs.json) served at `/configs.json`.

Each `music-list` entry needs `id` and `path` (`http(s)://` or site-absolute `/…`). Optional `title`, `artist`, `album`, and `cover` override extracted tags. Playlists reference tracks by `id`.

Field-by-field help is in the app under **More → Guidelines for configs.json**, and in [docs/catalog.md](docs/catalog.md).

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

Private / unpublished (`package.json` `"private": true`).

# tdmusic

[中文说明](docs/README.zh.md)

A browser music player that reads your library from a JSON catalog. No backend: tracks are fetched on play, cached in IndexedDB, and browsed by playlist, artist, album, or search. UI is English / 中文.

## Features

- Catalog-driven library via `configs.json` (override URL in Settings)
- Playback with queue, shuffle, and repeat; state survives reloads
- Offline-friendly audio + cover cache in IndexedDB (prefetch upcoming tracks)
- ID3 enrichment from cached audio when config metadata is incomplete
- Browse: Music List, Playlists, Artists, Albums, Search
- In-app configs.json guideline and Logs

## Requirements

- Node.js `^22.18.0` or `^24.12.0` (see `package.json` `engines`)

## Quick start

```sh
./scripts/install-dependency.sh
./scripts/dev-start.sh
```

Open [http://localhost:3000](http://localhost:3000). Stop with `./scripts/dev-stop.sh`.

Flags and extra options: [docs/commands.md](docs/commands.md).

| Script | Purpose |
| ------ | ------- |
| `./scripts/install-dependency.sh` | Install dependencies |
| `./scripts/dev-start.sh` / `dev-stop.sh` | Start / stop the Vite dev server |
| `./scripts/build.sh` | Production build |
| `./scripts/format.sh` | Format (**writes files** by default; `--check` is read-only) |
| `./scripts/test.sh` | Full test suite (unit + e2e) |

Run a single test file or one layer (e2e defaults to Chromium; add browsers with `--platform`):

```sh
./scripts/test.sh --layer unit
./scripts/test.sh --file src/__tests__/App.spec.ts
./scripts/test.sh --file e2e/vue.spec.ts
./scripts/test.sh --platform chrome,firefox,webkit
```

## Catalog

Default catalog: [`public/configs.json`](public/configs.json) served at `/configs.json`.

Each `music-list` entry needs `id` and `path` (`http(s)://` or site-absolute `/…`). Optional `title`, `artist`, `album`, and `cover` override extracted tags. Playlists reference tracks by `id`.

Field-by-field help is in the app under **More → configs.json guideline**, and in [docs/project-specific-docs.md](docs/project-specific-docs.md).

## Stack

Vue 3 · Vite · TypeScript · Pinia · Vue Router · vue-i18n · Vuetify 4 · Vitest · Playwright

## Docs

| Doc | Contents |
| --- | -------- |
| [docs/README.zh.md](docs/README.zh.md) | Chinese README |
| [docs/file-structure.md](docs/file-structure.md) | Repository layout |
| [docs/tech-stack.md](docs/tech-stack.md) | Versions and libraries |
| [docs/commands.md](docs/commands.md) | Script conventions |
| [docs/conventions.md](docs/conventions.md) | Coding conventions |
| [docs/testing.md](docs/testing.md) | Test layers and naming |
| [docs/project-specific-docs.md](docs/project-specific-docs.md) | Catalog, cache, playback behavior |
| [docs/ui-chrome.md](docs/ui-chrome.md) | Header layout and nav chrome |

## License

Private / unpublished (`package.json` `"private": true`).

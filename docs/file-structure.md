# File structure

Repository layout for tdmusic. Library versions: [tech-stack.md](tech-stack.md). Agent entry: `AGENTS.md`.

```
.
├── AGENTS.md
├── .cursor/mcp.json              Shared MCP servers
├── .cursor/rules/                Shared Cursor rules (sandbox, path-scoped)
├── docs/                         Project docs (this file, commands, conventions, …)
├── e2e/                          Playwright specs
├── public/                       Static assets + default configs.json
├── src/
│   ├── __tests__/                Vitest setup + app-level specs only (e.g. App.spec.tsx)
│   ├── assets/
│   ├── components/               Shared UI (.tsx) + colocated __tests__/
│   ├── hooks/                    React hooks (use*) + colocated __tests__/
│   ├── i18n/                     react-i18next bootstrap
│   ├── lib/                      Framework-agnostic helpers + colocated __tests__/
│   │   ├── cache/                IndexedDB audio cache (public: musicCache)
│   │   ├── catalog/              configs.json load, normalize, enrich, labels, index, bootstrap
│   ├── lib/                      Framework-agnostic helpers + colocated __tests__/
│   │   ├── cache/                IndexedDB audio cache (public: musicCache)
│   │   ├── catalog/              configs.json load, normalize, enrich, labels, index, bootstrap
│   │   ├── playback/             queue session, persist codec, transport, media session, prefetch
│   │   └── routes/               album / artist / playlist path helpers
│   ├── locales/                  i18n message modules (en, zh)
│   ├── routes/                   TanStack Router file routes + routeTree.gen.ts
│   ├── stores/                   Zustand stores + catalog/playback bind + colocated __tests__/
│   ├── styles/                   Global app CSS
│   ├── theme/                    MUI theme
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

## Path roles

| Path | Role |
| ---- | ---- |
| `.cursor/mcp.json` | Shared MCP server config (API keys via env) |
| `.cursor/rules/` | Versioned Cursor rules |
| `src/` | React SPA source |
| `src/components/` | Shared React components (`.tsx`) |
| `src/hooks/` | React hooks (`use*`) |
| `src/lib/` | Framework-agnostic helpers (small shared utilities at the root) |
| `src/lib/cache/` | IndexedDB audio cache; app code imports `musicCache` only |
| `src/lib/catalog/` | configs.json load, normalize, enrich, display labels, catalog index, load+hydrate orchestration |
| `src/lib/playback/` | Queue session, player math, persist codec, transport, media session, prefetch |
| `src/lib/routes/` | Album / artist / playlist route helpers |
| `src/stores/` | Zustand stores |
| `src/locales/` | Locale message modules (wired via `src/i18n/`) |
| `src/i18n/` | react-i18next setup |
| `src/theme/` | MUI theme (`muiTheme`) |
| `src/styles/` | Global CSS |
| `src/routes/` | TanStack Router file-based routes (`routeTree.gen.ts` is generated) |
| `src/__tests__/` | Vitest `setup.ts` and app-level specs — not the default test location |
| `e2e/` | Playwright specs |
| `public/` | Static assets; default `configs.json` at `/configs.json` |

## Placement rules

- Imports use `@/`.
- Route-level pages → `src/routes/`. Shared UI → `src/components/`. React hooks (`use*`) → `src/hooks/`.
- Framework-agnostic helpers → `src/lib/`, grouped as `cache/`, `catalog/`, `playback/`, or `routes/` when they belong to those domains. Small shared utilities may stay at `src/lib/` root.
- Cache internals (`cacheStore`, `cacheIngest`, `cacheEviction`, `trackMetadata`, `downloadLimiter`) stay inside `src/lib/cache/`; app code imports `musicCache`.
- Catalog query/index helpers (`catalogIndex`: `DisplayTrack`, grouping, search, enrich patches) live in `src/lib/catalog/`; the catalog store holds the snapshot and schedules enrich.
- Catalog load+hydrate orchestration (`createCatalogBootstrap`, `runCatalogLoad`) lives in `src/lib/catalog/` and is framework-agnostic. App/test startup binds Zustand ports via `bindAppCatalogBootstrap` (`src/stores/bindAppCatalog.ts`). Public `ensureCatalogLoaded` / `loadCatalogAndHydratePlayer` stay on `catalogBootstrap.ts`.
- Playback queue mutations (`playbackQueue`) and persist codec (`playerStateCodec`) live in `src/lib/playback/`. Transport ports bind at `src/stores/bindAppPlayback.ts` (`createAppPlaybackTransport`); `AudioHost` only wires the element and React effects.
- Locale strings → `src/locales/`; i18n bootstrap → `src/i18n/`.
- Unit tests colocate next to the module: `src/{hooks,lib,routes,components,stores}/**/__tests__/*.{spec,test}.{ts,tsx}`. Do not put new specs in `src/__tests__/` unless they are app-level (see [testing.md](testing.md)).

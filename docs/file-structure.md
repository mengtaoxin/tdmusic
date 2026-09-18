# File structure

Repository layout for tdmusic. Library versions: [tech-stack.md](tech-stack.md). Agent entry: `AGENTS.md`.

```
.
├── AGENTS.md
├── .cursor/mcp.json              Shared MCP servers
├── .cursor/rules/                Shared Cursor rules (sandbox, path-scoped)
├── docs/                         Project docs (this file, commands, conventions, …)
├── scripts/                      Dev start/stop + _lib.sh (install/format/build/test via package.json)
├── e2e/                          Playwright specs
├── public/                       Static assets + default configs.json
├── src/
│   ├── __tests__/                Vitest setup + app-level specs only (e.g. App.spec.ts)
│   ├── assets/
│   ├── components/               Shared UI + colocated __tests__/
│   ├── composables/              Vue composables (use*) + colocated __tests__/
│   ├── lib/                      Framework-agnostic helpers + colocated __tests__/
│   │   ├── cache/                IndexedDB audio cache (public: musicCache)
│   │   ├── catalog/              configs.json load, normalize, enrich, labels, index, bootstrap
│   │   ├── playback/             player math, session, transport, media session, prefetch
│   │   └── routes/               album / artist / playlist path helpers
│   ├── locales/                  vue-i18n message modules (en, zh)
│   ├── plugins/                  App plugins (Vuetify, i18n)
│   ├── router/
│   ├── stores/                   Pinia stores + colocated __tests__/
│   ├── views/                    Route-level pages + colocated __tests__/
│   ├── App.vue
│   └── main.ts
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
| `scripts/` | Dev server start/stop wrappers (`_lib.sh` shared helpers) |
| `src/` | Vue SPA source |
| `src/components/` | Shared Vue components |
| `src/composables/` | Vue composables (`use*`) |
| `src/lib/` | Framework-agnostic helpers (small shared utilities at the root) |
| `src/lib/cache/` | IndexedDB audio cache; app code imports `musicCache` only |
| `src/lib/catalog/` | configs.json load, normalize, enrich, display labels, catalog index, load+hydrate orchestration |
| `src/lib/playback/` | Player math, playback session, transport, media session, prefetch |
| `src/lib/routes/` | Album / artist / playlist route helpers |
| `src/stores/` | Pinia stores |
| `src/locales/` | vue-i18n locale message modules |
| `src/plugins/` | App plugins (Vuetify, i18n) |
| `src/router/` | Vue Router setup |
| `src/views/` | Route-level page SFCs |
| `src/__tests__/` | Vitest `setup.ts` and app-level specs — not the default test location |
| `e2e/` | Playwright specs |
| `public/` | Static assets; default `configs.json` at `/configs.json` |

## Placement rules

- Vue imports use `@/`.
- Route-level pages → `src/views/`. Shared UI → `src/components/`. Vue composables (`use*`) → `src/composables/`.
- Framework-agnostic helpers → `src/lib/`, grouped as `cache/`, `catalog/`, `playback/`, or `routes/` when they belong to those domains. Small shared utilities may stay at `src/lib/` root.
- Cache internals (`cacheStore`, `cacheIngest`, `cacheEviction`, `trackMetadata`, `downloadLimiter`) stay inside `src/lib/cache/`; app code imports `musicCache`.
- Catalog query/index helpers (`catalogIndex`: `DisplayTrack`, grouping, search, enrich patches) live in `src/lib/catalog/`; the catalog store holds the snapshot and schedules enrich.
- Catalog load+hydrate orchestration (`catalogBootstrap`) lives in `src/lib/catalog/`. It uses Pinia but is not a store.
- Playback transport (`playbackTransport`) binds the queue/player store to a single `<audio>` element; `AudioHost` only wires Vue watchers and the element.
- Locale strings → `src/locales/`.
- Unit tests colocate next to the module: `src/{composables,lib,views,components,stores}/**/__tests__/*.spec.ts`. Do not put new specs in `src/__tests__/` unless they are app-level (see [testing.md](testing.md)).

# File structure

Repository layout for tdmusic. Library versions: [tech-stack.md](tech-stack.md). Agent entry: `AGENTS.md`.

```
.
├── AGENTS.md
├── docs/                         Project docs (this file, commands, conventions, …)
├── scripts/                      Dev start/stop, build, test, install, format helpers
├── e2e/                          Playwright specs
├── public/                       Static assets + default configs.json
├── src/
│   ├── __tests__/                Vitest setup + specs
│   ├── assets/
│   ├── components/               Shared UI (AppHeader, AudioHost, TrackList, footer, …)
│   ├── lib/                      Pure helpers (catalog, cache, player/playback session, metadata)
│   ├── locales/                  vue-i18n message modules (en, zh)
│   ├── plugins/                  App plugins (Vuetify, i18n)
│   ├── router/
│   ├── stores/                   Pinia stores (settings, catalog, player) + catalogBootstrap
│   ├── views/                    Route-level pages
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
| `scripts/` | Wrapper scripts for install, format/lint, dev, build, test |
| `src/` | Vue SPA source |
| `src/components/` | Shared Vue components |
| `src/lib/` | Framework-agnostic helpers (cache, normalize, player math) |
| `src/stores/` | Pinia stores |
| `src/locales/` | vue-i18n locale message modules |
| `src/plugins/` | App plugins (Vuetify, i18n) |
| `src/router/` | Vue Router setup |
| `src/views/` | Route-level page SFCs |
| `src/__tests__/` | Vitest setup and unit specs |
| `e2e/` | Playwright specs |
| `public/` | Static assets; default `configs.json` at `/configs.json` |

## Placement rules

- Vue imports use `@/`.
- Prefer `./scripts/*` over raw `npm` / `npx` for day-to-day agent workflows (see [commands.md](commands.md)).

# tdmusic

## Rules

- Day-to-day workflows use `./scripts/*` — do not run `npm run` / `npx vitest` / `npx playwright` directly. Flags and examples: [docs/commands.md](docs/commands.md).
- Behavior changes follow [docs/test-driven-development.md](docs/test-driven-development.md) (including the full test suite before finishing).
- Place new files per [docs/file-structure.md](docs/file-structure.md). Unit tests sit next to the module in `__tests__/*.spec.ts`.
- UI copy: update both `src/locales/en.ts` and `src/locales/zh.ts`.
- Views that need the catalog call `ensureCatalogLoaded` — never `catalog.load()` alone.

## Read when

- Running scripts or a test layer → [docs/commands.md](docs/commands.md)
- Adding or moving files → [docs/file-structure.md](docs/file-structure.md)
- Style, Vuetify, log language → [docs/conventions.md](docs/conventions.md)
- Catalog, cache, playback, or storage contracts → [docs/project-specific-docs.md](docs/project-specific-docs.md) (the relevant section)
- Header layout or nav animation → [docs/ui-chrome.md](docs/ui-chrome.md)
- Stack and versions → [docs/tech-stack.md](docs/tech-stack.md)

# tdmusic

## Rules

- Install, format, dev, build, and tests in [docs/commands.md](docs/commands.md).
- Behavior changes follow the `test-driven-development` skill.
- Place new files per [docs/file-structure.md](docs/file-structure.md).
- i18n: update both `src/locales/en.ts` and `src/locales/zh.ts`.
- Views that need the catalog call `ensureCatalogLoaded` — never `catalog.load()` alone.

## Read when

- Running scripts or a test layer → [docs/commands.md](docs/commands.md)
- Test placement and naming → [docs/testing.md](docs/testing.md)
- Adding or moving files → [docs/file-structure.md](docs/file-structure.md)
- Style, MUI, log language → [docs/conventions.md](docs/conventions.md)
- `configs.json`, catalog routes, enrich, `ensureCatalogLoaded` → [docs/catalog.md](docs/catalog.md)
- IndexedDB audio cache, covers, download limiter → [docs/cache.md](docs/cache.md)
- Queue, shuffle, repeat, Media Session → [docs/playback.md](docs/playback.md)
- localStorage keys, locale, app logs → [docs/persistence.md](docs/persistence.md)
- Header layout or nav animation → [docs/ui-chrome.md](docs/ui-chrome.md)
- Stack and versions → [docs/tech-stack.md](docs/tech-stack.md)

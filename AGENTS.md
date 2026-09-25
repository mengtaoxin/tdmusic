# tdmusic

## Rules

- Changing code (structure, TDD, tests, format/check, i18n): [docs/change-code-steps.md](docs/change-code-steps.md).
- Views that need the catalog rely on root `beforeLoad` / `ensureCatalogLoaded` — do not fetch `configs.json` from views.
- Skills live in `.agents/skills/` — when a Cursor rule or skill description matches the task, read that skill’s `SKILL.md` before coding.

## Read when

- Local Cursor session / ports / concurrent chats → `.agents/skills/cursor-local-best-practices/`
- JS/TS edits or review → `.agents/skills/javascript-typescript-best-practices/`
- React components, hooks, effects → `.agents/skills/react-best-practices/`
- MUI / Material Design UI or theme → `.agents/skills/material-design-best-practices/`
- Changing code → [docs/change-code-steps.md](docs/change-code-steps.md)
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

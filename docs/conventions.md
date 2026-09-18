# Conventions

- Match nearby file style; keep React components (`.tsx`) and TypeScript consistent with existing `src/` code.
- **i18n:** Add, rename, or remove UI strings in both `src/locales/en.ts` and `src/locales/zh.ts`.
- **Styling:** Prefer MUI `sx`, theme palette, and layout tokens from `src/theme/muiTheme.ts` over raw values (`10px`, `#hex`) in UI code. Put recurring layout sizes in `theme.layout`; put brand colors in `palette`. Global chrome may use CSS variables from `src/styles/app.css`. One-off resets (`margin: 0`) and animation tweaks are fine when theme/`sx` are a poor fit. Do not introduce Tailwind, Vue, or another UI library (see [tech-stack.md](tech-stack.md)).
- **React performance:** Follow `.agents/skills/react-best-practices`. That skill’s SPA overlay wins over upstream Next.js, RSC, `next/dynamic`, and SWR examples. Do not add those libraries to “apply” a rule.
- **Catalog views:** Rely on root `beforeLoad` / `ensureCatalogLoaded` — do not fetch `configs.json` from views (see [catalog.md](catalog.md)).
- **Format:** `npm run format && npm run lint && npm run type-check` writes files; use Prettier/oxlint/eslint without `--fix` / `--write` for check-only (see [commands.md](commands.md)).
- **App logs:** Persist only English log messages (UI chrome on the Logs page may still be localized).

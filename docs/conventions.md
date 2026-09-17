# Conventions

- Match nearby file style; keep Vue SFCs and TypeScript consistent with existing `src/` code.
- **i18n:** Add, rename, or remove UI strings in both `src/locales/en.ts` and `src/locales/zh.ts`.
- **Styling:** Prefer Vuetify utilities (`pa-*`, `ma-*`, `ga-*`, `text-*`, `bg-*`, …) and theme CSS variables (`rgb(var(--v-theme-*))`, `var(--v-*)` from `theme.variables` in `src/plugins/vuetify.ts`) over raw values (`10px`, `#hex`) in UI CSS. Put recurring layout sizes in theme `variables`; put brand colors in theme `colors`. One-off resets (`margin: 0`) and animation tweaks are fine when utilities are a poor fit. Do not introduce Tailwind, Nuxt, React, or another UI library (see [tech-stack.md](tech-stack.md)).
- **Catalog views:** Call `ensureCatalogLoaded` when a view needs the catalog — never `catalog.load()` alone (see [project-specific-docs.md](project-specific-docs.md)).
- **Format:** `./scripts/format.sh` writes files by default, then type-checks; `--check` is read-only (see [commands.md](commands.md)).
- **App logs:** Persist only English log messages (UI chrome on the Logs page may still be localized).

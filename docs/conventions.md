# Conventions

- Prefer `./scripts/*` over raw `npm` / `npx` for install, format/lint, dev, build, and test.
- Match nearby file style; keep Vue SFCs and TypeScript consistent with existing `src/` code.
- **Styling:** Prefer Vuetify utilities (`pa-*`, `ma-*`, `ga-*`, `text-*`, `bg-*`, …) and theme CSS variables (`rgb(var(--v-theme-*))`, `var(--v-*)` from `theme.variables` in `src/plugins/vuetify.ts`) over raw values (`10px`, `#hex`) in UI CSS. Put recurring layout sizes in theme `variables`; put brand colors in theme `colors`. One-off resets (`margin: 0`) and animation tweaks are fine when utilities are a poor fit.

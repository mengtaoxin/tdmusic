# Conventions

- Match nearby file style; keep React components (`.tsx`) and TypeScript consistent with existing `src/` code.
- **i18n:** Add, rename, or remove UI strings in both `src/locales/en.ts` and `src/locales/zh.ts`.
- **Styling:** Prefer MUI `sx`, theme palette, and layout tokens from `src/theme/muiTheme.ts` over raw values (`10px`, `#hex`) in UI code. Put recurring layout sizes in `theme.layout`; put brand colors in `palette`. Global chrome may use CSS variables from `src/styles/app.css`. One-off resets (`margin: 0`) and animation tweaks are fine when theme/`sx` are a poor fit. Do not introduce Tailwind, Vue, or another UI library (see [tech-stack.md](tech-stack.md)).
- **Catalog views:** Rely on root `beforeLoad` / `ensureCatalogLoaded` — do not fetch `configs.json` from views (see [catalog.md](catalog.md)).
- **Finish a change:** [change-code-steps.md](change-code-steps.md). Format/lint/type-check commands: [commands.md](commands.md).
- **App logs:** Persist only English log messages (UI chrome on the Logs page may still be localized).
- **Failures:** print with `console.error` (`reportFailure`). Persist an English app log only for specific diagnostics (play-time download failure, media-element playback failure). `audio.play()` rejections are console-only.

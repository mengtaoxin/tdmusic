# Header and nav chrome

Top-bar layout, menus, and related visual behavior. Domain contracts (catalog, cache, playback) stay in [project-specific-docs.md](project-specific-docs.md).

## Header navigation

- Top-level order: Now Playing, Music List, Playlist, Artist List, Album List, More, Language.
- There is no Home nav item; clicking the brand title (`tdmusic` + icon) navigates to `/`.
- **More** is a submenu (desktop dropdown / drawer group) with Search, Settings, configs.json guideline, About, Logs, and Feedback. Logs (`/logs`) lists persisted app logs and can clear them after confirmation. Feedback opens the GitHub issues page (`https://github.com/mengtaoxin/tdmusic/issues`) in a new tab.
- **Language** is the same submenu pattern as **More**: one entry in `navItems` with locale children (`English` / `中文`). Desktop uses a dropdown (same `size="small"` / height / font-size as other nav buttons); the drawer uses a `v-list-group` (not a separate flat locale block).
- Desktop nav **More** / **Language** activators use the same computed font-size as the router-link nav items beside them.
- App `v-menu` dropdowns (desktop More / Language, track ⋮) use a fade open transition. Vuetify’s default dialog-scale animation sets `pointer-events: none` while entering, so touch taps on items often miss.
- When horizontal nav links fit beside the brand without clipping, show them in the app bar.
- When they would be clipped (narrow viewport or content wider than the remaining space), hide the desktop links and show the hamburger instead — not only at a fixed breakpoint.
- Brand title stays leftmost; when collapsed, the hamburger follows it.
- Brand title text, desktop nav labels, and the hamburger icon share one vertical centerline in the app bar (same mid-row alignment).
- Hamburger opens a temporary left drawer with the same `navItems` (including **More** and **Language** groups). Navigating or choosing a locale closes the drawer.
- Every nav route and locale option shows a prepend MDI icon (drawer and desktop nav). Locale options use `mdi-translate`.
- Brand title (`tdmusic` + icon) does not shrink under desktop nav; the title stays fully visible.

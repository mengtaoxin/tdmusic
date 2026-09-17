# Header and nav chrome

Top-bar layout, menus, and related visual behavior. Domain contracts (catalog, cache, playback) stay in [project-specific-docs.md](project-specific-docs.md).

## Header navigation

- Top-level order: Now Playing, Music List, Playlist, Artist List, Album List, Language, More.
- **More** is last: rightmost in desktop nav, bottommost in the drawer.
- There is no Home nav item; clicking the brand title (`tdmusic` + icon) navigates to `/`.
- **More** is a submenu (desktop dropdown / drawer group) with Search, Settings, Guidelines for configs.json, About, Logs, and Feedback. Logs (`/logs`) lists persisted app logs and can clear them after confirmation. Feedback asks for confirmation, then opens the GitHub issues page (`https://github.com/mengtaoxin/tdmusic/issues`) in a new tab.
- **Language** is the same submenu pattern as **More**: one entry in `navItems` with locale children (`English` / `中文`). Desktop uses a dropdown (same `size="small"` / height / font-size as other nav buttons); the drawer uses a `v-list-group` (not a separate flat locale block).
- Desktop nav **More** / **Language** activators use the same computed font-size as the router-link nav items beside them.
- App `v-menu` dropdowns (desktop More / Language, track ⋮) use a fade open transition. Vuetify’s default dialog-scale animation sets `pointer-events: none` while entering, so touch taps on items often miss.
- Desktop Language / More menus are uncontrolled and remount on route change (`:key` includes the path) so navigation always leaves them closed. Do not bind a controlled `v-model` that can become `undefined` after a reset — that makes the next open click a no-op.
- When horizontal nav links fit beside the brand without clipping, show them in the app bar.
- When they would be clipped (narrow viewport or content wider than the remaining space), hide the desktop links and show the hamburger instead — not only at a fixed breakpoint.
- Brand title stays leftmost; when collapsed, the hamburger follows it.
- Brand title text, desktop nav labels, and the hamburger icon share one vertical centerline in the app bar (same mid-row alignment).
- Hamburger opens a temporary left drawer with the same `navItems` (including **More** and **Language** groups). Navigating or choosing a locale closes the drawer.
- Every nav route and locale option shows a prepend MDI icon (drawer and desktop nav). Locale options use `mdi-translate`.
- Brand title (`tdmusic` + icon) does not shrink under desktop nav; the title stays fully visible.

## Document scroll (mobile browser chrome)

- `html` / `body` / `#app` are height-locked with `overflow: hidden` so the **document** does not scroll.
- Page scroll lives in `v-main` (`scrollable` → `.v-main__scroller`) or in list hosts that use their own virtual scrollers. Scrollbar gutter styling applies to `.v-main__scroller`.
- Locked list shells (Music / Artists / Albums / artist albums) fill the main content box (`height: 100%`) rather than `calc(100dvh − …)`.
- This reduces mobile browser address/tool bar show/hide on swipe. It does **not** force browser chrome to stay permanently expanded or collapsed — that remains browser-controlled.

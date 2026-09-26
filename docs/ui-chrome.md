# Header and nav chrome

Top-bar layout, menus, and related visual behavior. Domain contracts: [catalog.md](catalog.md), [cache.md](cache.md), [playback.md](playback.md).

## Header navigation

- Top-level order: Now Playing, Music List, Playlist, Artist List, Album List, Language, More. Item data lives in `src/components/nav/navConfig.ts`; desktop vs drawer chrome are `AppDesktopNav` / `AppNavDrawer`.
- **More** is last: rightmost in desktop nav, bottommost in the drawer.
- There is no Home nav item; clicking the brand title (`tdmusic` + icon) navigates to `/`.
- **More** is a submenu (desktop dropdown / drawer group) with Search, Stats, Settings, Guidelines for configs.json, About, Logs, and Feedback. Stats (`/stats`) shows per-track play counts for the last 3 / 7 / 30 days. Logs (`/logs`) lists persisted app logs and can clear them after confirmation. Feedback asks for confirmation, then opens the GitHub issues page (`https://github.com/mengtaoxin/tdmusic/issues`) in a new tab.
- **Language** is the same submenu pattern as **More**: one entry in `navItems` with locale children (`English` / `中文`). Desktop uses an MUI `Menu` (same `size="small"` / height / font-size as other nav buttons); the drawer uses a collapsible `List` group (`Collapse`), not a separate flat locale block.
- Desktop nav **More** / **Language** activators use the same font-size as the router-link nav items beside them.
- App menus (desktop More / Language, track ⋮) use a short fade open transition so touch taps on items are not missed during enter.
- Desktop Language / More menus remount on route change (`key` includes the path) so navigation always leaves them closed.
- When horizontal nav links fit beside the brand without clipping, show them in the app bar.
- When they would be clipped (narrow viewport or content wider than the remaining space), hide the desktop links and show the hamburger instead — not only at a fixed breakpoint.
- Brand title stays leftmost; when collapsed, the hamburger follows it.
- Brand title text, desktop nav labels, and the hamburger icon share one vertical centerline in the app bar (same mid-row alignment).
- Hamburger opens a temporary left MUI `Drawer` with the same `navItems` (including **More** and **Language** groups). Navigating or choosing a locale closes the drawer.
- Every nav route and locale option shows a prepend Material icon (drawer and desktop nav). Locale options use the translate icon.
- Brand title (`tdmusic` + icon) does not shrink under desktop nav; the title stays fully visible.

## Document scroll (mobile browser chrome)

- `html` / `body` / `#root` are height-locked with `overflow: hidden` so the **document** does not scroll.
- Page scroll lives in `main.main-scroller` (`data-testid="main-scroller"`) or in list hosts that use their own virtual scrollers. Scrollbar gutter styling applies to `.main-scroller`.
- Direct children of `main.main-scroller` get `--td-page-top-inset` (`24px`) so page content is not flush with the header menu. Locked-height shells keep `box-sizing: border-box` so the inset is inside `height: 100%`.
- Locked list shells (Music / Artists / Albums / artist albums) fill the main content box (`height: 100%`) rather than `calc(100dvh − …)`.
- This reduces mobile browser address/tool bar show/hide on swipe. It does **not** force browser chrome to stay permanently expanded or collapsed — that remains browser-controlled.

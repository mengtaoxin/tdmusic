# Tech stack

tdmusic is a React SPA (Vite) at the repo root — no separate `api/` or `web/` apps.

## Frontend

| Area          | Choice                                          |
| ------------- | ----------------------------------------------- |
| Framework     | React 19                                        |
| Build         | Vite 8                                          |
| Language      | TypeScript 6.x                                  |
| Routing       | TanStack Router                                 |
| State         | Zustand                                         |
| i18n          | react-i18next (en default, zh)                  |
| UI            | MUI 9 + Emotion + Material Icons                |
| Virtual lists | @tanstack/react-virtual                         |
| Markdown      | marked (Config Guides page)                     |
| Audio meta    | music-metadata                                  |
| Shared kit    | tdkit → @mengtaoxin/tdkit (GitHub Packages)     |
| Lint / format | oxlint + oxfmt                                  |
| Unit tests    | Vitest + Testing Library                        |
| Coverage      | `@vitest/coverage-v8` (`npm run test:coverage`) |
| E2E           | Playwright                                      |
| PWA           | vite-plugin-pwa (manifest + app-shell SW)       |
| Node          | see `package.json` `engines`                    |

Prefer MUI components and theme/`sx`; use CSS modules or `src/styles/` for local tweaks. No Vue, Nuxt, or Tailwind.

## PWA

Production builds register a service worker (`registerType: 'autoUpdate'`) and inject a web app manifest (`standalone`, theme `#0b1c22`, icons `/pwa-192.png` and `/pwa-512.png`). The worker precaches the app shell and falls back to `index.html` for client-side routes. It does not cache audio or `configs.json` — playable files stay in IndexedDB (`musicCache`), and the catalog stays on the app’s own config cache. The dev server does not register the worker. Options live in `src/lib/pwa/pwaOptions.ts`.

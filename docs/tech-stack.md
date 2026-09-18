# Tech stack

tdmusic is a React SPA (Vite) at the repo root — no separate `api/` or `web/` apps.

## Frontend

| Area          | Choice                                      |
| ------------- | ------------------------------------------- |
| Framework     | React 19                                    |
| Build         | Vite 8                                      |
| Language      | TypeScript 6.x                              |
| Routing       | TanStack Router                             |
| State         | Zustand                                     |
| i18n          | react-i18next (en default, zh)              |
| UI            | MUI 9 + Emotion + Material Icons            |
| Virtual lists | @tanstack/react-virtual                     |
| Markdown      | marked (Config Guides page)                 |
| Audio meta    | music-metadata                              |
| Lint / format | ESLint + oxlint + Prettier                  |
| Unit tests    | Vitest + Testing Library                    |
| E2E           | Playwright                                  |
| Node          | see `package.json` `engines`                |

Prefer MUI components and theme/`sx`; use CSS modules or `src/styles/` for local tweaks. No Vue, Nuxt, or Tailwind.

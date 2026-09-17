# Tech stack

tdmusic is a Vue 3 SPA (Vite) at the repo root — no separate `api/` or `web/` apps.

## Frontend

| Area          | Choice                                      |
| ------------- | ------------------------------------------- |
| Framework     | Vue 3.5                                     |
| Build         | Vite 8                                      |
| Language      | TypeScript 6.x                              |
| Routing       | Vue Router 5                                |
| State         | Pinia                                       |
| i18n          | vue-i18n (en default, zh)                   |
| UI            | Vuetify 4 + MDI + Roboto                    |
| Markdown      | marked (Config Guides page)                 |
| Audio meta    | music-metadata                              |
| Lint / format | ESLint + oxlint + Prettier                  |
| Unit tests    | Vitest                                      |
| E2E           | Playwright                                  |
| Node          | see `package.json` `engines`                |

Prefer Vuetify components; use scoped CSS for local tweaks. No Nuxt, React, or Tailwind.

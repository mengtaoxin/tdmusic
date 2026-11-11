# Commands

When to run these while changing code: [change-code-steps.md](change-code-steps.md).

```sh
npm install
npx playwright install chromium firefox webkit
npm run dev
npm run build
npm run verify
npm run test:coverage
npm run test:e2e -- --project chromium
```

Use `package.json` scripts for day-to-day work.

## Install

```sh
npm install
npx playwright install chromium firefox webkit
```

## Format / lint / type-check

```sh
npm run format && npm run lint:fix && npm run type-check   # write
npm run check                                              # read-only: format:check + lint + type-check
npm run verify                                             # read-only: check + full unit suite + e2e
```

`npm run format` and `npm run lint:fix` write files; `format:check` / `lint` / `check` / `verify` do not.

## Dev server

```sh
npm run dev
```

Vite on port 3000. Stop with Ctrl+C.

## Build

```sh
npm run build
```

Type-check + Vite production build → `dist/`.

## Tests

| Command                                                     | Notes                                               |
| ----------------------------------------------------------- | --------------------------------------------------- |
| `npm run test`                                              | Vitest, full unit suite once                        |
| `npm run test:watch`                                        | Vitest watch mode (TTY; host only)                  |
| `npm run test:unit`                                         | Alias for `test:watch` (host only)                  |
| `npm run test -- path/to/spec.ts`                           | One unit file                                       |
| `npm run test:coverage`                                     | Vitest with V8 coverage (`text` + `coverage/` HTML) |
| `npm run test:e2e -- --project chromium`                    | Playwright e2e                                      |
| `npm run test:e2e -- --project chromium -- path/to/spec.ts` | One e2e file                                        |

By default those suite scripts (`test` / `test:coverage` / `test:e2e` / `verify`) run on the host. Set `RUN_TESTS_IN_CONTAINER=1` (exact `1` only; unset/`0` = host) so they run in an ephemeral [`ubuntu-b`](https://github.com/mengtaoxin/dockers/tree/main/ubuntu-b) container (`scripts/run-in-test-env.sh`, pin `docker/UBUNTU_B_VERSION`). Prefer a sibling `../dockers/ubuntu-b` build when present; otherwise pull the pinned GHCR tag. Nested suite calls inside the container do not spawn another container. Leave the var unset on Cursor Cloud. Edit / format / lint / `check` / `test:watch` stay on the host for day-to-day work.

`verify` runs e2e for all configured projects (chromium, firefox, webkit). Outside `verify`, always pass `--project` when you want a subset.

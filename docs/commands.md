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

Use `package.json` scripts for day-to-day work. Do not add `scripts/*.sh` wrappers.

## Install

```sh
npm install
npx playwright install chromium firefox webkit
```

## Format / lint / type-check

```sh
npm run format && npm run lint:fix && npm run type-check   # write
npm run check                                              # read-only: format:check + lint + type-check
npm run verify                                             # read-only: check + full unit suite
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
| `npm run test:watch`                                        | Vitest watch mode (TTY)                             |
| `npm run test:unit`                                         | Alias for `test:watch`                              |
| `npm run test -- path/to/spec.ts`                           | One unit file                                       |
| `npm run test:coverage`                                     | Vitest with V8 coverage (`text` + `coverage/` HTML) |
| `npm run test:e2e -- --project chromium`                    | Playwright; pick projects explicitly                |
| `npm run test:e2e -- --project chromium -- path/to/spec.ts` | One e2e file                                        |

E2E defaults in config include chromium, firefox, and webkit; always pass `--project` when you want a subset.

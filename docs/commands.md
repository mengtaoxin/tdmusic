# Commands

When to run these while changing code: [change-code-steps.md](change-code-steps.md).

```sh
npm install
npx playwright install chromium firefox webkit
npm run dev
npm run build
npm run format && npm run lint && npm run type-check
npm run test:unit
npm run test:coverage
npm run test:e2e -- --project chromium
```

Use `package.json` scripts for day-to-day work. Do not add `scripts/*.sh` wrappers.

## Install

```sh
npm install
npx playwright install chromium firefox webkit
```

Unset `PLAYWRIGHT_BROWSERS_PATH` if a sandbox injected it, so browsers land in the default Playwright cache.

## Format / lint / type-check

```sh
npm run fmt && npm run lint:fix && npm run type-check   # write
npm run fmt:check && npm run lint && npm run type-check   # check only
```

`npm run fmt` and `npm run lint:fix` write files; `fmt:check` / `lint` do not.

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
| `npm run test:unit`                                         | Vitest (all unit specs)                             |
| `npm run test:unit -- path/to/spec.ts`                      | One unit file                                       |
| `npm run test:coverage`                                     | Vitest with V8 coverage (`text` + `coverage/` HTML) |
| `npm run test:e2e -- --project chromium`                    | Playwright; pick projects explicitly                |
| `npm run test:e2e -- --project chromium -- path/to/spec.ts` | One e2e file                                        |

E2E defaults in config include chromium, firefox, and webkit; always pass `--project` when you want a subset. Agents should run e2e / Playwright install outside the sandbox (`required_permissions: ["all"]`).

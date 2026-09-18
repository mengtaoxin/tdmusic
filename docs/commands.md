# Commands

```sh
npm install
npx playwright install chromium firefox webkit
./scripts/dev-start.sh
./scripts/dev-stop.sh
npm run build
npm run format && npm run lint && npm run type-check
npm run test:unit
npm run test:e2e -- --project chromium
```

Prefer `./scripts/dev-start.sh` / `./scripts/dev-stop.sh` for the Vite server (do not run `npm run dev` directly for day-to-day work). Use `package.json` scripts for install, format, build, and tests.

## Flags (shell scripts)

Named flags only (`--key value` or `--key=value`); order does not matter. No positional arguments.

- Switches are the flag name itself (e.g. `--check`), not `--check true`.
- Every script accepts `-h` / `--help` (prints usage, exit 0). Unknown flags, missing values, and positionals exit 1.

## Install

```sh
npm install
npx playwright install chromium firefox webkit
```

Unset `PLAYWRIGHT_BROWSERS_PATH` if a sandbox injected it, so browsers land in the default Playwright cache.

## Format / lint / type-check

```sh
npm run format && npm run lint && npm run type-check   # write
npx prettier --check --experimental-cli src/ e2e/ \
  && npx oxlint . && npx eslint . --cache \
  && npm run type-check                                 # check only
```

`npm run format` and `npm run lint` write files by default.

## dev-start.sh / dev-stop.sh

No tunables; `--help` only. Dev server is Vite on port 3000. `dev-start.sh` waits until the port is listening (or fails).

## Build

```sh
npm run build
```

Type-check + Vite production build → `dist/`.

## Tests

| Command | Notes |
| ------- | ----- |
| `npm run test:unit` | Vitest (all unit specs) |
| `npm run test:unit -- path/to/spec.ts` | One unit file |
| `npm run test:e2e -- --project chromium` | Playwright; pick projects explicitly |
| `npm run test:e2e -- --project chromium -- path/to/spec.ts` | One e2e file |

E2E defaults in config include chromium, firefox, and webkit; always pass `--project` when you want a subset. Agents should run e2e / Playwright install outside the sandbox (`required_permissions: ["all"]`).

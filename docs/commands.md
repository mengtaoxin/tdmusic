# Commands

```sh
./scripts/install-dependency.sh
./scripts/format-and-lint.sh
./scripts/dev-start.sh
./scripts/dev-stop.sh
./scripts/build.sh
./scripts/test.sh
```

Prefer the scripts above over raw `npm run <script>` (e.g. do not run `npm run dev`, `npm run test`, or `npm run test:e2e` directly).

- Dev: `dev-start.sh` / `dev-stop.sh`
- Tests: always `./scripts/test.sh` (unit and e2e)

## test.sh

Default runs the full suite (unit + e2e). An optional first argument selects a single file (leading `--` on the filter is optional). Paths under `e2e/` run Playwright; otherwise Vitest. Do not invoke Vitest or Playwright via `npm run` / `npx`.

```sh
./scripts/test.sh
./scripts/test.sh --src/__tests__/App.spec.ts
./scripts/test.sh e2e/vue.spec.ts
```

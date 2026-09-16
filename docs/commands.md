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

Default (no flags): full suite (unit + e2e). Named flags only (`--key value` or `--key=value`); order does not matter. Do not invoke Vitest or Playwright via `npm run` / `npx`.

| Flag | Value | Default | Notes |
| ---- | ----- | ------- | ----- |
| `--file` | path to a spec | _(omit = all)_ | Under `e2e/` → Playwright; otherwise Vitest |
| `--platform` | comma-separated browsers | `chromium` | `chrome`/`chromium`, `firefox`, `webkit`/`safari`; e2e only; runs in parallel (`fullyParallel`) |

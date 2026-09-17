# Commands

```sh
./scripts/install-dependency.sh
./scripts/format.sh
./scripts/dev-start.sh
./scripts/dev-stop.sh
./scripts/build.sh
./scripts/test.sh
```

Prefer the scripts above over raw `npm run <script>` (e.g. do not run `npm run dev`, `npm run test`, or `npm run test:e2e` directly).

## Flags

Named flags only (`--key value` or `--key=value`); order does not matter. No positional arguments.

- Switches are the flag name itself (e.g. `--check`), not `--check true`.
- Every script accepts `-h` / `--help` (prints usage, exit 0). Unknown flags, missing values, and positionals exit 1.

## install-dependency.sh

Default: `npm install`, then Playwright **Chromium** only.

| Flag | Value | Default | Notes |
| ---- | ----- | ------- | ----- |
| `--browsers` | comma-separated list, or `all` | `chromium` | Same aliases as `--platform`; `all` → chromium, firefox, webkit |

## format.sh

Default **writes files**: Prettier `--write` and lint `--fix`. This is the everyday formatter, not a read-only CI check.

```sh
./scripts/format.sh          # default: write files
./scripts/format.sh --check  # check only, do not write
```

| Flag | Value | Default | Notes |
| ---- | ----- | ------- | ----- |
| `--check` | _(switch)_ | off | Prettier `--check`; oxlint/eslint without `--fix` |

## dev-start.sh / dev-stop.sh / build.sh

No tunables; `--help` only. Dev server is Vite on port 3000. `dev-start.sh` waits until the port is listening (or fails).

## test.sh

Default (no flags): `--layer all` (unit, then e2e on chromium). Do not invoke Vitest or Playwright via `npm run` / `npx`.

| Flag | Value | Default | Notes |
| ---- | ----- | ------- | ----- |
| `--layer` | `unit`, `e2e`, or `all` | `all` (when `--file` is omitted) | `--layer all` cannot be combined with `--file` |
| `--file` | path to a spec | _(omit = all in the layer)_ | Resolved path under `e2e/` → Playwright; otherwise Vitest. Must match `--layer` if both are set |
| `--platform` | comma-separated browsers | `chromium` | `chrome`/`chromium`, `firefox`, `webkit`/`safari`; e2e only; runs in parallel (`fullyParallel`) |

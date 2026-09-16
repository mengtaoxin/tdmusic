# Testing

| Layer | Tool        | Location                         | Naming                          |
| ----- | ----------- | -------------------------------- | ------------------------------- |
| Unit  | Vitest      | `src/**/__tests__/*.{spec,test}.ts` | `*.spec.ts` (preferred)      |
| E2E   | Playwright  | `e2e/`                           | `*.spec.ts`                     |

Run via [commands.md](commands.md) (`./scripts/test.sh`). Prefer the lowest layer that locks the behavior; do not duplicate unit assertions in e2e unless you need an integration smoke.

E2E (Playwright) defaults to chromium only and runs in parallel. Pass `--platform` (comma-separated) to `./scripts/test.sh` for additional browsers — see [commands.md](commands.md).

# Testing

| Layer | Tool        | Location                         | Naming                          |
| ----- | ----------- | ------------------------------- | ------------------------------- |
| Unit  | Vitest      | `src/**/__tests__/*.{spec,test}.ts`, `scripts/**/__tests__/*.spec.ts` | `*.spec.ts` (preferred)      |
| E2E   | Playwright  | `e2e/`                           | `*.spec.ts`                     |

Put a new unit spec next to the module under `__tests__/` (`src/lib/**/__tests__/`, `src/composables/__tests__/`, `src/views/__tests__/`, `src/components/__tests__/`, `src/stores/__tests__/`, `scripts/lib/__tests__/`). `src/__tests__/` is only for Vitest `setup.ts` and app-level specs (e.g. `App.spec.ts`) — do not dump module tests there.

Run via [commands.md](commands.md) (`./scripts/test.sh`). Prefer the lowest layer that locks the behavior; do not duplicate unit assertions in e2e unless you need an integration smoke.

E2E (Playwright) defaults to chromium only and runs in parallel. Pass `--layer e2e` to skip unit tests. Pass `--platform` (comma-separated) to `./scripts/test.sh` for additional browsers — see [commands.md](commands.md).

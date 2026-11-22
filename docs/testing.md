# Testing

| Layer    | Tool                         | Location                                  | Naming                                 |
| -------- | ---------------------------- | ----------------------------------------- | -------------------------------------- |
| Unit     | Vitest + RTL                 | `src/**/__tests__/*.{spec,test}.{ts,tsx}` | `*.spec.ts` / `*.spec.tsx` (preferred) |
| Coverage | Vitest `@vitest/coverage-v8` | `coverage/` (gitignored; HTML report)     | `npm run test:coverage`                |
| E2E      | Playwright                   | `e2e/`                                    | `*.spec.ts`                            |

Put a new unit spec next to the module under `__tests__/` (`src/lib/**/__tests__/`, `src/hooks/**/__tests__/`, `src/routes/**/__tests__/`, `src/components/**/__tests__/`, `src/stores/**/__tests__/`). Use React Testing Library for components and hooks (`.spec.tsx` when JSX is needed). `src/__tests__/` is only for Vitest `setup.ts`, shared render helpers, and app-level specs (e.g. `App.spec.tsx`) — do not dump module tests there.

Route unit specs live under `src/routes/__tests__/`. Vite's TanStack Router plugin ignores `*.spec.ts` / `*.spec.tsx` (`routeFileIgnorePattern` in `vite.config.ts`) so those files are not treated as routes.

When to write and run tests: [change-code-steps.md](change-code-steps.md). Commands: [commands.md](commands.md).

E2E (Playwright) runs in parallel. Pass `--project` (e.g. `chromium`) to select browsers — see [commands.md](commands.md).

# Change code steps

Ordered workflow for every code change. Domain details stay in the linked docs — do not copy them here.

| Need                   | Doc                                    |
| ---------------------- | -------------------------------------- |
| Commands               | [commands.md](commands.md)             |
| Test layers and naming | [testing.md](testing.md)               |
| Where files go         | [file-structure.md](file-structure.md) |
| Style, i18n, MUI       | [conventions.md](conventions.md)       |

## 1. Inspect structure

Before writing or moving files, match [file-structure.md](file-structure.md):

- Put new code in the existing domain folder (`src/lib/catalog/`, `src/lib/playback/`, `src/components/`, …). Do not invent a new top-level area.
- Colocate unit specs next to the module under `__tests__/`.
- Use `@/` imports.
- Match nearby naming and module size. Prefer a small helper in the right folder over a new catch-all file.

## 2. TDD (behavior changes)

Follow the `test-driven-development` skill. Short version:

1. State the observable behavior in one sentence (outcome, not implementation).
2. **Red** — add or extend a test at the lowest layer that locks it ([testing.md](testing.md)). Run it. It must fail for the missing behavior, not a broken import or flaky setup.
3. **Green** — change production code only enough to pass. No drive-by refactors.
4. **Refactor** — clean up with tests still green.

Do not implement first and then write a test that already passes.

No new test required: docs, comments, or formatting with no behavior change. Mechanical moves/renames with unchanged behavior need no new test, but still run the full unit suite. Throwaway spikes must be redone with Red→Green before keeping.

## 3. Cross-cutting while implementing

- **i18n:** add, rename, or remove UI strings in both `src/locales/en.ts` and `src/locales/zh.ts`.
- **Catalog views:** rely on root `beforeLoad` / `ensureCatalogLoaded` — do not fetch `configs.json` from views ([catalog.md](catalog.md)).
- **Docs:** update the matching `docs/` file when a documented contract or workflow changes.

## 4. Tests

During Red/Green, run the focused spec. Before finishing a behavior change, run the full unit suite (`npm run test:unit`). Add or run e2e only for a user-visible integration smoke — do not duplicate unit assertions in e2e.

Commands and `--project` for Playwright: [commands.md](commands.md).

## 5. Format and check

After the tests you owe for this change:

1. Write: `npm run format && npm run lint && npm run type-check` (these write files).
2. Confirm check-only is clean (exact commands in [commands.md](commands.md)).

Do not mark the change done while check-only format, lint, or type-check fails.

## Done when

- Structure matches [file-structure.md](file-structure.md).
- Behavior changes went through observed Red → Green (and refactor if needed).
- Full unit suite is green for behavior changes; e2e only when that layer is required.
- Format / lint / type-check check-only is clean.
- i18n and docs from step 3 are updated when they apply.

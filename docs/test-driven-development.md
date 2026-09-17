# Test-driven development (for agents)

Mandatory workflow when changing behavior. `AGENTS.md` requires following this guide before and while editing code.

Goal: prove the intended behavior with a failing test first, then make that test pass with the smallest change. Do not claim work is done because the implementation “looks right.”

## Non-negotiable cycle

For every behavior change (feature, bugfix, regression guard):

1. **Red** — Write or extend a test that expresses the desired behavior. Run it. Confirm it fails for the right reason (missing behavior / wrong result), not because of a broken compile, wrong import, or flaky setup.
2. **Green** — Change production code only enough to make that test pass. No drive-by refactors in this step.
3. **Refactor** — Clean up with tests still green. Keep behavior fixed.

Do not skip Red. Writing implementation first and then a green test is not TDD here.

If you cannot write a meaningful failing test yet, stop and clarify the requirement. Do not invent production code without a behavior contract.

## What to test at which layer

Pick the lowest layer that can lock the behavior. Prefer one focused test over a pile of overlapping ones.

Project stack, locations, naming, and layer mapping: [testing.md](testing.md).

Rules of thumb:

- Prefer the lowest layer that can lock the contract; use end-to-end only for user-visible integration.
- Do not add a second test layer that only duplicates assertions already owned by a lower test, unless you need an integration smoke.
- Copy style from a nearby existing test; match project naming (see [testing.md](testing.md)).

## How to run tests

See [commands.md](commands.md). Run the relevant suite(s) on each Red/Green step. Before finishing, always run the full test suite; do not mark the task done until it passes. Focused tests alone are not enough to finish.

## Agent checklist (every behavior change)

1. If adding or moving files, follow [file-structure.md](file-structure.md) placement.
2. State the behavior in one sentence (observable outcome, not implementation).
3. Add/adjust the failing test at the right layer (see [testing.md](testing.md)); run it; confirm **Red**.
4. Implement the minimal fix; run the same test; confirm **Green**.
5. Refactor if needed; keep tests green.
6. Update docs only when project-specific contracts change (see [project-specific-docs.md](project-specific-docs.md)). Update [ui-chrome.md](ui-chrome.md) only when header / nav visual behavior changes.
7. Run the full test suite. Do not mark the task done until it passes.

## Anti-patterns (do not)

- Implement first, then write a test that mirrors the code you already wrote.
- Change the test to match buggy production behavior without an explicit product decision.
- Broad “rewrite all tests” or unrelated snapshot churn.
- Skip the preferred lower-layer coverage because mocks “should be enough” (see [testing.md](testing.md)).
- Use end-to-end tests as a substitute for a unit test of a pure helper.
- Leave tests failing, or leave Red unobserved (never ran the failing test).
- Claim done after only focused tests; skip the final full suite.

## When a thin exception applies

TDD still applies to behavior. These are not free passes to skip tests:

- **Docs / comments / pure formatting** with no behavior change — no new test required; full suite not required.
- **Generated or mechanical moves** (rename with tool, import reorder) — no new test if behavior is unchanged; still run the full suite before finishing.
- **Spike / exploration** — throwaway code may skip TDD, but delete or redo with Red→Green before keeping it (including the final full suite).

If a bug has no reliable automated hook yet, add the smallest test that would have failed before the fix, then fix it.

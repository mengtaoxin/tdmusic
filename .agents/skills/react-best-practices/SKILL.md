---
name: vercel-react-best-practices
description: >-
  React performance guidelines from Vercel Engineering, with a tdmusic SPA overlay.
  Use when writing, reviewing, or refactoring React components, data fetching,
  bundle size, or re-renders. Do not treat Next.js, RSC, or SWR examples as
  stack changes for this Vite app.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
  adapted-for: tdmusic
  upstream: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
  upstream-commit: "063bee94c3f4df8453406c830b0a7df0f2860278"
---

# Vercel React Best Practices (tdmusic)

Upstream performance rules from Vercel Engineering (70 rules, 8 categories). This repo is a **React 19 + Vite SPA** (TanStack Router, Zustand, MUI). Apply the rules as performance patterns, not as a Next.js migration.

## tdmusic overlay (always)

Read this overlay before any `rules/*.md` file. If a rule fights this overlay or `docs/`, follow the overlay/`docs/`.

- **Stack stays Vite SPA.** Do not add Next.js, App Router, RSC, `next/dynamic`, `after()`, server actions, or React Server `cache()`. Skip every `server-*` rule and skip `async-api-routes`.
- **Catalog fetch stays centralized.** Views that need the catalog rely on root `beforeLoad` / `ensureCatalogLoaded`. Do not fetch `configs.json` from views (`docs/catalog.md`).
- **Do not add SWR.** Ignore `client-swr-dedup` as a dependency instruction. Deduplicate with existing in-flight promises (`ensureCatalogLoaded` / `loadCatalogAndHydratePlayer`) and Zustand. New client fetches belong in `src/lib/` or stores, not per-view `useEffect` + `fetch`.
- **Heavy UI: `React.lazy` + `Suspense`, not `next/dynamic`.** Map `bundle-dynamic-imports` to Vite code-splitting. Keep MUI path imports (`@mui/material/Box`), not `@mui/material` barrels (`bundle-barrel-imports` already matches this).
- **Long lists: keep `@tanstack/react-virtual`.** Do not replace `VirtualRowList` / `AlbumGallery` / `useVirtualListHost` with CSS `content-visibility` (`rendering-content-visibility`). That rule is only for a new, non-virtualized dump of many DOM nodes.
- **Persistence: existing keys and codec.** Do not invent `key:v2` localStorage names. Use `clientStorage` and the keys/versioning in `docs/persistence.md` (`tdmusic.locale`, `tdmusic.configUrl`, `tdmusic.configs`, `tdmusic.player` with `v: 1`, `tdmusic.searchHistory`). Catch quota failures as that module already does. `js-cache-storage` must not bypass `clientStorage`.
- **Styling is MUI `sx` / theme, not Tailwind.** Translate className examples. No Tailwind, Vue, or extra UI kit (`docs/conventions.md`, `docs/tech-stack.md`).
- **Do not add `better-all`.** For independent work use `Promise.all`. Keep catalog enrich concurrency at 2 (`docs/catalog.md`).
- **SSR hydration rules are N/A** (`rendering-hydration-*`) unless the task explicitly adds SSR.
- **Behavior still follows TDD.** Performance-only refactors that keep behavior use the `refactor` skill. Observable behavior changes still use `test-driven-development` and `docs/testing.md`.
- **UI a11y/UX reviews** stay on `web-design-guidelines`. This skill is performance patterns.

## When to Apply

- Writing or reviewing React components in `src/`
- Client data loading, bundle size, or re-render work
- Refactoring React for performance without changing product behavior

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | tdmusic |
|----------|----------|--------|--------|---------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` | Apply except `async-api-routes`. Suspense is fine for `React.lazy`, not RSC streaming. |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` | Apply; map `next/dynamic` → `React.lazy`. |
| 3 | Server-Side Performance | HIGH | `server-` | Skip. |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` | Apply event-listener rules. Skip SWR. Persistence via existing keys. |
| 5 | Re-render Optimization | MEDIUM | `rerender-` | Apply. Prefer Zustand selectors over extra `useState` mirrors. |
| 6 | Rendering Performance | MEDIUM | `rendering-` | Apply except hydration and replacing virtual lists. |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` | Apply when the hot path is real; skip drive-by micro-opts. |
| 8 | Advanced Patterns | LOW | `advanced-` | Apply when already touching that code. |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-cheap-condition-before-await` - Check cheap sync conditions before awaiting flags or remote values
- `async-defer-await` - Move await into branches where actually used
- `async-parallel` - Use Promise.all() for independent operations
- `async-dependencies` - Use better-all for partial dependencies (**do not add the package**; structure awaits instead)
- `async-api-routes` - **Skip** (no API routes)
- `async-suspense-boundaries` - Use Suspense around lazy client chunks, not RSC stream slots

### 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` - Import directly, avoid barrel files
- `bundle-analyzable-paths` - Prefer statically analyzable import and file-system paths
- `bundle-dynamic-imports` - `React.lazy` / dynamic `import()` for heavy panels (`music-metadata`, marked, etc. when not on the first paint)
- `bundle-defer-third-party` - Load analytics/logging after first paint if added
- `bundle-conditional` - Load modules only when the feature is activated
- `bundle-preload` - Preload on hover/focus for perceived speed

### 3. Server-Side Performance (HIGH)

Skip the `server-*` rule files for this SPA.

### 4. Client-Side Data Fetching (MEDIUM-HIGH)

- `client-swr-dedup` - **Skip as a library rule**; keep catalog/player bootstrap dedupe
- `client-event-listeners` - Deduplicate global event listeners
- `client-passive-event-listeners` - Use passive listeners for scroll
- `client-localstorage-schema` - Version/minimize **through** `docs/persistence.md`, do not rename keys

### 5. Re-render Optimization (MEDIUM)

- `rerender-defer-reads` - Don't subscribe to state only used in callbacks
- `rerender-memo` - Extract expensive work into memoized components
- `rerender-memo-with-default-value` - Hoist default non-primitive props
- `rerender-dependencies` - Use primitive dependencies in effects
- `rerender-derived-state` - Subscribe to derived booleans, not raw values
- `rerender-derived-state-no-effect` - Derive state during render, not effects
- `rerender-functional-setstate` - Use functional setState for stable callbacks
- `rerender-lazy-state-init` - Pass function to useState for expensive values
- `rerender-simple-expression-in-memo` - Avoid memo for simple primitives
- `rerender-split-combined-hooks` - Split hooks with independent dependencies
- `rerender-move-effect-to-event` - Put interaction logic in event handlers
- `rerender-transitions` - Use startTransition for non-urgent updates
- `rerender-use-deferred-value` - Defer expensive renders to keep input responsive
- `rerender-use-ref-transient-values` - Use refs for transient frequent values
- `rerender-no-inline-components` - Don't define components inside components

### 6. Rendering Performance (MEDIUM)

- `rendering-animate-svg-wrapper` - Animate a DOM wrapper, not the SVG node
- `rendering-content-visibility` - Only if not already using TanStack Virtual
- `rendering-hoist-jsx` - Extract static JSX outside components
- `rendering-svg-precision` - Reduce SVG coordinate precision
- `rendering-hydration-no-flicker` - **Skip** (CSR)
- `rendering-hydration-suppress-warning` - **Skip** (CSR)
- `rendering-activity` - Use Activity for show/hide when already on React 19
- `rendering-conditional-render` - Use ternary, not `&&`, when the left side can be `0`
- `rendering-usetransition-loading` - Prefer useTransition for pending UI
- `rendering-resource-hints` - Use React DOM resource hints when preloading real URLs
- `rendering-script-defer-async` - Use defer or async on extra script tags

### 7. JavaScript Performance (LOW-MEDIUM)

- `js-batch-dom-css` - Prefer MUI `sx` / theme; do not drop to `element.style` loops in UI
- `js-index-maps` - Build Map for repeated lookups
- `js-cache-property-access` - Cache object properties in loops
- `js-cache-function-results` - Cache function results in module-level Map when pure
- `js-cache-storage` - Go through `clientStorage`, do not read raw keys ad hoc
- `js-combine-iterations` - Combine multiple filter/map into one loop when hot
- `js-length-check-first` - Check array length before expensive comparison
- `js-early-exit` - Return early from functions
- `js-hoist-regexp` - Hoist RegExp creation outside loops
- `js-min-max-loop` - Use loop for min/max instead of sort
- `js-set-map-lookups` - Use Set/Map for O(1) lookups
- `js-tosorted-immutable` - Use toSorted() for immutability
- `js-flatmap-filter` - Use flatMap to map and filter in one pass
- `js-request-idle-callback` - Defer non-critical work; do not idle-defer catalog load or audio play

### 8. Advanced Patterns (LOW)

- `advanced-effect-event-deps` - Don't put `useEffectEvent` results in effect deps
- `advanced-event-handler-refs` - Store event handlers in refs
- `advanced-init-once` - Initialize app once per app load
- `advanced-use-latest` - useLatest for stable callback refs

## How to Use

1. Apply the overlay above.
2. Open only the rule files that match the task (skip `server-*` unless the stack changes).
3. Translate Next.js / `className` / SWR snippets into Vite + MUI + Zustand.

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
```

Each rule file contains an incorrect example, a correct example, and references.

Pin and license: `SOURCE.md`.

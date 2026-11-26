# Deployment (Vercel + GitHub Actions)

Production is intended to be published from **GitHub Actions** using the Vercel CLI (`vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`). The app is a **static Vite SPA** (PWA via `vite-plugin-pwa`); there are no Vercel Functions or server runtime.

| Setting        | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Framework      | Vite (project settings on Vercel)                                                 |
| Node           | **24+** (`package.json` `engines` require Node 24 or newer)                       |
| Install        | `npm ci`                                                                          |
| Build          | `npm run build` → `dist/`                                                         |
| Hosting        | Static files; existing [`vercel.json`](../vercel.json) rewrites and cache headers |
| Production URL | `https://tdmusic.smt.sh`                                                          |

Workflow: [`.github/workflows/vercel-production.yml`](../.github/workflows/vercel-production.yml) — `push` to `main` and `workflow_dispatch` only (no pull-request triggers).

## Transition: Vercel Git vs Actions

Until you **validate** the Actions workflow and intentionally turn off Vercel’s Git integration in the Vercel dashboard, **both** paths may deploy production on pushes to `main`:

1. **Vercel Git** (current linked repo) — automatic builds on the Vercel side.
2. **This workflow** — CLI prebuilt deploy after secrets are configured.

This PR does **not** disable Git auto-deploy or disconnect the repo. After a successful manual or post-merge workflow run, disable duplicate Git deployments in Vercel (Project → Git) so only Actions publishes production.

## GitHub secrets

Add these under **Settings → Secrets and variables → Actions** (never commit values).

| Secret              | Purpose                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `VERCEL_TOKEN`      | Vercel token with deploy access for the team that owns the project                                            |
| `VERCEL_ORG_ID`     | Team (or user) ID — Vercel team settings or `.vercel/project.json` after `vercel link`                        |
| `VERCEL_PROJECT_ID` | Linked Vercel project ID — project settings or `.vercel/project.json`                                         |
| `NODE_AUTH_TOKEN`   | GitHub PAT with `read:packages` (or org-approved token) for `@mengtaoxin/*` during `npm ci` in `vercel build` |

`.npmrc` maps GitHub Packages auth to `NODE_AUTH_TOKEN`; the workflow passes it only into the **Build** step.

Optional: mirror `NODE_AUTH_TOKEN` as a Vercel environment variable if you also build on Vercel outside GitHub Actions.

## One-time checks (outside this repo change)

1. Confirm the Vercel project matches this repo: root `.`, install/build/output per Vite defaults (`npm ci` / `npm run build` / `dist/`).
2. Production domain `tdmusic.smt.sh` remains attached in Vercel; do not change DNS for this migration.
3. Configure the four secrets above, then run **Actions → Vercel production → Run workflow** once before relying on it exclusively.
4. When satisfied, turn off Vercel Git production deploys to avoid double publishes.

## Workflow behavior

Each run: checkout → Node 24 → global `vercel@50` → `vercel pull --environment=production` → `vercel build --prod` → `vercel deploy --prebuilt --prod`.

Concurrency group `vercel-production` uses `cancel-in-progress: false` so overlapping production deploys are not aborted mid-flight.

Production secrets are not available on forked pull requests because the workflow does not run on `pull_request`.

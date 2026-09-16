/** Playwright project names selectable via `./scripts/test.sh --platform`. */
export type E2ePlatform = 'chromium' | 'firefox' | 'webkit'

const ALIASES: Record<string, E2ePlatform> = {
  chrome: 'chromium',
  chromium: 'chromium',
  firefox: 'firefox',
  webkit: 'webkit',
  safari: 'webkit',
}

/**
 * Resolve a comma-separated platform list (e.g. `chrome,firefox`) to Playwright
 * project names. Unset / blank defaults to chromium only.
 */
export function resolveE2ePlatforms(raw: string | null | undefined): E2ePlatform[] {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ['chromium']

  const resolved: E2ePlatform[] = []
  for (const part of trimmed.split(',')) {
    const key = part.trim().toLowerCase()
    if (!key) continue
    const platform = ALIASES[key]
    if (!platform) {
      throw new Error(
        `Unknown e2e platform: ${part.trim()} (expected chrome/chromium, firefox, webkit/safari)`,
      )
    }
    if (!resolved.includes(platform)) resolved.push(platform)
  }

  return resolved.length > 0 ? resolved : ['chromium']
}

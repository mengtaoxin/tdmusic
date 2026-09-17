/** Playwright project names selectable via `./scripts/test.sh --platform`. */
export type E2ePlatform = 'chromium' | 'firefox' | 'webkit'

export const ALL_E2E_PLATFORMS: E2ePlatform[] = ['chromium', 'firefox', 'webkit']

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

function resolvePosix(root: string, rawPath: string): string {
  const input = rawPath.startsWith('/') ? rawPath : `${root.replace(/\/$/, '')}/${rawPath}`
  const parts: string[] = []
  for (const part of input.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      parts.pop()
      continue
    }
    parts.push(part)
  }
  return `/${parts.join('/')}`
}

/** Classify a `--file` path as Playwright (under e2e/) or Vitest. */
export function classifyTestFile(root: string, rawPath: string): 'e2e' | 'unit' {
  const abs = resolvePosix(root, rawPath)
  const e2eRoot = resolvePosix(root, 'e2e')
  if (abs === e2eRoot || abs.startsWith(`${e2eRoot}/`)) return 'e2e'
  return 'unit'
}

/**
 * Browsers for `./scripts/install-dependency.sh --browsers`.
 * Unset / blank → chromium only. `all` → chromium, firefox, webkit.
 */
export function resolveInstallBrowsers(raw: string | null | undefined): E2ePlatform[] {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ['chromium']
  if (trimmed.toLowerCase() === 'all') return [...ALL_E2E_PLATFORMS]
  return resolveE2ePlatforms(trimmed)
}

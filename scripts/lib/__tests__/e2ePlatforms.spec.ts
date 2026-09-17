import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { classifyTestFile, resolveE2ePlatforms, resolveInstallBrowsers } from '../e2ePlatforms'

const ROOT = process.cwd()

describe('resolveE2ePlatforms', () => {
  it('defaults to chromium when unset or blank', () => {
    expect(resolveE2ePlatforms(undefined)).toEqual(['chromium'])
    expect(resolveE2ePlatforms(null)).toEqual(['chromium'])
    expect(resolveE2ePlatforms('')).toEqual(['chromium'])
    expect(resolveE2ePlatforms('   ')).toEqual(['chromium'])
  })

  it('accepts chrome as an alias for chromium', () => {
    expect(resolveE2ePlatforms('chrome')).toEqual(['chromium'])
  })

  it('parses comma-separated platforms and dedupes', () => {
    expect(resolveE2ePlatforms('chrome,firefox,webkit')).toEqual(['chromium', 'firefox', 'webkit'])
    expect(resolveE2ePlatforms('chromium, chrome')).toEqual(['chromium'])
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(resolveE2ePlatforms(' Firefox , WebKit ')).toEqual(['firefox', 'webkit'])
  })

  it('rejects unknown platform names', () => {
    expect(() => resolveE2ePlatforms('edge')).toThrow(/unknown e2e platform/i)
  })
})

describe('classifyTestFile', () => {
  it('classifies paths under e2e/ as e2e, including ./ and absolute forms', () => {
    expect(classifyTestFile(ROOT, 'e2e/vue.spec.ts')).toBe('e2e')
    expect(classifyTestFile(ROOT, './e2e/vue.spec.ts')).toBe('e2e')
    expect(classifyTestFile(ROOT, resolve(ROOT, 'e2e/vue.spec.ts'))).toBe('e2e')
  })

  it('classifies unit specs as unit even when the name contains e2e', () => {
    expect(classifyTestFile(ROOT, 'scripts/lib/__tests__/e2ePlatforms.spec.ts')).toBe('unit')
    expect(classifyTestFile(ROOT, 'src/__tests__/App.spec.ts')).toBe('unit')
  })
})

describe('resolveInstallBrowsers', () => {
  it('defaults to chromium when unset or blank', () => {
    expect(resolveInstallBrowsers(undefined)).toEqual(['chromium'])
    expect(resolveInstallBrowsers(null)).toEqual(['chromium'])
    expect(resolveInstallBrowsers('')).toEqual(['chromium'])
    expect(resolveInstallBrowsers('   ')).toEqual(['chromium'])
  })

  it('expands all to chromium, firefox, and webkit', () => {
    expect(resolveInstallBrowsers('all')).toEqual(['chromium', 'firefox', 'webkit'])
    expect(resolveInstallBrowsers(' ALL ')).toEqual(['chromium', 'firefox', 'webkit'])
  })

  it('accepts the same aliases as --platform', () => {
    expect(resolveInstallBrowsers('chrome,safari')).toEqual(['chromium', 'webkit'])
  })

  it('rejects unknown browser names', () => {
    expect(() => resolveInstallBrowsers('edge')).toThrow(/unknown e2e platform/i)
  })
})

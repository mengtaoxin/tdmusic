import { describe, expect, it } from 'vitest'
import { resolveE2ePlatforms } from '../e2ePlatforms'

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

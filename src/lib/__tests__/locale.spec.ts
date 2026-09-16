import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_LOCALE, LOCALE_KEY, resolveLocale, writeStoredLocale } from '../locale'

describe('resolveLocale', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default when localStorage is empty', () => {
    expect(resolveLocale()).toBe(DEFAULT_LOCALE)
  })

  it('returns stored locale when set to en or zh', () => {
    localStorage.setItem(LOCALE_KEY, 'zh')
    expect(resolveLocale()).toBe('zh')
    localStorage.setItem(LOCALE_KEY, 'en')
    expect(resolveLocale()).toBe('en')
  })

  it('falls back to default for blank or unknown values', () => {
    localStorage.setItem(LOCALE_KEY, '   ')
    expect(resolveLocale()).toBe(DEFAULT_LOCALE)
    localStorage.setItem(LOCALE_KEY, 'fr')
    expect(resolveLocale()).toBe(DEFAULT_LOCALE)
  })
})

describe('writeStoredLocale', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists a supported locale', () => {
    writeStoredLocale('zh')
    expect(localStorage.getItem(LOCALE_KEY)).toBe('zh')
  })

  it('ignores unsupported locales', () => {
    writeStoredLocale('fr')
    expect(localStorage.getItem(LOCALE_KEY)).toBeNull()
  })
})

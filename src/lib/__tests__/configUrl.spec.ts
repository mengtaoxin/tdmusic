import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_CONFIG_URL, CONFIG_URL_KEY, resolveConfigUrl } from '../configUrl'

describe('resolveConfigUrl', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default when localStorage is empty', () => {
    expect(resolveConfigUrl()).toBe(DEFAULT_CONFIG_URL)
  })

  it('returns stored config url when set', () => {
    localStorage.setItem(CONFIG_URL_KEY, 'https://cdn.example.com/configs.json')
    expect(CONFIG_URL_KEY).toBe('tdmusic.configUrl')
    expect(resolveConfigUrl()).toBe('https://cdn.example.com/configs.json')
  })

  it('trims whitespace and falls back for blank', () => {
    localStorage.setItem(CONFIG_URL_KEY, '   ')
    expect(resolveConfigUrl()).toBe(DEFAULT_CONFIG_URL)
  })
})

describe('loadConfigsJson', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('fetches from resolved url', async () => {
    const { loadConfigsJson } = await import('../loadConfigs')
    const payload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    )
    const data = await loadConfigsJson()
    expect(fetch).toHaveBeenCalledWith(DEFAULT_CONFIG_URL)
    expect(data).toEqual(payload)
  })
})

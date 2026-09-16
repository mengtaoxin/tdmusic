import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getItem, removeItem, setItem } from '../clientStorage'

describe('clientStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('reads and writes values', () => {
    expect(getItem('tdmusic.test')).toBeNull()
    expect(setItem('tdmusic.test', 'hello')).toBe(true)
    expect(getItem('tdmusic.test')).toBe('hello')
  })

  it('removes values', () => {
    setItem('tdmusic.test', 'x')
    removeItem('tdmusic.test')
    expect(getItem('tdmusic.test')).toBeNull()
  })

  it('returns false on QuotaExceededError without throwing', () => {
    const storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
      getItem: () => null,
      setItem: () => {
        const err = new DOMException('quota', 'QuotaExceededError')
        throw err
      },
      removeItem: () => {},
    }
    expect(setItem('tdmusic.test', 'big', storage)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import { capVirtualListHeight, virtualListNeedsScroll } from '../virtualListHeight'

describe('capVirtualListHeight', () => {
  it('shrinks to content height for short lists', () => {
    expect(capVirtualListHeight(3, 64, 800)).toBe(192)
  })

  it('caps to the host height for long lists', () => {
    expect(capVirtualListHeight(200, 64, 800)).toBe(800)
  })

  it('falls back to a short viewport when host is unmeasured', () => {
    expect(capVirtualListHeight(200, 64, 0)).toBe(64 * 12)
    expect(capVirtualListHeight(5, 64, 0)).toBe(320)
  })
})

describe('virtualListNeedsScroll', () => {
  it('is false when content fits the host', () => {
    expect(virtualListNeedsScroll(3, 64, 800)).toBe(false)
  })

  it('is true when content exceeds the host', () => {
    expect(virtualListNeedsScroll(200, 64, 800)).toBe(true)
  })

  it('is false until the host has been measured', () => {
    expect(virtualListNeedsScroll(200, 64, 0)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import { formatBytes } from '../formatBytes'

describe('formatBytes', () => {
  it('formats whole bytes under 1 KB', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(999)).toBe('999 B')
  })

  it('formats KB and MB with at most one decimal', () => {
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1048576)).toBe('1 MB')
    expect(formatBytes(12897485)).toBe('12.3 MB')
  })

  it('treats non-finite and negative values as 0 B', () => {
    expect(formatBytes(Number.NaN)).toBe('0 B')
    expect(formatBytes(-10)).toBe('0 B')
  })
})

import { describe, expect, it } from 'vitest'

import { albumGalleryColumns, albumGalleryRowHeight, chunkIntoRows } from '../albumGalleryLayout'

describe('albumGalleryColumns', () => {
  it('uses 2 columns below the sm breakpoint', () => {
    expect(albumGalleryColumns(320)).toBe(2)
    expect(albumGalleryColumns(599)).toBe(2)
  })

  it('uses 3 columns from 600px', () => {
    expect(albumGalleryColumns(600)).toBe(3)
    expect(albumGalleryColumns(959)).toBe(3)
  })

  it('uses 4 columns from 960px', () => {
    expect(albumGalleryColumns(960)).toBe(4)
  })
})

describe('chunkIntoRows', () => {
  it('groups items into fixed-width rows', () => {
    expect(chunkIntoRows(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([['a', 'b'], ['c', 'd'], ['e']])
  })

  it('returns an empty list for no items', () => {
    expect(chunkIntoRows([], 3)).toEqual([])
  })
})

describe('albumGalleryRowHeight', () => {
  it('sizes a row from tile width plus meta and gap', () => {
    // host 332px, 2 cols, 16px gap → tile 158; meta 44 + gap 16 → 218
    expect(albumGalleryRowHeight(332, 2)).toBe(218)
  })

  it('falls back when the host is unmeasured', () => {
    expect(albumGalleryRowHeight(0, 2)).toBeGreaterThan(100)
  })
})

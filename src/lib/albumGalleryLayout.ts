/** Match CSS breakpoints previously used by the album gallery grid. */
export const ALBUM_GALLERY_GAP_PX = 16

/** Approximate title + subtitle + top margin under each cover. */
const ALBUM_TILE_META_PX = 44

/** Unmeasured host: assume ~160px-wide tiles. */
const UNMEASURED_TILE_PX = 160

export function albumGalleryColumns(hostWidthPx: number): number {
  if (hostWidthPx >= 960) return 4
  if (hostWidthPx >= 600) return 3
  return 2
}

export function chunkIntoRows<T>(items: readonly T[], columns: number): T[][] {
  const cols = Math.max(1, Math.floor(columns))
  if (items.length === 0) return []
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols))
  }
  return rows
}

/** Fixed row height for `v-virtual-scroll`: square tile + meta + row gap. */
export function albumGalleryRowHeight(hostWidthPx: number, columns: number): number {
  const cols = Math.max(1, Math.floor(columns))
  const gap = ALBUM_GALLERY_GAP_PX
  const tileWidth = hostWidthPx > 0 ? (hostWidthPx - gap * (cols - 1)) / cols : UNMEASURED_TILE_PX
  return Math.ceil(tileWidth + ALBUM_TILE_META_PX + gap)
}

/** Cap virtual-list pixel height to the measured host; shrink for short lists. */
export function capVirtualListHeight(
  itemCount: number,
  itemHeightPx: number,
  hostHeightPx: number,
  unmeasuredFallbackPx = itemHeightPx * 12,
): number {
  const content = Math.max(itemCount, 1) * itemHeightPx
  if (hostHeightPx <= 0) return Math.min(content, unmeasuredFallbackPx)
  return Math.min(content, Math.floor(hostHeightPx))
}

/** True when the list content is taller than the host and needs its own scroller. */
export function virtualListNeedsScroll(
  itemCount: number,
  itemHeightPx: number,
  hostHeightPx: number,
): boolean {
  if (hostHeightPx <= 0) return false
  return Math.max(itemCount, 1) * itemHeightPx > hostHeightPx
}

/** Pixel offset that places `index` at the top of a fixed-row virtual list. */
export function alignStartScrollOffset(
  index: number,
  itemHeightPx: number,
  itemCount: number,
  viewportHeightPx: number,
): number {
  if (index <= 0 || itemHeightPx <= 0 || itemCount <= 0) return 0
  const total = itemCount * itemHeightPx
  const maxScroll = Math.max(0, total - Math.max(0, viewportHeightPx))
  return Math.min(index * itemHeightPx, maxScroll)
}

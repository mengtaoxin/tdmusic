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

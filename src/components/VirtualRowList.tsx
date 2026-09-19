import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import { useVirtualizer } from '@tanstack/react-virtual'

import { useVirtualListHost } from '@/hooks/useVirtualListHost'
import {
  alignStartScrollOffset,
  capVirtualListHeight,
  virtualListNeedsScroll,
} from '@/lib/virtualListHeight'

export type VirtualRowListProps<T> = {
  items: readonly T[]
  itemHeight: number
  getItemKey: (item: T, index: number) => string
  renderRow: (item: T, index: number) => ReactNode
  overscan?: number
  /** Fill a flex host and cap scroller height (Music / Artists). */
  fillHost?: boolean
  /** Explicit scroller height when not filling a host (Now Playing queue). */
  height?: number | string
  listClassName?: string
  hostClassName?: string
  /** Align this row to the top of the scroller when the list is ready. */
  scrollToIndex?: number | null
}

export function VirtualRowList<T>({
  items,
  itemHeight,
  getItemKey,
  renderRow,
  overscan = 8,
  fillHost = false,
  height,
  listClassName = 'virtual-list',
  hostClassName,
  scrollToIndex = null,
}: VirtualRowListProps<T>) {
  const { listHostRef, hostHeight } = useVirtualListHost()
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null)
  const scrolledToRef = useRef<number | null>(null)

  const listHeight = fillHost ? capVirtualListHeight(items.length, itemHeight, hostHeight) : height
  const listFlush = fillHost ? !virtualListNeedsScroll(items.length, itemHeight, hostHeight) : false

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollParent,
    estimateSize: () => itemHeight,
    overscan,
    observeElementRect: (_instance, callback) => {
      const element = scrollParent
      if (!element) return
      const notify = () => {
        const measured = element.clientHeight
        const fallback = typeof listHeight === 'number' ? listHeight : 0
        callback({
          width: element.clientWidth || 800,
          height: measured > 0 ? measured : fallback,
        })
      }
      notify()
      if (typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(() => notify())
      observer.observe(element)
      return () => observer.disconnect()
    },
  })

  useLayoutEffect(() => {
    if (scrollParent == null || scrollToIndex == null || scrollToIndex < 0) return
    if (scrolledToRef.current === scrollToIndex) return
    if (scrollToIndex >= items.length) return
    const viewport =
      scrollParent.clientHeight > 0
        ? scrollParent.clientHeight
        : typeof listHeight === 'number'
          ? listHeight
          : 0
    const offset = alignStartScrollOffset(scrollToIndex, itemHeight, items.length, viewport)
    scrollParent.scrollTop = offset
    rowVirtualizer.scrollToOffset(offset, { align: 'start' })
    scrolledToRef.current = scrollToIndex
  }, [scrollParent, scrollToIndex, itemHeight, items.length, listHeight, rowVirtualizer])

  const scroller = (
    <Box
      ref={setScrollParent}
      className={`${listClassName}${listFlush ? ` ${listClassName}--flush` : ''}`}
      sx={{
        height: listHeight,
        overflowY: listFlush ? 'hidden' : 'auto',
        bgcolor: 'transparent',
        position: 'relative',
      }}
    >
      <Box sx={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index]
          if (item === undefined) return null
          const rowStyle: CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }
          return (
            <Box key={getItemKey(item, virtualRow.index)} sx={rowStyle}>
              {renderRow(item, virtualRow.index)}
            </Box>
          )
        })}
      </Box>
    </Box>
  )

  if (!fillHost) return scroller

  return (
    <Box
      ref={listHostRef}
      className={hostClassName ? `list-host ${hostClassName}` : 'list-host'}
      sx={{ flex: '1 1 auto', minHeight: 0 }}
    >
      {scroller}
    </Box>
  )
}

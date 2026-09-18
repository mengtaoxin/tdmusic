import { useMemo, useRef } from 'react'
import Box from '@mui/material/Box'
import AlbumIcon from '@mui/icons-material/Album'
import { Link } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'

import { CoverImg } from '@/components/CoverImg'
import { useVirtualListHost } from '@/hooks/useVirtualListHost'
import {
  ALBUM_GALLERY_GAP_PX,
  albumGalleryColumns,
  albumGalleryRowHeight,
  chunkIntoRows,
} from '@/lib/albumGalleryLayout'
import { localizeAlbumName } from '@/lib/catalog/displayLabels'
import { capVirtualListHeight, virtualListNeedsScroll } from '@/lib/virtualListHeight'

export type AlbumGalleryTile = {
  name: string
  trackCount: number
  coverSrc?: string
}

export type AlbumGalleryProps = {
  tiles: AlbumGalleryTile[]
  /** Build the router `to` for a tile name. */
  pathFor: (name: string) => string
}

export function AlbumGallery({ tiles, pathFor }: AlbumGalleryProps) {
  const { t } = useTranslation()
  const { listHostRef, hostHeight, hostWidth } = useVirtualListHost({ observeWidth: true })
  const scrollParentRef = useRef<HTMLDivElement | null>(null)

  const columns = albumGalleryColumns(hostWidth)
  const albumRows = useMemo(
    () =>
      chunkIntoRows(tiles, columns).map((rowTiles, index) => ({
        key: `row-${index}-${rowTiles[0]?.name ?? index}`,
        tiles: rowTiles,
      })),
    [tiles, columns],
  )
  const rowHeight = albumGalleryRowHeight(hostWidth, columns)
  const listHeight = capVirtualListHeight(albumRows.length, rowHeight, hostHeight)
  const listFlush = !virtualListNeedsScroll(albumRows.length, rowHeight, hostHeight)

  const rowVirtualizer = useVirtualizer({
    count: albumRows.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => rowHeight,
    overscan: 4,
  })

  const rowStyle = {
    gap: `${ALBUM_GALLERY_GAP_PX}px`,
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    paddingBottom: `${ALBUM_GALLERY_GAP_PX}px`,
  } as const

  return (
    <Box
      ref={listHostRef}
      className="list-host album-gallery"
      sx={{ flex: '1 1 auto', minHeight: 0 }}
    >
      <Box
        ref={scrollParentRef}
        className={`album-list${listFlush ? ' album-list--flush' : ''}`}
        sx={{
          height: listHeight,
          overflowY: listFlush ? 'hidden' : 'auto',
          bgcolor: 'transparent',
          position: 'relative',
        }}
      >
        <Box sx={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = albumRows[virtualRow.index]
            if (!row) return null
            return (
              <Box
                key={row.key}
                className="album-gallery-row"
                style={{
                  ...rowStyle,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  boxSizing: 'border-box',
                }}
              >
                {row.tiles.map((tile) => (
                  <Box
                    key={tile.name}
                    component={Link}
                    to={pathFor(tile.name)}
                    className="album-tile"
                    sx={{
                      color: 'inherit',
                      textDecoration: 'none',
                      animation: 'td-album-rise 0.45s ease both',
                      minWidth: 0,
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none',
                      },
                      '&:hover .album-tile__art': {
                        transform: 'translateY(calc(var(--td-motion-cover) * -1))',
                      },
                    }}
                  >
                    <Box
                      className="album-tile__art"
                      sx={{
                        aspectRatio: '1',
                        borderRadius: 'var(--td-radius-lg)',
                        overflow: 'hidden',
                        boxShadow: 'var(--td-cover-shadow)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      {tile.coverSrc ? (
                        <CoverImg
                          src={tile.coverSrc}
                          aspectRatio={1}
                          className="album-tile__cover"
                        />
                      ) : (
                        <Box
                          className="album-tile__fallback"
                          aria-hidden
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'grid',
                            placeItems: 'center',
                            background: `linear-gradient(145deg, var(--td-cover-start), var(--td-cover-end))`,
                            color: 'rgba(232, 241, 240, 0.7)',
                          }}
                        >
                          <AlbumIcon sx={{ fontSize: 40 }} />
                        </Box>
                      )}
                    </Box>
                    <Box className="album-tile__meta" sx={{ mt: 1 }}>
                      <Box
                        className="album-tile__title"
                        sx={{
                          typography: 'body2',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {localizeAlbumName(tile.name, t)}
                      </Box>
                      <Box
                        className="album-tile__subtitle"
                        sx={{ typography: 'caption', color: 'text.secondary' }}
                      >
                        {t('album.trackCount', { count: tile.trackCount })}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

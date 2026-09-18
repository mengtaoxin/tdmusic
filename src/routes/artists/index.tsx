import { useEffect, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PersonIcon from '@mui/icons-material/Person'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'

import { useVirtualListHost } from '@/hooks/useVirtualListHost'
import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'
import { localizeArtistName } from '@/lib/catalog/displayLabels'
import { artistAlbumsPath } from '@/lib/routes/artistRoutes'
import { capVirtualListHeight, virtualListNeedsScroll } from '@/lib/virtualListHeight'
import { selectArtists, useCatalogStore } from '@/stores/catalog'

export const Route = createFileRoute('/artists/')({
  component: ArtistListPage,
})

const ARTIST_ROW_HEIGHT = 64

function ArtistListPage() {
  const { t } = useTranslation()
  const artists = useCatalogStore(selectArtists)
  const loading = useCatalogStore((s) => s.loading)
  const { listHostRef, hostHeight } = useVirtualListHost()
  const scrollParentRef = useRef<HTMLDivElement | null>(null)

  const listHeight = capVirtualListHeight(artists.length, ARTIST_ROW_HEIGHT, hostHeight)
  const listFlush = !virtualListNeedsScroll(artists.length, ARTIST_ROW_HEIGHT, hostHeight)

  const rowVirtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ARTIST_ROW_HEIGHT,
    overscan: 8,
  })

  useEffect(() => {
    void ensureCatalogLoaded()
  }, [])

  return (
    <Container
      maxWidth={false}
      className="page artist-list-page"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {t('nav.artistList')}
      </Typography>

      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : (
        <Box ref={listHostRef} className="list-host" sx={{ flex: '1 1 auto', minHeight: 0 }}>
          <Box
            ref={scrollParentRef}
            className={`artist-list${listFlush ? ' artist-list--flush' : ''}`}
            sx={{
              height: listHeight,
              overflowY: listFlush ? 'hidden' : 'auto',
              bgcolor: 'transparent',
              position: 'relative',
            }}
          >
            <Box
              sx={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const group = artists[virtualRow.index]
                if (!group) return null
                return (
                  <Box
                    key={group.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ListItemButton
                      component={Link}
                      to={artistAlbumsPath(group.name)}
                      sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={localizeArtistName(group.name, t)}
                        secondary={t('artist.trackCount', { count: group.tracks.length })}
                      />
                      <ChevronRightIcon />
                    </ListItemButton>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  )
}

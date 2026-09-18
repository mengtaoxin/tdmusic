import { createFileRoute, Link } from '@tanstack/react-router'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PersonIcon from '@mui/icons-material/Person'
import { useTranslation } from 'react-i18next'

import { CatalogPageShell } from '@/components/CatalogPageShell'
import { VirtualRowList } from '@/components/VirtualRowList'
import { localizeArtistName } from '@/lib/catalog/displayLabels'
import { artistAlbumsPath } from '@/lib/routes/artistRoutes'
import { selectArtists, useCatalogStore } from '@/stores/catalog'

export const Route = createFileRoute('/artists/')({
  component: ArtistListPage,
})

const ARTIST_ROW_HEIGHT = 64

function ArtistListPage() {
  const { t } = useTranslation()
  const artists = useCatalogStore(selectArtists)
  const loading = useCatalogStore((s) => s.loading)

  return (
    <CatalogPageShell className="artist-list-page" title={t('nav.artistList')} loading={loading}>
      <VirtualRowList
        items={artists}
        itemHeight={ARTIST_ROW_HEIGHT}
        fillHost
        listClassName="artist-list"
        getItemKey={(group) => group.name}
        renderRow={(group) => (
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
        )}
      />
    </CatalogPageShell>
  )
}

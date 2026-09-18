import { createFileRoute, Link } from '@tanstack/react-router'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { useTranslation } from 'react-i18next'

import { playlistPath } from '@/lib/routes/playlistRoutes'
import { useCatalogStore } from '@/stores/catalog'

export const Route = createFileRoute('/playlists/')({
  component: PlaylistListPage,
})

function PlaylistListPage() {
  const { t } = useTranslation()
  const playlists = useCatalogStore((s) => s.playlists)

  return (
    <Container maxWidth={false} className="page">
      <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
        {t('nav.playlist')}
      </Typography>

      {playlists.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {t('playlist.empty')}{' '}
          <Box component={Link} to="/config-guides" sx={{ color: 'secondary.main' }}>
            {t('settings.configGuidesLink')}
          </Box>
        </Typography>
      ) : (
        <List sx={{ bgcolor: 'transparent' }}>
          {playlists.map((playlist, index) => (
            <ListItemButton
              key={`${playlist.title}-${index}`}
              component={Link}
              to={playlistPath(playlist.title)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <QueueMusicIcon />
              </ListItemIcon>
              <ListItemText
                primary={playlist.title}
                secondary={t('playlist.trackCount', { count: playlist.trackIds.length })}
              />
              <ChevronRightIcon />
            </ListItemButton>
          ))}
        </List>
      )}
    </Container>
  )
}

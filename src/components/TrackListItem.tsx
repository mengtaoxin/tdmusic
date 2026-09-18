import { useState, type MouseEvent, type PointerEvent } from 'react'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'
import { useTranslation } from 'react-i18next'

import { CoverImg } from '@/components/CoverImg'
import { useTrackDownload } from '@/hooks/useTrackDownload'
import { localizeAlbumName, localizeArtistName } from '@/lib/catalog/displayLabels'
import type { DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

export type TrackListItemProps = {
  track: DisplayTrack
  active?: boolean
  /** playback = Play next / Add to queue; queue = Remove from queue */
  actions?: 'playback' | 'queue' | 'none'
  onSelect?: () => void
  onPlayNext?: () => void
  onAddToQueue?: () => void
  onRemove?: () => void
}

export function TrackListItem({
  track,
  active = false,
  actions = 'playback',
  onSelect,
  onPlayNext,
  onAddToQueue,
  onRemove,
}: TrackListItemProps) {
  const { t } = useTranslation()
  const currentId = usePlayerStore((s) => s.currentId)
  const { downloading } = useTrackDownload(track)
  const coverBusy = downloading && currentId === track.id

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const menuOpen = Boolean(menuAnchor)

  function openMenu(event: MouseEvent<HTMLElement>) {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
  }

  function stopPointerDown(event: PointerEvent) {
    event.stopPropagation()
  }

  function closeMenu() {
    setMenuAnchor(null)
  }

  const artist = localizeArtistName(track.displayArtist, t)
  const subtitle = track.displayAlbum
    ? `${artist} · ${localizeAlbumName(track.displayAlbum, t)}`
    : artist

  return (
    <ListItemButton
      selected={active}
      className="track-row"
      onClick={() => onSelect?.()}
      sx={{ borderRadius: 2, transition: 'background-color 0.2s ease' }}
    >
      <Avatar variant="rounded" sx={{ width: 40, height: 40, mr: 1.5, bgcolor: 'action.hover' }}>
        {track.displayCover || coverBusy ? (
          <CoverImg src={track.displayCover} downloading={coverBusy} />
        ) : (
          <MusicNoteIcon fontSize="small" />
        )}
      </Avatar>
      <ListItemText
        primary={track.displayTitle}
        secondary={subtitle}
        slotProps={{
          primary: { noWrap: true },
          secondary: { noWrap: true },
        }}
      />
      {actions !== 'none' ? (
        <>
          <IconButton
            data-testid="track-actions"
            size="small"
            edge="end"
            aria-label={t('nav.more')}
            onClick={openMenu}
            onPointerDown={stopPointerDown}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={menuOpen}
            onClose={closeMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            transitionDuration={150}
            slotProps={{ list: { dense: true, sx: { minWidth: 180 } } }}
          >
            {actions === 'playback' ? (
              <>
                <MenuItem
                  data-testid="track-play-next"
                  onClick={() => {
                    closeMenu()
                    onPlayNext?.()
                  }}
                >
                  <ListItemIcon>
                    <PlaylistPlayIcon fontSize="small" />
                  </ListItemIcon>
                  {t('player.playNext')}
                </MenuItem>
                <MenuItem
                  data-testid="track-add-to-queue"
                  onClick={() => {
                    closeMenu()
                    onAddToQueue?.()
                  }}
                >
                  <ListItemIcon>
                    <PlaylistAddIcon fontSize="small" />
                  </ListItemIcon>
                  {t('player.addToQueue')}
                </MenuItem>
              </>
            ) : (
              <MenuItem
                data-testid="track-remove"
                onClick={() => {
                  closeMenu()
                  onRemove?.()
                }}
              >
                <ListItemIcon>
                  <PlaylistRemoveIcon fontSize="small" />
                </ListItemIcon>
                {t('player.removeFromQueue')}
              </MenuItem>
            )}
          </Menu>
        </>
      ) : null}
    </ListItemButton>
  )
}

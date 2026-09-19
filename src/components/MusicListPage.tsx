import Alert from '@mui/material/Alert'
import { useTranslation } from 'react-i18next'

import { CatalogPageShell } from '@/components/CatalogPageShell'
import { PlayAllButtons } from '@/components/PlayAllButtons'
import { TrackListItem } from '@/components/TrackListItem'
import { VirtualRowList } from '@/components/VirtualRowList'
import { useTrackListPlayback } from '@/hooks/useTrackListPlayback'
import { selectTracks, useCatalogStore } from '@/stores/catalog'

const TRACK_ROW_HEIGHT = 64

export function MusicListPage() {
  const { t } = useTranslation()
  const tracks = useCatalogStore(selectTracks)
  const loading = useCatalogStore((s) => s.loading)
  const loadError = useCatalogStore((s) => s.loadError)
  const errors = useCatalogStore((s) => s.errors)
  const { currentId, playAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(
    tracks.map((track) => track.id),
  )

  function playAllInOrder() {
    if (!tracks.length) return
    playAt(0, { shuffle: false })
  }

  function shufflePlayAll() {
    if (!tracks.length) return
    const start = Math.floor(Math.random() * tracks.length)
    playAt(start, { shuffle: true })
  }

  return (
    <CatalogPageShell
      className="music-list-page"
      title={t('nav.musicList')}
      loading={loading}
      headerExtra={
        <>
          {loadError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          ) : null}
          {errors.map((err, i) => (
            <Alert key={i} severity="warning" sx={{ mb: 1 }}>
              {t('catalog.configError', { message: err })}
            </Alert>
          ))}
          {tracks.length > 0 ? (
            <PlayAllButtons onPlayAll={playAllInOrder} onShuffleAll={shufflePlayAll} />
          ) : null}
        </>
      }
    >
      <VirtualRowList
        items={tracks}
        itemHeight={TRACK_ROW_HEIGHT}
        fillHost
        listClassName="track-list"
        getItemKey={(track) => track.id}
        renderRow={(track, index) => (
          <TrackListItem
            track={track}
            active={currentId === track.id}
            onSelect={() => playAt(index)}
            onPlayNext={() => playNextTrack(track.id)}
            onAddToQueue={() => addTrackToQueue(track.id)}
          />
        )}
      />
    </CatalogPageShell>
  )
}

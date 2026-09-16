import type { DisplayTrack } from '@/stores/catalog'

type MediaSessionPlayer = {
  play: () => void
  pause: () => void
  prev: () => void
  next: () => void
  seek: (time: number) => void
  playing: boolean
  duration: number
  currentTime: number
}

export function hasMediaSession(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator
}

/** Bind Media Session metadata and transport handlers for OS / lock-screen controls. */
export function syncMediaSession(
  track: DisplayTrack | undefined,
  player: MediaSessionPlayer,
): void {
  if (!hasMediaSession()) return
  const session = navigator.mediaSession

  if (track) {
    const artwork = track.displayCover
      ? [{ src: track.displayCover, sizes: '512x512', type: 'image/jpeg' }]
      : []
    session.metadata = new MediaMetadata({
      title: track.displayTitle,
      artist: track.displayArtist,
      album: track.displayAlbum,
      artwork,
    })
  } else {
    session.metadata = null
  }

  session.playbackState = player.playing ? 'playing' : 'paused'

  const bind = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
    try {
      session.setActionHandler(action, handler)
    } catch {
      // Some browsers reject unsupported actions.
    }
  }

  bind('play', () => player.play())
  bind('pause', () => player.pause())
  bind('previoustrack', () => player.prev())
  bind('nexttrack', () => player.next())
  bind('seekto', (details) => {
    if (details.seekTime != null && Number.isFinite(details.seekTime)) {
      player.seek(details.seekTime)
    }
  })
  bind('seekbackward', (details) => {
    const offset = details.seekOffset ?? 10
    player.seek(Math.max(0, player.currentTime - offset))
  })
  bind('seekforward', (details) => {
    const offset = details.seekOffset ?? 10
    const max = player.duration || Number.POSITIVE_INFINITY
    player.seek(Math.min(max, player.currentTime + offset))
  })

  if (track && Number.isFinite(player.duration) && player.duration > 0) {
    try {
      session.setPositionState({
        duration: player.duration,
        playbackRate: 1,
        position: Math.min(Math.max(0, player.currentTime), player.duration),
      })
    } catch {
      // Some browsers reject unsupported position state.
    }
  }
}

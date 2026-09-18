import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'

import { NowPlayingFooter } from '@/components/NowPlayingFooter'
import { renderWithTestRouter } from '@/__tests__/renderWithProviders'
import type { DisplayTrack } from '@/stores/catalog'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

function makeTrack(id = 't1', title = 'Song One'): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    displayTitle: title,
    displayArtist: 'Artist One',
    displayAlbum: 'Album One',
  }
}

function seedPlaying() {
  const track = makeTrack()
  const track2 = makeTrack('t2', 'Song Two')
  useCatalogStore.getState().setTracks([track, track2])
  usePlayerStore.setState({
    queue: [track.id, track2.id],
    originalQueue: [track.id, track2.id],
    currentId: track.id,
    currentIndex: 0,
    currentTime: 30,
    duration: 120,
  })
}

describe('NowPlayingFooter', () => {
  it('is hidden when there is no current track', async () => {
    await renderWithTestRouter({ component: () => <NowPlayingFooter /> })
    expect(screen.queryByTestId('footer-prev')).not.toBeInTheDocument()
    expect(screen.queryByTestId('footer-next')).not.toBeInTheDocument()
  })

  it('is visible with prev/next when a current track is in catalog + player', async () => {
    seedPlaying()
    await renderWithTestRouter({ component: () => <NowPlayingFooter /> })

    expect(screen.getByText('Song One')).toBeInTheDocument()
    expect(screen.getByTestId('footer-prev')).toBeInTheDocument()
    expect(screen.getByTestId('footer-next')).toBeInTheDocument()
  })
})

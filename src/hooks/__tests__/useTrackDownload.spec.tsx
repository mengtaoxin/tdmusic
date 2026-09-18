import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { useTrackDownload } from '@/hooks/useTrackDownload'
import {
  reportCacheDownload,
  resetCacheDownloadStateForTests,
} from '@/lib/cache/cacheDownloadState'
import type { DisplayTrack } from '@/stores/catalog'

const track: DisplayTrack = {
  id: 't1',
  path: '/music/t1.mp3',
  displayTitle: 'Song',
  displayArtist: 'Artist',
  displayAlbum: 'Album',
}

function Harness({ track: t }: { track: DisplayTrack }) {
  const { downloading, percent } = useTrackDownload(t)
  return (
    <div>
      <span data-testid="downloading">{String(downloading)}</span>
      <span data-testid="percent">{String(percent)}</span>
    </div>
  )
}

describe('useTrackDownload', () => {
  beforeEach(() => {
    resetCacheDownloadStateForTests()
  })

  it('tracks downloading state from cache download progress', async () => {
    render(<Harness track={track} />)

    expect(screen.getByTestId('downloading')).toHaveTextContent('false')

    reportCacheDownload(track.path, track.id, { phase: 'download', loaded: 50, total: 200 })
    await waitFor(() => {
      expect(screen.getByTestId('downloading')).toHaveTextContent('true')
      expect(screen.getByTestId('percent')).toHaveTextContent('25')
    })

    reportCacheDownload(track.path, track.id, { phase: 'done', loaded: 200, total: 200 })
    await waitFor(() => {
      expect(screen.getByTestId('downloading')).toHaveTextContent('false')
    })
  })
})

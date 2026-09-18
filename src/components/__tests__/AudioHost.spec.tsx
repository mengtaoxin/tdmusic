import { beforeEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { act } from 'react'

import { AudioHost } from '@/components/AudioHost'
import { renderWithProviders } from '@/__tests__/renderWithProviders'
import { listAppLogs, resetAppLogDbForTests } from '@/lib/appLogStore'
import type { DisplayTrack } from '@/lib/catalog/catalogIndex'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

vi.mock('@/lib/playback/resolvePlayableUrl', () => ({
  resolvePlayableUrl: vi.fn<() => Promise<string>>(async () => 'blob:test'),
}))

vi.mock('@/lib/playback/prefetchUpcoming', () => ({
  prefetchUpcoming: vi.fn<() => Promise<void>>(async () => undefined),
}))

import { resolvePlayableUrl } from '@/lib/playback/resolvePlayableUrl'

function makeTrack(id: string, title = id): DisplayTrack {
  return {
    id,
    path: `https://example.com/${id}.mp3`,
    displayTitle: title,
    displayArtist: 'A',
    displayAlbum: 'B',
  }
}

async function bumpLoad(trackIds: string[], currentId: string) {
  usePlayerStore.setState({
    queue: trackIds,
    originalQueue: trackIds,
    currentId,
    currentIndex: trackIds.indexOf(currentId),
    pendingPlay: true,
    playing: true,
    loadToken: usePlayerStore.getState().loadToken + 1,
  })
  await act(async () => {})
}

describe('AudioHost', () => {
  beforeEach(async () => {
    await resetAppLogDbForTests()
    vi.mocked(resolvePlayableUrl).mockReset()
    vi.mocked(resolvePlayableUrl).mockResolvedValue('blob:test')
  })

  it('mounts global-audio', () => {
    const { container } = renderWithProviders(<AudioHost />)
    expect(container.querySelector('[data-testid="global-audio"]')).toBeTruthy()
  })

  it('calls resolvePlayableUrl when loadToken bumps with a track', async () => {
    useCatalogStore.getState().setTracks([makeTrack('t1', 'One')])
    renderWithProviders(<AudioHost />)

    await bumpLoad(['t1'], 't1')

    await waitFor(() => {
      expect(resolvePlayableUrl).toHaveBeenCalledWith('https://example.com/t1.mp3', 't1')
    })
  })

  it('enables native loop when repeat mode is one', async () => {
    const { container } = renderWithProviders(<AudioHost />)
    const audio = container.querySelector('[data-testid="global-audio"]') as HTMLAudioElement
    expect(audio.loop).toBe(false)

    await act(async () => {
      usePlayerStore.setState({ repeatMode: 'one' })
    })
    expect(audio.loop).toBe(true)

    await act(async () => {
      usePlayerStore.setState({ repeatMode: 'off' })
    })
    expect(audio.loop).toBe(false)
  })

  it('clears pendingPlay on external pause so playback can resume', async () => {
    useCatalogStore.getState().setTracks([makeTrack('smile', 'Smile')])
    const { container } = renderWithProviders(<AudioHost />)
    const audio = container.querySelector('[data-testid="global-audio"]') as HTMLAudioElement
    const playSpy = vi.spyOn(audio, 'play').mockResolvedValue(undefined)
    vi.spyOn(audio, 'load').mockImplementation(() => undefined)

    await bumpLoad(['smile'], 'smile')
    await waitFor(() => expect(resolvePlayableUrl).toHaveBeenCalled())
    audio.dispatchEvent(new Event('loadedmetadata'))
    await act(async () => {})

    playSpy.mockClear()
    audio.dispatchEvent(new Event('pause'))
    await act(async () => {})

    expect(usePlayerStore.getState().playing).toBe(false)
    expect(usePlayerStore.getState().pendingPlay).toBe(false)

    await act(async () => {
      usePlayerStore.getState().togglePlay()
    })
    expect(playSpy).toHaveBeenCalled()
  })

  it('skips a track when resolvePlayableUrl fails and loads the next', async () => {
    useCatalogStore.getState().setTracks([makeTrack('bad', 'Bad'), makeTrack('good', 'Good')])
    vi.mocked(resolvePlayableUrl).mockImplementation(async (_path, id) => {
      if (id === 'bad') throw new Error('downloadFailed:404')
      return 'blob:good'
    })

    const { container } = renderWithProviders(<AudioHost />)
    const audio = container.querySelector('[data-testid="global-audio"]') as HTMLAudioElement
    vi.spyOn(audio, 'play').mockResolvedValue(undefined)
    vi.spyOn(audio, 'load').mockImplementation(() => undefined)

    await bumpLoad(['bad', 'good'], 'bad')

    await waitFor(() => {
      expect(usePlayerStore.getState().currentId).toBe('good')
    })
    expect(usePlayerStore.getState().pendingPlay).toBe(true)

    const logs = await listAppLogs()
    expect(
      logs.some((entry) => /bad/i.test(entry.message) && /fail|download/i.test(entry.message)),
    ).toBe(true)
  })
})

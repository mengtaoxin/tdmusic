import { describe, expect, it, vi } from 'vitest'

import { runCatalogLoad } from '../runCatalogLoad'

function ports() {
  return {
    loadConfigsJson: vi.fn<() => Promise<unknown>>(async () => ({
      'music-list': [{ id: 'a', path: '/a.mp3' }],
    })),
    beginLoad: vi.fn<() => void>(),
    applyNormalized: vi.fn<(value: unknown) => void>(),
    failLoad: vi.fn<(message: string) => void>(),
    finishLoad: vi.fn<() => void>(),
    clearEnrichQueue: vi.fn<() => void>(),
    scheduleEnrichment: vi.fn<() => void>(),
  }
}

describe('runCatalogLoad', () => {
  it('fetches, normalizes, applies, and schedules enrich', async () => {
    const p = ports()
    await runCatalogLoad(p)

    expect(p.beginLoad).toHaveBeenCalledOnce()
    expect(p.clearEnrichQueue).toHaveBeenCalledOnce()
    expect(p.loadConfigsJson).toHaveBeenCalledOnce()
    expect(p.applyNormalized).toHaveBeenCalledWith({
      tracks: [expect.objectContaining({ id: 'a', path: '/a.mp3' })],
      playlists: [],
      errors: [],
    })
    expect(p.scheduleEnrichment).toHaveBeenCalledOnce()
    expect(p.failLoad).not.toHaveBeenCalled()
    expect(p.finishLoad).toHaveBeenCalledOnce()
  })

  it('records a load error without applying a catalog', async () => {
    const p = ports()
    p.loadConfigsJson.mockRejectedValue(new Error('offline'))
    await runCatalogLoad(p)

    expect(p.applyNormalized).not.toHaveBeenCalled()
    expect(p.scheduleEnrichment).not.toHaveBeenCalled()
    expect(p.failLoad).toHaveBeenCalledWith('offline')
    expect(p.finishLoad).toHaveBeenCalledOnce()
  })
})

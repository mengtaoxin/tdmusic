import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { PLAYER_STORAGE_KEY } from '@/lib/playerLogic'
import { usePlayerStore } from '../player'

describe('playerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
  })

  it('playFrom sets head immediately and fills queue in chunks', async () => {
    const store = usePlayerStore()
    const ids = ['a', 'b', 'c', 'd']
    store.playFrom(1, ids)
    expect(store.queue).toEqual(['b'])
    expect(store.currentId).toBe('b')
    expect(store.playing).toBe(true)

    await vi.runAllTimersAsync()
    expect(store.queue).toEqual(['b', 'c', 'd'])
  })

  it('persists and hydrates playback point', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['x', 'y'])
    await vi.runAllTimersAsync()
    store.setCurrentTime(42)
    store.flushPersist()

    const raw = localStorage.getItem(PLAYER_STORAGE_KEY)
    expect(raw).toContain('"currentTime":42')

    setActivePinia(createPinia())
    const restored = usePlayerStore()
    const ok = restored.hydrate(new Set(['x', 'y']))
    expect(ok).toBe(true)
    expect(restored.queue).toEqual(['x', 'y'])
    expect(restored.currentId).toBe('x')
    expect(restored.currentTime).toBe(42)
    expect(restored.playing).toBe(false)
  })

  it('next respects repeat all', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b'])
    await vi.runAllTimersAsync()
    store.repeatMode = 'all'
    store.goToIndex(1, true)
    store.next()
    expect(store.currentId).toBe('a')
  })
})

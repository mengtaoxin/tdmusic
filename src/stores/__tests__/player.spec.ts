import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { PLAYER_STORAGE_KEY } from '@/lib/playback/playerLogic'
import { usePlayerStore } from '../player'

describe('playerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
  })

  it('playFrom sets head immediately and fills the full source list in chunks', async () => {
    const store = usePlayerStore()
    const ids = ['a', 'b', 'c', 'd']
    store.playFrom(1, ids)
    expect(store.currentId).toBe('b')
    expect(store.playing).toBe(true)
    expect(store.queue).toEqual(['a', 'b'])

    await vi.runAllTimersAsync()
    expect(store.queue).toEqual(['a', 'b', 'c', 'd'])
    expect(store.originalQueue).toEqual(['a', 'b', 'c', 'd'])
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

  it('skip advances past current track even when repeat is one', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    store.repeatMode = 'one'
    store.skip()
    expect(store.currentId).toBe('b')
    expect(store.pendingPlay).toBe(true)
  })

  it('next advances to the next queue track even when repeat is one', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    store.repeatMode = 'one'
    store.next()
    expect(store.currentId).toBe('b')
    expect(store.playing).toBe(true)
    expect(store.pendingPlay).toBe(true)
  })

  it('prev goes to the previous queue track even when repeat is one', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    store.repeatMode = 'one'
    store.goToIndex(1, true)
    store.prev()
    expect(store.currentId).toBe('a')
    expect(store.playing).toBe(true)
  })

  it('toggleShuffle reorders upcoming tracks and restores original order', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'c', 'd', 'e'])
    await vi.runAllTimersAsync()
    store.goToIndex(1, true)
    expect(store.queue).toEqual(['a', 'b', 'c', 'd', 'e'])

    const values = [0, 0]
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0)
    store.toggleShuffle()
    expect(store.shuffle).toBe(true)
    expect(store.currentId).toBe('b')
    expect(store.queue).toEqual(['a', 'b', 'd', 'e', 'c'])

    store.toggleShuffle()
    expect(store.shuffle).toBe(false)
    expect(store.currentId).toBe('b')
    expect(store.queue).toEqual(['a', 'b', 'c', 'd', 'e'])
    rnd.mockRestore()
  })

  it('playFrom with shuffle on builds a shuffled upcoming queue', async () => {
    const store = usePlayerStore()
    store.shuffle = true
    const values = [0, 0]
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0)
    store.playFrom(0, ['a', 'b', 'c', 'd'])
    await vi.runAllTimersAsync()
    expect(store.currentId).toBe('a')
    expect(store.queue).toEqual(['a', 'c', 'd', 'b'])
    rnd.mockRestore()
  })

  it('playFrom with shuffle on from a middle track puts that track first and shuffles the rest', async () => {
    const store = usePlayerStore()
    store.shuffle = true
    const values = [0, 0]
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0)
    store.playFrom(2, ['a', 'b', 'c', 'd'])
    await vi.runAllTimersAsync()
    expect(store.currentId).toBe('c')
    expect(store.currentIndex).toBe(0)
    expect(store.queue).toEqual(['c', 'b', 'd', 'a'])
    expect(store.originalQueue).toEqual(['a', 'b', 'c', 'd'])
    rnd.mockRestore()
  })

  it('next walks the shuffled queue in order', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'c', 'd'])
    await vi.runAllTimersAsync()
    const values = [0, 0]
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0)
    store.toggleShuffle()
    expect(store.queue).toEqual(['a', 'c', 'd', 'b'])
    store.next()
    expect(store.currentId).toBe('c')
    store.next()
    expect(store.currentId).toBe('d')
    rnd.mockRestore()
  })

  it('playNext inserts after current and syncs originalQueue', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    store.playNext('x')
    expect(store.queue).toEqual(['a', 'x', 'b', 'c'])
    expect(store.originalQueue).toEqual(['a', 'x', 'b', 'c'])
    expect(store.currentId).toBe('a')
  })

  it('addToQueue appends to the end', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b'])
    await vi.runAllTimersAsync()
    store.addToQueue('z')
    expect(store.queue).toEqual(['a', 'b', 'z'])
    expect(store.originalQueue).toEqual(['a', 'b', 'z'])
  })

  it('playNext on empty queue starts playback with that track', () => {
    const store = usePlayerStore()
    store.playNext('solo')
    expect(store.queue).toEqual(['solo'])
    expect(store.currentId).toBe('solo')
    expect(store.playing).toBe(true)
  })

  it('addToQueue on empty queue starts playback with that track', () => {
    const store = usePlayerStore()
    store.addToQueue('solo')
    expect(store.queue).toEqual(['solo'])
    expect(store.currentId).toBe('solo')
    expect(store.playing).toBe(true)
  })

  it('removeAt drops a non-current track', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    store.removeAt(1)
    expect(store.queue).toEqual(['a', 'c'])
    expect(store.originalQueue).toEqual(['a', 'c'])
    expect(store.currentId).toBe('a')
  })

  it('removeAt on current advances then drops the old track', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    store.removeAt(0)
    expect(store.currentId).toBe('b')
    expect(store.queue).toEqual(['b', 'c'])
    expect(store.playing).toBe(true)
  })

  it('removeAt on the only track clears and pauses', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a'])
    await vi.runAllTimersAsync()
    store.removeAt(0)
    expect(store.queue).toEqual([])
    expect(store.currentId).toBeNull()
    expect(store.playing).toBe(false)
  })

  it('clearUpcoming keeps current and drops the tail', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'c', 'd'])
    await vi.runAllTimersAsync()
    store.goToIndex(1, true)
    store.clearUpcoming()
    expect(store.queue).toEqual(['a', 'b'])
    expect(store.originalQueue).toEqual(['a', 'b'])
    expect(store.currentId).toBe('b')
  })

  it('clearNowPlaying empties the queue, stops playback, and persists', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    store.setCurrentTime(12)
    store.clearNowPlaying()
    expect(store.queue).toEqual([])
    expect(store.originalQueue).toEqual([])
    expect(store.currentId).toBeNull()
    expect(store.currentIndex).toBe(-1)
    expect(store.currentTime).toBe(0)
    expect(store.playing).toBe(false)
    expect(localStorage.getItem(PLAYER_STORAGE_KEY)).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)!).queue).toEqual([])
  })

  it('goToIndex on a duplicate id drives next/prev/clearUpcoming from that occurrence', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'a', 'c'])
    await vi.runAllTimersAsync()
    store.goToIndex(2, true)
    expect(store.currentIndex).toBe(2)
    expect(store.currentId).toBe('a')

    store.next()
    expect(store.currentIndex).toBe(3)
    expect(store.currentId).toBe('c')

    store.goToIndex(2, true)
    store.prev()
    expect(store.currentIndex).toBe(1)
    expect(store.currentId).toBe('b')

    store.goToIndex(2, true)
    store.clearUpcoming()
    expect(store.queue).toEqual(['a', 'b', 'a'])
    expect(store.originalQueue).toEqual(['a', 'b', 'a'])
    expect(store.currentIndex).toBe(2)
    expect(store.currentId).toBe('a')
  })

  it('removeAt before the playing duplicate shifts currentIndex', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'a'])
    await vi.runAllTimersAsync()
    store.goToIndex(2, true)
    store.removeAt(0)
    expect(store.queue).toEqual(['b', 'a'])
    expect(store.originalQueue).toEqual(['b', 'a'])
    expect(store.currentIndex).toBe(1)
    expect(store.currentId).toBe('a')
  })

  it('removeAt drops the matching duplicate in originalQueue, not the first id', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'a'])
    await vi.runAllTimersAsync()
    store.removeAt(2)
    expect(store.queue).toEqual(['a', 'b'])
    expect(store.originalQueue).toEqual(['a', 'b'])
    expect(store.currentIndex).toBe(0)
    expect(store.currentId).toBe('a')
  })

  it('playNext after a duplicate occurrence inserts in originalQueue at that occurrence', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'a', 'c'])
    await vi.runAllTimersAsync()
    store.goToIndex(2, true)
    store.playNext('x')
    expect(store.queue).toEqual(['a', 'b', 'a', 'x', 'c'])
    expect(store.originalQueue).toEqual(['a', 'b', 'a', 'x', 'c'])
    expect(store.currentIndex).toBe(2)
  })

  it('turning shuffle off restores the same duplicate occurrence', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'a', 'c'])
    await vi.runAllTimersAsync()
    store.goToIndex(0, true)
    const values = [0, 0]
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0)
    store.toggleShuffle()
    // head [a] + shuffle [b,a,c] with random 0 → [a, a, c, b]
    expect(store.queue).toEqual(['a', 'a', 'c', 'b'])
    store.goToIndex(1, true)
    expect(store.currentId).toBe('a')
    store.toggleShuffle()
    expect(store.shuffle).toBe(false)
    expect(store.queue).toEqual(['a', 'b', 'a', 'c'])
    expect(store.currentIndex).toBe(2)
    expect(store.currentId).toBe('a')
    store.next()
    expect(store.currentId).toBe('c')
    rnd.mockRestore()
  })

  it('persists and hydrates currentIndex for duplicate queue ids', async () => {
    const store = usePlayerStore()
    store.playFrom(0, ['a', 'b', 'a'])
    await vi.runAllTimersAsync()
    store.goToIndex(2, true)
    store.setCurrentTime(9)
    store.flushPersist()

    setActivePinia(createPinia())
    const restored = usePlayerStore()
    expect(restored.hydrate(new Set(['a', 'b']))).toBe(true)
    expect(restored.queue).toEqual(['a', 'b', 'a'])
    expect(restored.currentIndex).toBe(2)
    expect(restored.currentId).toBe('a')
    expect(restored.currentTime).toBe(9)
  })
})

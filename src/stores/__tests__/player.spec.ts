import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PLAYER_STORAGE_KEY } from '@/lib/playback/playerStateCodec'
import { usePlayerStore } from '../player'

describe('playerStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  it('playFrom sets head immediately and fills the full source list in chunks', async () => {
    const ids = ['a', 'b', 'c', 'd']
    usePlayerStore.getState().playFrom(1, ids)
    expect(usePlayerStore.getState().currentId).toBe('b')
    expect(usePlayerStore.getState().playing).toBe(true)
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b'])

    await vi.runAllTimersAsync()
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b', 'c', 'd'])
    expect(usePlayerStore.getState().originalQueue).toEqual(['a', 'b', 'c', 'd'])
  })

  it('persists and hydrates playback point', async () => {
    usePlayerStore.getState().playFrom(0, ['x', 'y'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().setCurrentTime(42)
    usePlayerStore.getState().flushPersist()

    const raw = localStorage.getItem(PLAYER_STORAGE_KEY)
    expect(raw).toContain('"currentTime":42')

    usePlayerStore.setState({
      queue: [],
      originalQueue: [],
      currentId: null,
      currentIndex: -1,
      currentTime: 0,
      duration: 0,
      playing: false,
      repeatMode: 'off',
      shuffle: false,
      loadToken: 0,
      seekTo: null,
      pendingPlay: false,
    })
    const ok = usePlayerStore.getState().hydrate(new Set(['x', 'y']))
    expect(ok).toBe(true)
    expect(usePlayerStore.getState().queue).toEqual(['x', 'y'])
    expect(usePlayerStore.getState().currentId).toBe('x')
    expect(usePlayerStore.getState().currentTime).toBe(42)
    expect(usePlayerStore.getState().playing).toBe(false)
  })

  it('next respects repeat all', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b'])
    await vi.runAllTimersAsync()
    usePlayerStore.setState({ repeatMode: 'all' })
    usePlayerStore.getState().goToIndex(1, true)
    usePlayerStore.getState().next()
    expect(usePlayerStore.getState().currentId).toBe('a')
  })

  it('skip advances past current track even when repeat is one', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    usePlayerStore.setState({ repeatMode: 'one' })
    usePlayerStore.getState().skip()
    expect(usePlayerStore.getState().currentId).toBe('b')
    expect(usePlayerStore.getState().pendingPlay).toBe(true)
  })

  it('next advances to the next queue track even when repeat is one', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    usePlayerStore.setState({ repeatMode: 'one' })
    usePlayerStore.getState().next()
    expect(usePlayerStore.getState().currentId).toBe('b')
    expect(usePlayerStore.getState().playing).toBe(true)
    expect(usePlayerStore.getState().pendingPlay).toBe(true)
  })

  it('prev goes to the previous queue track even when repeat is one', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    usePlayerStore.setState({ repeatMode: 'one' })
    usePlayerStore.getState().goToIndex(1, true)
    usePlayerStore.getState().prev()
    expect(usePlayerStore.getState().currentId).toBe('a')
    expect(usePlayerStore.getState().playing).toBe(true)
  })

  it('toggleShuffle reorders upcoming tracks and restores original order', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c', 'd', 'e'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().goToIndex(1, true)
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b', 'c', 'd', 'e'])

    const values = [0, 0]
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0)
    usePlayerStore.getState().toggleShuffle()
    expect(usePlayerStore.getState().shuffle).toBe(true)
    expect(usePlayerStore.getState().currentId).toBe('b')
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b', 'd', 'e', 'c'])

    usePlayerStore.getState().toggleShuffle()
    expect(usePlayerStore.getState().shuffle).toBe(false)
    expect(usePlayerStore.getState().currentId).toBe('b')
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b', 'c', 'd', 'e'])
    rnd.mockRestore()
  })

  it('playFrom with shuffle on builds a shuffled upcoming queue', async () => {
    const values = [0, 0]
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0)
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c', 'd'], { shuffle: true })
    await vi.runAllTimersAsync()
    expect(usePlayerStore.getState().currentId).toBe('a')
    expect(usePlayerStore.getState().shuffle).toBe(true)
    expect(usePlayerStore.getState().queue).toEqual(['a', 'c', 'd', 'b'])
    rnd.mockRestore()
  })

  it('playFrom with shuffle on from a middle track puts that track first and shuffles the rest', async () => {
    const values = [0, 0]
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0)
    usePlayerStore.getState().playFrom(2, ['a', 'b', 'c', 'd'], { shuffle: true })
    await vi.runAllTimersAsync()
    expect(usePlayerStore.getState().currentId).toBe('c')
    expect(usePlayerStore.getState().currentIndex).toBe(0)
    expect(usePlayerStore.getState().queue).toEqual(['c', 'b', 'd', 'a'])
    expect(usePlayerStore.getState().originalQueue).toEqual(['a', 'b', 'c', 'd'])
    rnd.mockRestore()
  })

  it('next walks the shuffled queue in order', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c', 'd'])
    await vi.runAllTimersAsync()
    const values = [0, 0]
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0)
    usePlayerStore.getState().toggleShuffle()
    expect(usePlayerStore.getState().queue).toEqual(['a', 'c', 'd', 'b'])
    usePlayerStore.getState().next()
    expect(usePlayerStore.getState().currentId).toBe('c')
    usePlayerStore.getState().next()
    expect(usePlayerStore.getState().currentId).toBe('d')
    rnd.mockRestore()
  })

  it('playNext inserts after current and syncs originalQueue', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().playNext('x')
    expect(usePlayerStore.getState().queue).toEqual(['a', 'x', 'b', 'c'])
    expect(usePlayerStore.getState().originalQueue).toEqual(['a', 'x', 'b', 'c'])
    expect(usePlayerStore.getState().currentId).toBe('a')
  })

  it('addToQueue appends to the end', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().addToQueue('z')
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b', 'z'])
    expect(usePlayerStore.getState().originalQueue).toEqual(['a', 'b', 'z'])
  })

  it.each([
    [
      'playNext',
      (store: ReturnType<typeof usePlayerStore.getState>, id: string) => store.playNext(id),
    ],
    [
      'addToQueue',
      (store: ReturnType<typeof usePlayerStore.getState>, id: string) => store.addToQueue(id),
    ],
  ] as const)('%s on empty queue starts playback with that track', (_name, enqueue) => {
    enqueue(usePlayerStore.getState(), 'solo')
    expect(usePlayerStore.getState().queue).toEqual(['solo'])
    expect(usePlayerStore.getState().currentId).toBe('solo')
    expect(usePlayerStore.getState().playing).toBe(true)
  })

  it('removeAt drops a non-current track', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().removeAt(1)
    expect(usePlayerStore.getState().queue).toEqual(['a', 'c'])
    expect(usePlayerStore.getState().originalQueue).toEqual(['a', 'c'])
    expect(usePlayerStore.getState().currentId).toBe('a')
  })

  it('removeAt on current advances then drops the old track', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().removeAt(0)
    expect(usePlayerStore.getState().currentId).toBe('b')
    expect(usePlayerStore.getState().queue).toEqual(['b', 'c'])
    expect(usePlayerStore.getState().playing).toBe(true)
  })

  it('removeAt on the only track clears and pauses', async () => {
    usePlayerStore.getState().playFrom(0, ['a'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().removeAt(0)
    expect(usePlayerStore.getState().queue).toEqual([])
    expect(usePlayerStore.getState().currentId).toBeNull()
    expect(usePlayerStore.getState().playing).toBe(false)
  })

  it('clearUpcoming keeps current and drops the tail', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c', 'd'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().goToIndex(1, true)
    usePlayerStore.getState().clearUpcoming()
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b'])
    expect(usePlayerStore.getState().originalQueue).toEqual(['a', 'b'])
    expect(usePlayerStore.getState().currentId).toBe('b')
  })

  it('clearNowPlaying empties the queue, stops playback, and persists', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'c'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().setCurrentTime(12)
    usePlayerStore.getState().clearNowPlaying()
    expect(usePlayerStore.getState().queue).toEqual([])
    expect(usePlayerStore.getState().originalQueue).toEqual([])
    expect(usePlayerStore.getState().currentId).toBeNull()
    expect(usePlayerStore.getState().currentIndex).toBe(-1)
    expect(usePlayerStore.getState().currentTime).toBe(0)
    expect(usePlayerStore.getState().playing).toBe(false)
    expect(localStorage.getItem(PLAYER_STORAGE_KEY)).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)!).queue).toEqual([])
  })

  it('goToIndex on a duplicate id drives next/prev/clearUpcoming from that occurrence', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'a', 'c'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().goToIndex(2, true)
    expect(usePlayerStore.getState().currentIndex).toBe(2)
    expect(usePlayerStore.getState().currentId).toBe('a')

    usePlayerStore.getState().next()
    expect(usePlayerStore.getState().currentIndex).toBe(3)
    expect(usePlayerStore.getState().currentId).toBe('c')

    usePlayerStore.getState().goToIndex(2, true)
    usePlayerStore.getState().prev()
    expect(usePlayerStore.getState().currentIndex).toBe(1)
    expect(usePlayerStore.getState().currentId).toBe('b')

    usePlayerStore.getState().goToIndex(2, true)
    usePlayerStore.getState().clearUpcoming()
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b', 'a'])
    expect(usePlayerStore.getState().originalQueue).toEqual(['a', 'b', 'a'])
    expect(usePlayerStore.getState().currentIndex).toBe(2)
    expect(usePlayerStore.getState().currentId).toBe('a')
  })

  it('removeAt before the playing duplicate shifts currentIndex', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'a'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().goToIndex(2, true)
    usePlayerStore.getState().removeAt(0)
    expect(usePlayerStore.getState().queue).toEqual(['b', 'a'])
    expect(usePlayerStore.getState().originalQueue).toEqual(['b', 'a'])
    expect(usePlayerStore.getState().currentIndex).toBe(1)
    expect(usePlayerStore.getState().currentId).toBe('a')
  })

  it('removeAt drops the matching duplicate in originalQueue, not the first id', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'a'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().removeAt(2)
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b'])
    expect(usePlayerStore.getState().originalQueue).toEqual(['a', 'b'])
    expect(usePlayerStore.getState().currentIndex).toBe(0)
    expect(usePlayerStore.getState().currentId).toBe('a')
  })

  it('playNext after a duplicate occurrence inserts in originalQueue at that occurrence', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'a', 'c'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().goToIndex(2, true)
    usePlayerStore.getState().playNext('x')
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b', 'a', 'x', 'c'])
    expect(usePlayerStore.getState().originalQueue).toEqual(['a', 'b', 'a', 'x', 'c'])
    expect(usePlayerStore.getState().currentIndex).toBe(2)
  })

  it('turning shuffle off restores the same duplicate occurrence', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'a', 'c'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().goToIndex(0, true)
    const values = [0, 0]
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0)
    usePlayerStore.getState().toggleShuffle()
    // head [a] + shuffle [b,a,c] with random 0 → [a, a, c, b]
    expect(usePlayerStore.getState().queue).toEqual(['a', 'a', 'c', 'b'])
    usePlayerStore.getState().goToIndex(1, true)
    expect(usePlayerStore.getState().currentId).toBe('a')
    usePlayerStore.getState().toggleShuffle()
    expect(usePlayerStore.getState().shuffle).toBe(false)
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b', 'a', 'c'])
    expect(usePlayerStore.getState().currentIndex).toBe(2)
    expect(usePlayerStore.getState().currentId).toBe('a')
    usePlayerStore.getState().next()
    expect(usePlayerStore.getState().currentId).toBe('c')
    rnd.mockRestore()
  })

  it('persists and hydrates currentIndex for duplicate queue ids', async () => {
    usePlayerStore.getState().playFrom(0, ['a', 'b', 'a'])
    await vi.runAllTimersAsync()
    usePlayerStore.getState().goToIndex(2, true)
    usePlayerStore.getState().setCurrentTime(9)
    usePlayerStore.getState().flushPersist()

    usePlayerStore.setState({
      queue: [],
      originalQueue: [],
      currentId: null,
      currentIndex: -1,
      currentTime: 0,
      duration: 0,
      playing: false,
      repeatMode: 'off',
      shuffle: false,
      loadToken: 0,
      seekTo: null,
      pendingPlay: false,
    })
    expect(usePlayerStore.getState().hydrate(new Set(['a', 'b']))).toBe(true)
    expect(usePlayerStore.getState().queue).toEqual(['a', 'b', 'a'])
    expect(usePlayerStore.getState().currentIndex).toBe(2)
    expect(usePlayerStore.getState().currentId).toBe('a')
    expect(usePlayerStore.getState().currentTime).toBe(9)
  })
})

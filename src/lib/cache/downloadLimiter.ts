const CONCURRENCY = 3

const pending: Array<() => void> = []
let active = 0

function acquire(): Promise<void> {
  if (active < CONCURRENCY) {
    active += 1
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    pending.push(() => {
      active += 1
      resolve()
    })
  })
}

function release(): void {
  active -= 1
  const next = pending.shift()
  if (next) next()
}

/** Run `fn` while holding one of at most 3 global audio-download slots. */
export async function withAudioDownloadSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquire()
  try {
    return await fn()
  } finally {
    release()
  }
}

export function resetDownloadLimiterForTests(): void {
  pending.length = 0
  active = 0
}

export function getDownloadLimiterStatsForTests() {
  return { active, pending: pending.length }
}

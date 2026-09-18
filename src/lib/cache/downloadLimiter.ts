const CONCURRENCY = 3

export type DownloadPriority = 'high' | 'normal'

type Waiter = {
  priority: DownloadPriority
  resume: () => void
}

const pending: Waiter[] = []
let active = 0

function takeNextWaiter(): Waiter | undefined {
  const highIndex = pending.findIndex((w) => w.priority === 'high')
  if (highIndex >= 0) {
    return pending.splice(highIndex, 1)[0]
  }
  return pending.shift()
}

function acquire(priority: DownloadPriority): Promise<void> {
  if (active < CONCURRENCY) {
    active += 1
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    pending.push({
      priority,
      resume: () => {
        active += 1
        resolve()
      },
    })
  })
}

function release(): void {
  active -= 1
  const next = takeNextWaiter()
  if (next) next.resume()
}

/** Run `fn` while holding one of at most 3 global audio-download slots. */
export async function withAudioDownloadSlot<T>(
  fn: () => Promise<T>,
  priority: DownloadPriority = 'normal',
): Promise<T> {
  await acquire(priority)
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

const CONCURRENCY = 2

type EnrichTask = () => Promise<void>

type QueuedJob = {
  run: () => Promise<void>
  cancel: () => void
}

const pending: QueuedJob[] = []
let active = 0

function pump() {
  while (active < CONCURRENCY && pending.length > 0) {
    const job = pending.shift()!
    active += 1
    void job
      .run()
      .catch(() => {
        // best-effort enrich; errors are swallowed at the queue boundary
      })
      .finally(() => {
        active -= 1
        pump()
      })
  }
}

/** Enqueue a catalog enrich job. At most 2 run concurrently. */
export function enqueueEnrich(task: EnrichTask): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false
    const job: QueuedJob = {
      cancel: () => {
        if (settled) return
        settled = true
        resolve()
      },
      run: async () => {
        try {
          await task()
          if (!settled) {
            settled = true
            resolve()
          }
        } catch (error) {
          if (!settled) {
            settled = true
            reject(error)
          }
          throw error
        }
      },
    }
    pending.push(job)
    pump()
  })
}

/** Drop queued (not yet started) enrich work. In-flight tasks finish normally. */
export function clearEnrichQueue(): void {
  const dropped = pending.splice(0, pending.length)
  for (const job of dropped) job.cancel()
}

export function getEnrichQueueStatsForTests() {
  return { active, pending: pending.length }
}

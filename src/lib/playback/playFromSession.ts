import { buildQueueFrom } from './playerLogic'

export type PlayFromSessionHooks = {
  onReset: () => void
  onHead: (headId: string, startIndex: number) => void
  onChunk: (chunk: string[]) => void
  onDone?: () => void
}

/** Owns the in-flight `buildQueueFrom` job for one player instance. */
export function createPlayFromSession() {
  let cancelFill: (() => void) | null = null

  function cancel() {
    cancelFill?.()
    cancelFill = null
  }

  function start(startIndex: number, sourceIds: string[], hooks: PlayFromSessionHooks) {
    cancel()
    if (startIndex < 0 || startIndex >= sourceIds.length) return

    hooks.onReset()
    const job = buildQueueFrom(sourceIds, startIndex, {
      onHead: (headId) => {
        hooks.onHead(headId, startIndex)
      },
      onChunk: hooks.onChunk,
      onDone: () => {
        cancelFill = null
        hooks.onDone?.()
      },
    })
    cancelFill = job.cancel
  }

  return { start, cancel }
}

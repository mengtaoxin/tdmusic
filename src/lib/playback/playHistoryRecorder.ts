export type PlayHistorySaveRecord = (record: {
  trackId: string
  startedAt: number
  endedAt: number
}) => Promise<void>

export type PlayHistoryRecorderDeps = {
  saveRecord: PlayHistorySaveRecord
  now?: () => number
}

/**
 * Tracks wall-clock listen sessions: play start → pause / ended / track switch.
 * Always persists the session, even for sub-minute plays.
 */
export function createPlayHistoryRecorder(deps: PlayHistoryRecorderDeps) {
  const now = deps.now ?? (() => Date.now())
  let open: { trackId: string; startedAt: number } | null = null

  function onStop() {
    if (!open) return
    const endedAt = now()
    const session = open
    open = null
    void deps.saveRecord({
      trackId: session.trackId,
      startedAt: session.startedAt,
      endedAt,
    })
  }

  function onPlay(trackId: string) {
    if (open) onStop()
    open = { trackId, startedAt: now() }
  }

  return { onPlay, onStop }
}

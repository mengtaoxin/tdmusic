export type VolumeGainNode = {
  gain: { value: number }
  connect: (destination: unknown) => void
}

export type VolumeGainSource = {
  connect: (destination: unknown) => void
}

export type VolumeGainAudioGraph = {
  createMediaElementSource: (element: HTMLMediaElement) => VolumeGainSource
  createGain: () => VolumeGainNode
  destination: unknown
  resume: () => Promise<void>
}

export type VolumeGainController = {
  setRatio: (percent: number) => void
}

export type VolumeGainDeps = {
  getAudio: () => HTMLAudioElement | null
  /** Injected for tests; defaults to a real AudioContext graph when available. */
  createContext?: () => VolumeGainAudioGraph | null
}

function createDefaultContext(): VolumeGainAudioGraph | null {
  const AudioContextCtor =
    typeof window !== 'undefined'
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined
  if (typeof AudioContextCtor !== 'function') return null
  const ctx = new AudioContextCtor()
  // Return real AudioNodes — wrappers break AudioNode.connect (overload resolution).
  return {
    createMediaElementSource: (element) =>
      ctx.createMediaElementSource(element) as unknown as VolumeGainSource,
    createGain: () => ctx.createGain() as unknown as VolumeGainNode,
    destination: ctx.destination,
    resume: () => ctx.resume(),
  }
}

/**
 * Routes the persistent `<audio>` element through a GainNode so track
 * volume-ratio can exceed 100% (native element volume cannot).
 * createMediaElementSource may run only once per element.
 * When Web Audio is unavailable, falls back to clamped element volume.
 */
export function createVolumeGainController(deps: VolumeGainDeps): VolumeGainController {
  let graph: VolumeGainAudioGraph | null = null
  let gainNode: VolumeGainNode | null = null
  let attachAttempted = false

  function ensureAttached(audio: HTMLAudioElement): boolean {
    if (gainNode) return true
    if (attachAttempted) return false
    attachAttempted = true
    graph = (deps.createContext ?? createDefaultContext)()
    if (!graph) return false
    const source = graph.createMediaElementSource(audio)
    gainNode = graph.createGain()
    source.connect(gainNode)
    gainNode.connect(graph.destination)
    return true
  }

  return {
    setRatio(percent: number) {
      const audio = deps.getAudio()
      if (!audio) return
      const linear = percent / 100
      if (ensureAttached(audio) && gainNode) {
        audio.volume = 1
        gainNode.gain.value = linear
        void graph?.resume()
        return
      }
      audio.volume = Math.min(1, Math.max(0, linear))
    },
  }
}

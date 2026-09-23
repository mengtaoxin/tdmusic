export type VolumeGainController = {
  setRatio: (percent: number) => void
}

export type VolumeGainDeps = {
  getAudio: () => HTMLAudioElement | null
}

/**
 * Applies per-track volume-ratio via native `<audio>.volume` (0–1).
 * Ratios above 100% are clamped so mobile background playback is not
 * broken by routing through Web Audio.
 */
export function createVolumeGainController(deps: VolumeGainDeps): VolumeGainController {
  return {
    setRatio(percent: number) {
      const audio = deps.getAudio()
      if (!audio) return
      audio.volume = Math.min(1, Math.max(0, percent / 100))
    },
  }
}

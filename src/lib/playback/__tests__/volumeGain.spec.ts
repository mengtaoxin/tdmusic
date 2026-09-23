import { describe, expect, it, vi } from 'vitest'

import {
  createVolumeGainController,
  type VolumeGainNode,
  type VolumeGainSource,
} from '@/lib/playback/volumeGain'

describe('createVolumeGainController', () => {
  it('sets gain to percent/100, keeps element volume at 1, and resumes context', () => {
    const audio = { volume: 0.5 } as HTMLAudioElement
    const gain: VolumeGainNode = {
      gain: { value: 1 },
      connect: vi.fn<(destination: unknown) => void>(),
    }
    const source: VolumeGainSource = { connect: vi.fn<(destination: unknown) => void>() }
    const resume = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const createMediaElementSource = vi
      .fn<(element: HTMLMediaElement) => VolumeGainSource>()
      .mockReturnValue(source)
    const createGain = vi.fn<() => VolumeGainNode>().mockReturnValue(gain)
    const destination = {}

    const controller = createVolumeGainController({
      getAudio: () => audio,
      createContext: () => ({
        createMediaElementSource,
        createGain,
        destination,
        resume,
      }),
    })

    controller.setRatio(150)

    expect(audio.volume).toBe(1)
    expect(createMediaElementSource).toHaveBeenCalledExactlyOnceWith(audio)
    expect(source.connect).toHaveBeenCalledWith(gain)
    expect(gain.connect).toHaveBeenCalledWith(destination)
    expect(gain.gain.value).toBe(1.5)
    expect(resume).toHaveBeenCalledOnce()
  })

  it('attaches the media element source only once across ratio changes', () => {
    const audio = { volume: 1 } as HTMLAudioElement
    const gain: VolumeGainNode = {
      gain: { value: 1 },
      connect: vi.fn<(destination: unknown) => void>(),
    }
    const source: VolumeGainSource = { connect: vi.fn<(destination: unknown) => void>() }
    const createMediaElementSource = vi
      .fn<(element: HTMLMediaElement) => VolumeGainSource>()
      .mockReturnValue(source)
    const createGain = vi.fn<() => VolumeGainNode>().mockReturnValue(gain)

    const controller = createVolumeGainController({
      getAudio: () => audio,
      createContext: () => ({
        createMediaElementSource,
        createGain,
        destination: {},
        resume: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      }),
    })

    controller.setRatio(50)
    controller.setRatio(200)

    expect(createMediaElementSource).toHaveBeenCalledOnce()
    expect(createGain).toHaveBeenCalledOnce()
    expect(gain.gain.value).toBe(2)
  })

  it('no-ops when audio is unavailable', () => {
    const createContext = vi.fn<() => null>()
    const controller = createVolumeGainController({
      getAudio: () => null,
      createContext,
    })

    controller.setRatio(80)

    expect(createContext).not.toHaveBeenCalled()
  })

  it('falls back to clamped element volume when Web Audio is unavailable', () => {
    const audio = { volume: 1 } as HTMLAudioElement
    const controller = createVolumeGainController({
      getAudio: () => audio,
      createContext: () => null,
    })

    controller.setRatio(150)
    expect(audio.volume).toBe(1)

    controller.setRatio(40)
    expect(audio.volume).toBe(0.4)
  })

  it('default AudioContext graph connects real AudioNodes (not plain wrappers)', () => {
    const audio = { volume: 1 } as HTMLAudioElement
    const destination = { numberOfInputs: 1 }
    const realGain = {
      numberOfInputs: 1,
      gain: { value: 1 },
      connect: vi.fn<(destination: unknown) => void>(),
    }
    const realSource = {
      connect: vi.fn<(destination: unknown) => void>((destination) => {
        // Browser AudioNode.connect rejects non-AudioNode destinations.
        if (!destination || typeof destination !== 'object' || !('numberOfInputs' in destination)) {
          throw new TypeError(
            "Failed to execute 'connect' on 'AudioNode': Overload resolution failed.",
          )
        }
      }),
    }

    class FakeAudioContext {
      destination = destination
      createMediaElementSource = vi.fn<() => typeof realSource>().mockReturnValue(realSource)
      createGain = vi.fn<() => typeof realGain>().mockReturnValue(realGain)
      resume = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    }

    const previous = window.AudioContext
    window.AudioContext = FakeAudioContext as unknown as typeof AudioContext
    try {
      const controller = createVolumeGainController({ getAudio: () => audio })
      expect(() => controller.setRatio(150)).not.toThrow()
      expect(realSource.connect).toHaveBeenCalledWith(realGain)
      expect(realGain.connect).toHaveBeenCalledWith(destination)
      expect(realGain.gain.value).toBe(1.5)
      expect(audio.volume).toBe(1)
    } finally {
      window.AudioContext = previous
    }
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createVolumeGainController } from '@/lib/playback/volumeGain';

describe('createVolumeGainController', () => {
  const previousAudioContext = window.AudioContext;

  afterEach(() => {
    window.AudioContext = previousAudioContext;
  });

  it('sets element volume to percent/100 without creating an AudioContext', () => {
    const audio = { volume: 1 } as HTMLAudioElement;
    const AudioContextCtor = vi.fn<() => AudioContext>();
    window.AudioContext = AudioContextCtor as unknown as typeof AudioContext;

    const controller = createVolumeGainController({ getAudio: () => audio });
    controller.setRatio(40);

    expect(audio.volume).toBe(0.4);
    expect(AudioContextCtor).not.toHaveBeenCalled();
  });

  it('clamps element volume to [0, 1]', () => {
    const audio = { volume: 1 } as HTMLAudioElement;
    const controller = createVolumeGainController({ getAudio: () => audio });

    controller.setRatio(150);
    expect(audio.volume).toBe(1);

    controller.setRatio(-10);
    expect(audio.volume).toBe(0);
  });

  it('no-ops when audio is unavailable', () => {
    const controller = createVolumeGainController({ getAudio: () => null });

    expect(() => controller.setRatio(80)).not.toThrow();
  });
});

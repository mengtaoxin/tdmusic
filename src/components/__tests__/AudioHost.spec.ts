import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'

import AudioHost from '../AudioHost.vue'
import { usePlayerStore } from '@/stores/player'

describe('AudioHost', () => {
  it('enables native loop when repeat mode is one so the track continues after ending', async () => {
    const pinia = createPinia()
    const wrapper = mount(AudioHost, {
      global: { plugins: [pinia] },
    })
    const player = usePlayerStore(pinia)
    const audio = wrapper.get('[data-testid="global-audio"]').element as HTMLAudioElement

    expect(audio.loop).toBe(false)

    player.repeatMode = 'one'
    await nextTick()
    await flushPromises()
    expect(audio.loop).toBe(true)

    player.repeatMode = 'all'
    await nextTick()
    await flushPromises()
    expect(audio.loop).toBe(false)

    player.repeatMode = 'off'
    await nextTick()
    await flushPromises()
    expect(audio.loop).toBe(false)

    wrapper.unmount()
  })
})

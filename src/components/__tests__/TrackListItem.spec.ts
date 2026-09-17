import { afterEach, describe, it, expect } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'

import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import type { DisplayTrack } from '@/stores/catalog'
import TrackListItem from '../TrackListItem.vue'

function makeTrack(): DisplayTrack {
  return {
    id: 't1',
    path: '/music/t1.mp3',
    displayTitle: 'Song One',
    displayArtist: 'Artist One',
    displayAlbum: 'Album One',
  }
}

let wrapper: VueWrapper | null = null

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

function mountItem(actions: 'playback' | 'queue' = 'playback') {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })
  wrapper = mount(TrackListItem, {
    props: { track: makeTrack(), actions },
    global: { plugins: [createPinia(), vuetify, i18n] },
    attachTo: document.body,
  })
  return wrapper
}

describe('TrackListItem', () => {
  it('emits select when the row is clicked', async () => {
    const item = mountItem()
    await item.find('.track-row').trigger('click')
    expect(item.emitted('select')).toHaveLength(1)
  })

  it('does not select the row when opening the overflow menu', async () => {
    const item = mountItem()
    await item.find('[data-testid="track-actions"]').trigger('click')
    expect(item.emitted('select')).toBeFalsy()
  })

  it('keeps overflow-menu pointerdown on the control instead of the row', async () => {
    const item = mountItem()
    let rowSawPointerDown = false
    item.find('.track-row').element.addEventListener('pointerdown', () => {
      rowSawPointerDown = true
    })
    await item.find('[data-testid="track-actions"]').trigger('pointerdown')
    expect(rowSawPointerDown).toBe(false)
  })

  it('does not use the dialog-scale menu transition that swallows touch taps', async () => {
    const item = mountItem('playback')
    const menu = item.findComponent({ name: 'VMenu' })
    expect(menu.exists()).toBe(true)

    const transition = menu.props('transition') as
      { component?: { name?: string } } | string | boolean
    const dialogScale =
      typeof transition === 'object' && transition?.component?.name === 'VDialogTransition'
    expect(dialogScale).toBe(false)
  })

  it('emits play-next and add-to-queue from the playback menu', async () => {
    const item = mountItem('playback')
    await flushPromises()

    const activator = item.find('[data-testid="track-actions"]')
    expect(activator.exists()).toBe(true)
    await activator.trigger('click')
    await flushPromises()

    const playNext = document.body.querySelector('[data-testid="track-play-next"]')
    const addQueue = document.body.querySelector('[data-testid="track-add-to-queue"]')
    expect(playNext).toBeTruthy()
    expect(addQueue).toBeTruthy()

    ;(playNext as HTMLElement).click()
    await flushPromises()
    expect(item.emitted('play-next')).toHaveLength(1)

    await activator.trigger('click')
    await flushPromises()
    const addQueue2 = document.body.querySelector('[data-testid="track-add-to-queue"]')
    ;(addQueue2 as HTMLElement).click()
    await flushPromises()
    expect(item.emitted('add-to-queue')).toHaveLength(1)
  })

  it('emits remove from the queue menu without play-next', async () => {
    const item = mountItem('queue')
    await flushPromises()

    const activator = item.find('[data-testid="track-actions"]')
    await activator.trigger('click')
    await flushPromises()

    expect(document.body.querySelector('[data-testid="track-play-next"]')).toBeNull()
    const remove = document.body.querySelector('[data-testid="track-remove"]')
    expect(remove).toBeTruthy()
    ;(remove as HTMLElement).click()
    await flushPromises()
    expect(item.emitted('remove')).toHaveLength(1)
  })
})

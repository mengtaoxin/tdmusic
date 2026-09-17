import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import SettingsView from '../SettingsView.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'

vi.mock('@/lib/catalog/catalogBootstrap', () => ({
  loadCatalogAndHydratePlayer: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  clearMusicCachesAndRefresh: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
}))

vi.mock('@/lib/catalog/loadConfigs', () => ({
  clearCachedConfigs: vi.fn<() => void>(),
}))

vi.mock('@/lib/cache/musicCache', () => ({
  getMusicCacheSizeBytes: vi.fn<() => Promise<number>>().mockResolvedValue(0),
}))

import { clearCachedConfigs } from '@/lib/catalog/loadConfigs'
import {
  clearMusicCachesAndRefresh,
  loadCatalogAndHydratePlayer,
} from '@/lib/catalog/catalogBootstrap'
import { getMusicCacheSizeBytes } from '@/lib/cache/musicCache'
import { usePlayerStore } from '@/stores/player'

function mountSettings(locale: 'en' | 'zh') {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en, zh },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/settings', component: SettingsView },
      { path: '/config-guides', component: { template: '<div />' } },
    ],
  })
  router.push('/settings')
  return mount(SettingsView, {
    global: { plugins: [createPinia(), router, vuetify, i18n] },
    attachTo: document.body,
  })
}

describe('SettingsView', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.mocked(clearMusicCachesAndRefresh).mockClear()
    vi.mocked(loadCatalogAndHydratePlayer).mockClear()
    vi.mocked(clearCachedConfigs).mockClear()
    vi.mocked(getMusicCacheSizeBytes).mockReset()
    vi.mocked(getMusicCacheSizeBytes).mockResolvedValue(0)
  })

  it('shows a short description for each setting in English', () => {
    const wrapper = mountSettings('en')
    const text = wrapper.text()

    expect(text).toContain('Config URL')
    expect(text).toContain(
      'Where the app loads the music catalog from. Leave empty for the default.',
    )
    expect(text).not.toContain('Reload catalog')
    expect(text).toContain('Delete local config cache')
    expect(text).toContain(
      'Remove the cached configs.json from this browser. Also clears now playing and the play queue. It will be downloaded again the next time the catalog loads.',
    )
    expect(text).toContain('Clear all cache')
    expect(text).toContain(
      'Remove cached audio and extracted metadata. Also clears now playing and the play queue.',
    )
  })

  it('spaces setting hints from controls by about one line of body text', () => {
    const wrapper = mountSettings('en')
    const hints = wrapper.findAll('.setting-hint')
    expect(hints.length).toBeGreaterThan(0)

    for (const hint of hints) {
      // 1lh in CSS; jsdom may not resolve lh against computed line-height.
      expect(parseFloat(getComputedStyle(hint.element).marginBottom)).toBeGreaterThan(0)
    }
  })

  it('shows a short description for each setting in Chinese', () => {
    const wrapper = mountSettings('zh')
    const text = wrapper.text()

    expect(text).toContain('配置地址')
    expect(text).toContain('应用从这里加载音乐目录。留空则使用默认地址。')
    expect(text).not.toContain('重新加载配置')
    expect(text).toContain('删除本地配置缓存')
    expect(text).toContain(
      '删除保存在本机的 configs.json 缓存，并清空正在播放与播放队列。下次使用时会自动重新下载。',
    )
    expect(text).toContain('一键清除全部缓存')
    expect(text).toContain('清除已缓存的音频与元数据，并清空正在播放与播放队列。')
  })

  it('links to Guidelines for configs.json', () => {
    const wrapper = mountSettings('en')
    const link = wrapper.find('a[href="/config-guides"]')

    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Guidelines for configs.json')
  })

  it('shows a Chinese configs.json guideline link label', () => {
    const wrapper = mountSettings('zh')
    const link = wrapper.find('a[href="/config-guides"]')

    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('configs.json 指南')
  })

  it('shows a bottom snackbar after save instead of an inline alert', async () => {
    const wrapper = mountSettings('en')
    const buttons = wrapper.findAll('button')
    const saveBtn = buttons.find((b) => b.text().includes('Save'))
    expect(saveBtn).toBeTruthy()
    await saveBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.v-alert').exists()).toBe(false)
    const snackbar = wrapper.findComponent({ name: 'VSnackbar' })
    expect(snackbar.exists()).toBe(true)
    expect(snackbar.props('location')).toBe('bottom')
    expect(snackbar.props('modelValue')).toBe(true)
    expect(document.body.textContent).toContain('Settings saved and catalog reloaded.')
  })

  it('asks for confirmation before deleting local config cache', async () => {
    const wrapper = mountSettings('en')
    const clearBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Delete local config cache'))
    expect(clearBtn).toBeTruthy()
    await clearBtn!.trigger('click')
    await flushPromises()

    expect(clearCachedConfigs).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain(
      'Delete the local configs.json cache and clear now playing and the play queue? It will be downloaded again next time.',
    )

    const cancelBtn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Cancel'),
    )
    expect(cancelBtn).toBeTruthy()
    cancelBtn!.click()
    await flushPromises()

    expect(clearCachedConfigs).not.toHaveBeenCalled()
  })

  it('deletes local config cache only after confirm', async () => {
    const wrapper = mountSettings('en')
    const player = usePlayerStore()
    player.queue = ['a', 'b']
    player.originalQueue = ['a', 'b']
    player.currentId = 'a'
    player.currentIndex = 0
    player.playing = true

    const clearBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Delete local config cache'))
    expect(clearBtn).toBeTruthy()
    await clearBtn!.trigger('click')
    await flushPromises()

    const confirmBtn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Confirm'),
    )
    expect(confirmBtn).toBeTruthy()
    confirmBtn!.click()
    await flushPromises()

    expect(clearCachedConfigs).toHaveBeenCalledTimes(1)
    expect(loadCatalogAndHydratePlayer).not.toHaveBeenCalled()
    expect(player.queue).toEqual([])
    expect(player.currentId).toBeNull()
    expect(player.playing).toBe(false)
    expect(document.body.textContent).toContain('Local config cache deleted.')
  })

  it('shows the current music cache size in English', async () => {
    vi.mocked(getMusicCacheSizeBytes).mockResolvedValue(1536)
    const wrapper = mountSettings('en')
    await flushPromises()

    expect(wrapper.text()).toContain('Cached music: 1.5 KB')
  })

  it('shows the current music cache size in Chinese', async () => {
    vi.mocked(getMusicCacheSizeBytes).mockResolvedValue(1048576)
    const wrapper = mountSettings('zh')
    await flushPromises()

    expect(wrapper.text()).toContain('已缓存音乐：1 MB')
  })

  it('refreshes the music cache size after clearing cache', async () => {
    vi.mocked(getMusicCacheSizeBytes).mockResolvedValueOnce(2048).mockResolvedValueOnce(0)
    const wrapper = mountSettings('en')
    await flushPromises()
    expect(wrapper.text()).toContain('Cached music: 2 KB')

    const clearBtn = wrapper.findAll('button').find((b) => b.text().includes('Clear all cache'))
    expect(clearBtn).toBeTruthy()
    await clearBtn!.trigger('click')
    await flushPromises()

    const confirmBtn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Confirm'),
    )
    expect(confirmBtn).toBeTruthy()
    confirmBtn!.click()
    await flushPromises()

    expect(wrapper.text()).toContain('Cached music: 0 B')
  })

  it('asks for confirmation before clearing cache', async () => {
    const wrapper = mountSettings('en')
    const clearBtn = wrapper.findAll('button').find((b) => b.text().includes('Clear all cache'))
    expect(clearBtn).toBeTruthy()
    await clearBtn!.trigger('click')
    await flushPromises()

    expect(clearMusicCachesAndRefresh).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain(
      'Clear all cached audio and extracted metadata, and clear now playing and the play queue? This cannot be undone.',
    )

    const cancelBtn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Cancel'),
    )
    expect(cancelBtn).toBeTruthy()
    cancelBtn!.click()
    await flushPromises()

    expect(clearMusicCachesAndRefresh).not.toHaveBeenCalled()
  })

  it('clears cache only after confirm', async () => {
    const wrapper = mountSettings('en')
    const clearBtn = wrapper.findAll('button').find((b) => b.text().includes('Clear all cache'))
    expect(clearBtn).toBeTruthy()
    await clearBtn!.trigger('click')
    await flushPromises()

    const confirmBtn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Confirm'),
    )
    expect(confirmBtn).toBeTruthy()
    confirmBtn!.click()
    await flushPromises()

    expect(clearMusicCachesAndRefresh).toHaveBeenCalledTimes(1)
    expect(document.body.textContent).toContain('All music cache cleared.')
  })
})

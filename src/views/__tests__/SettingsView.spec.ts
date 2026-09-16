import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import SettingsView from '../SettingsView.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'

vi.mock('@/stores/catalogBootstrap', () => ({
  loadCatalogAndHydratePlayer: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  clearMusicCachesAndRefresh: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
}))

import { clearMusicCachesAndRefresh } from '@/stores/catalogBootstrap'

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
  })

  it('shows a short description for each setting in English', () => {
    const wrapper = mountSettings('en')
    const text = wrapper.text()

    expect(text).toContain('Config URL')
    expect(text).toContain(
      'Where the app loads the music catalog from. Leave empty for the default.',
    )
    expect(text).toContain('Reload catalog')
    expect(text).toContain('Fetch the catalog again from the current config URL.')
    expect(text).toContain('Clear all cache')
    expect(text).toContain(
      'Remove cached audio and extracted metadata. Does not clear the play queue.',
    )
  })

  it('shows a short description for each setting in Chinese', () => {
    const wrapper = mountSettings('zh')
    const text = wrapper.text()

    expect(text).toContain('配置地址')
    expect(text).toContain('应用从这里加载音乐目录。留空则使用默认地址。')
    expect(text).toContain('重新加载配置')
    expect(text).toContain('按当前配置地址重新拉取音乐目录。')
    expect(text).toContain('一键清除全部缓存')
    expect(text).toContain('清除已缓存的音频与元数据，不会清空正在播放队列。')
  })

  it('links to configs.json guideline', () => {
    const wrapper = mountSettings('en')
    const link = wrapper.find('a[href="/config-guides"]')

    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('configs.json guideline')
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

  it('asks for confirmation before clearing cache', async () => {
    const wrapper = mountSettings('en')
    const clearBtn = wrapper.findAll('button').find((b) => b.text().includes('Clear all cache'))
    expect(clearBtn).toBeTruthy()
    await clearBtn!.trigger('click')
    await flushPromises()

    expect(clearMusicCachesAndRefresh).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain(
      'Clear all cached audio and extracted metadata? This cannot be undone.',
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

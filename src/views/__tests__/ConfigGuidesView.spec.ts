import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'

import ConfigGuidesView from '../ConfigGuidesView.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'

function mountGuides(locale: 'en' | 'zh') {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en, zh },
  })
  return mount(ConfigGuidesView, {
    global: { plugins: [vuetify, i18n] },
  })
}

describe('ConfigGuidesView', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    writeText = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('explains configs.json fields in English', () => {
    const wrapper = mountGuides('en')
    const text = wrapper.text()

    expect(text).toContain('configs.json guideline')
    expect(text).toContain('configs.json')
    expect(text).toContain('music-list')
    expect(text).toContain('id')
    expect(text).toContain('path')
    expect(text).toContain('playlists')
    expect(text).toContain('title')
    expect(text).toContain('artist')
    expect(text).toContain('album')
    expect(text).toContain('cover')
  })

  it('explains configs.json fields in Chinese', () => {
    const wrapper = mountGuides('zh')
    const text = wrapper.text()

    expect(text).toContain('configs.json 指南')
    expect(text).toContain('configs.json')
    expect(text).toContain('music-list')
    expect(text).toContain('playlists')
  })

  it('shows an LLM prompt section and copies the prompt on click', async () => {
    const wrapper = mountGuides('en')
    const text = wrapper.text()

    expect(text).toContain('Ask an AI to generate configs.json')
    expect(wrapper.find('[data-testid="config-llm-prompt"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="config-llm-prompt"]').text()).toContain('music-list')
    expect(wrapper.find('[data-testid="config-llm-prompt"]').text()).toContain('playlists')

    const copyBtn = wrapper.find('[data-testid="copy-llm-prompt"]')
    expect(copyBtn.exists()).toBe(true)
    expect(copyBtn.text()).toMatch(/copy/i)

    await copyBtn.trigger('click')
    await flushPromises()
    await nextTick()

    expect(writeText).toHaveBeenCalledTimes(1)
    const copied = writeText.mock.calls[0]![0] as string
    expect(copied).toContain('music-list')
    expect(copied).toContain('playlists')
    expect(copied).toContain('id')
    expect(copied).toContain('path')
    expect(wrapper.text()).toMatch(/copied/i)
  })

  it('shows a Chinese LLM prompt that can be copied', async () => {
    const wrapper = mountGuides('zh')

    expect(wrapper.text()).toContain('让大模型生成 configs.json')
    const prompt = wrapper.find('[data-testid="config-llm-prompt"]').text()
    expect(prompt).toContain('music-list')
    expect(prompt).toContain('playlists')

    await wrapper.find('[data-testid="copy-llm-prompt"]').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0]![0]).toContain('music-list')
    expect(wrapper.text()).toContain('已复制')
  })
})

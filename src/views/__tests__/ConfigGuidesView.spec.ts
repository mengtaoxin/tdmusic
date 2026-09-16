import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

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
  it('explains configs.json fields in English', () => {
    const wrapper = mountGuides('en')
    const text = wrapper.text()

    expect(text).toContain('Config Guides')
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

    expect(text).toContain('配置说明')
    expect(text).toContain('configs.json')
    expect(text).toContain('music-list')
    expect(text).toContain('playlists')
  })
})

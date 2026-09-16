import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import AboutView from '../AboutView.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'

const GITHUB_URL = 'https://github.com/mengtaoxin/tdmusic'

function mountAbout(locale: 'en' | 'zh') {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en, zh },
  })
  return mount(AboutView, {
    global: { plugins: [vuetify, i18n] },
  })
}

describe('AboutView', () => {
  it('centers page content', () => {
    const wrapper = mountAbout('en')
    const container = wrapper.find('.v-container')

    expect(container.classes()).toContain('text-center')
  })

  it('does not show the Vue + Vuetify blurb', () => {
    const wrapper = mountAbout('en')

    expect(wrapper.text()).not.toContain('Vue + Vuetify music player.')
  })

  it('links to the project GitHub repository via a clickable icon', () => {
    const wrapper = mountAbout('en')
    const link = wrapper.find(`a[href="${GITHUB_URL}"]`)

    expect(link.exists()).toBe(true)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
    expect(link.attributes('aria-label')).toBe('GitHub')
    expect(link.find('.mdi-github').exists()).toBe(true)
    expect(link.text().trim()).toBe('')
  })

  it('uses a Chinese-accessible GitHub icon label', () => {
    const wrapper = mountAbout('zh')
    const link = wrapper.find(`a[href="${GITHUB_URL}"]`)

    expect(link.exists()).toBe(true)
    expect(link.attributes('aria-label')).toBe('GitHub')
    expect(link.find('.mdi-github').exists()).toBe(true)
  })
})

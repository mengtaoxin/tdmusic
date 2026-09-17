import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ConfigGuidesView from '../ConfigGuidesView.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'

const SAMPLE_EN_MD = `# Guidelines for configs.json

The app loads its music catalog from a JSON file.

## music-list

- \`id\` — unique track id
- \`path\` — audio URL

## Ask an AI to generate configs.json

\`\`\`
music-list
playlists
\`\`\`
`

const SAMPLE_ZH_MD = `# configs.json 指南

## music-list

- \`id\`
- \`path\`

## 让大模型生成 configs.json

\`\`\`
music-list
playlists
\`\`\`
`

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
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const body = url.includes('.zh.md') ? SAMPLE_ZH_MD : SAMPLE_EN_MD
      return {
        ok: true,
        text: async () => body,
      }
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches English markdown and renders guide content without a copy button', async () => {
    const wrapper = mountGuides('en')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/how-to-write-config-file.md')
    const text = wrapper.text()
    expect(text).toContain('Guidelines for configs.json')
    expect(text).toContain('music-list')
    expect(text).toContain('id')
    expect(text).toContain('path')
    expect(text).toContain('Ask an AI to generate configs.json')
    expect(wrapper.find('[data-testid="copy-llm-prompt"]').exists()).toBe(false)
  })

  it('fetches Chinese markdown when locale is zh', async () => {
    const wrapper = mountGuides('zh')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/how-to-write-config-file.zh.md')
    expect(wrapper.text()).toContain('configs.json 指南')
    expect(wrapper.text()).toContain('music-list')
    expect(wrapper.find('[data-testid="copy-llm-prompt"]').exists()).toBe(false)
  })

  it('shows a load error when the markdown fetch fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      text: async () => '',
    })

    const wrapper = mountGuides('en')
    await flushPromises()

    expect(wrapper.text()).toContain('Could not load the config guide.')
  })
})

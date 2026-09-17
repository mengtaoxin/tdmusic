import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import { appendAppLog, clearAppLogs, listAppLogs, resetAppLogDbForTests } from '@/lib/appLogStore'
import en from '@/locales/en'
import zh from '@/locales/zh'
import vuetify from '@/plugins/vuetify'
import LogsView from '../LogsView.vue'

function mountLogs() {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })
  return mount(LogsView, {
    global: { plugins: [vuetify, i18n] },
    attachTo: document.body,
  })
}

describe('LogsView', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    await resetAppLogDbForTests()
  })

  it('asks for confirmation before clearing logs', async () => {
    await appendAppLog('Download failed for track bad-1')

    const wrapper = mountLogs()
    await flushPromises()

    await wrapper.get('[data-testid="logs-clear"]').trigger('click')
    await flushPromises()

    expect(await listAppLogs()).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="log-entry"]')).toHaveLength(1)
    expect(document.body.textContent).toContain('Clear all logs? This cannot be undone.')

    const cancelBtn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Cancel'),
    )
    expect(cancelBtn).toBeTruthy()
    cancelBtn!.click()
    await flushPromises()

    expect(await listAppLogs()).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="log-entry"]')).toHaveLength(1)
  })

  it('lists stored logs and clears them only after confirm', async () => {
    await appendAppLog('Download failed for track bad-1')
    await appendAppLog('Download failed for track bad-2')

    const wrapper = mountLogs()
    await flushPromises()

    const page = wrapper.find('[data-testid="logs-page"]')
    expect(page.exists()).toBe(true)
    expect(wrapper.text()).toContain('Download failed for track bad-2')
    expect(wrapper.text()).toContain('Download failed for track bad-1')

    await wrapper.get('[data-testid="logs-clear"]').trigger('click')
    await flushPromises()

    const confirmBtn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Confirm'),
    )
    expect(confirmBtn).toBeTruthy()
    confirmBtn!.click()
    await flushPromises()

    expect(await listAppLogs()).toEqual([])
    expect(wrapper.findAll('[data-testid="log-entry"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('No logs yet.')
  })

  it('shows empty state when there are no logs', async () => {
    await clearAppLogs()
    const wrapper = mountLogs()
    await flushPromises()

    expect(wrapper.findAll('[data-testid="log-entry"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('No logs yet.')
  })
})

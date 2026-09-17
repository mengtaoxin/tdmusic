import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  readStoredConfigUrl,
  writeStoredConfigUrl,
  resolveConfigUrl,
} from '@/lib/catalog/configUrl'

export const useSettingsStore = defineStore('settings', () => {
  const configUrl = ref(readStoredConfigUrl())

  function saveConfigUrl(value: string) {
    writeStoredConfigUrl(value)
    configUrl.value = readStoredConfigUrl()
  }

  function resolvedConfigUrl() {
    return resolveConfigUrl()
  }

  return { configUrl, saveConfigUrl, resolvedConfigUrl }
})

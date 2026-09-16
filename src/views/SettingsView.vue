<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { clearMusicCachesAndRefresh, loadCatalogAndHydratePlayer } from '@/stores/catalogBootstrap'
import { useSettingsStore } from '@/stores/settings'

const { t } = useI18n()
const settings = useSettingsStore()

const draftUrl = ref(settings.configUrl)
const clearing = ref(false)
const message = ref('')

async function save() {
  settings.saveConfigUrl(draftUrl.value)
  await loadCatalogAndHydratePlayer()
  message.value = t('settings.saved')
}

async function reload() {
  await loadCatalogAndHydratePlayer()
  message.value = t('settings.reloaded')
}

async function clearCache() {
  clearing.value = true
  try {
    await clearMusicCachesAndRefresh()
    message.value = t('settings.cacheCleared')
  } finally {
    clearing.value = false
  }
}
</script>

<template>
  <v-container class="page-narrow" fluid>
    <h1 class="text-h5 mb-4">{{ t('nav.settings') }}</h1>

    <section class="setting">
      <h2 class="text-subtitle-1 mb-1">{{ t('settings.configUrl') }}</h2>
      <p class="setting-hint text-body-2 text-medium-emphasis mb-3">
        {{ t('settings.configUrlHint') }}
      </p>
      <p class="setting-hint text-body-2 mb-3">
        <RouterLink to="/config-guides">{{ t('settings.configGuidesLink') }}</RouterLink>
      </p>
      <v-text-field v-model="draftUrl" hide-details variant="outlined" class="mb-3 setting-field" />
      <v-btn color="primary" @click="save">{{ t('settings.save') }}</v-btn>
    </section>

    <v-divider class="my-6" />

    <section class="setting">
      <h2 class="text-subtitle-1 mb-1">{{ t('settings.reload') }}</h2>
      <p class="setting-hint text-body-2 text-medium-emphasis mb-3">
        {{ t('settings.reloadHint') }}
      </p>
      <v-btn variant="tonal" @click="reload">{{ t('settings.reload') }}</v-btn>
    </section>

    <v-divider class="my-6" />

    <section class="setting">
      <h2 class="text-subtitle-1 mb-1">{{ t('settings.clearCache') }}</h2>
      <p class="setting-hint text-body-2 text-medium-emphasis mb-3">
        {{ t('settings.clearCacheHint') }}
      </p>
      <v-btn color="error" variant="tonal" :loading="clearing" @click="clearCache">
        {{ t('settings.clearCache') }}
      </v-btn>
    </section>

    <v-alert v-if="message" type="success" variant="tonal" class="mt-6">{{ message }}</v-alert>
  </v-container>
</template>

<style scoped>
.setting {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.setting-field {
  width: 100%;
}

.setting-hint {
  margin: 0;
}
</style>

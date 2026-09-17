<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { clearCachedConfigs } from '@/lib/catalog/loadConfigs'
import {
  clearMusicCachesAndRefresh,
  loadCatalogAndHydratePlayer,
} from '@/lib/catalog/catalogBootstrap'
import { useSettingsStore } from '@/stores/settings'

const { t } = useI18n()
const settings = useSettingsStore()

const draftUrl = ref(settings.configUrl)
const clearing = ref(false)
const confirmClearOpen = ref(false)
const confirmClearConfigsOpen = ref(false)
const message = ref('')
const snackbarOpen = computed({
  get: () => message.value.length > 0,
  set: (open: boolean) => {
    if (!open) message.value = ''
  },
})

async function save() {
  settings.saveConfigUrl(draftUrl.value)
  await loadCatalogAndHydratePlayer()
  message.value = t('settings.saved')
}

function openClearConfigsCacheConfirm() {
  confirmClearConfigsOpen.value = true
}

function confirmClearConfigsCache() {
  confirmClearConfigsOpen.value = false
  clearCachedConfigs()
  message.value = t('settings.configsCacheCleared')
}

function openClearCacheConfirm() {
  confirmClearOpen.value = true
}

async function confirmClearCache() {
  confirmClearOpen.value = false
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
      <h2 class="text-subtitle-1 mb-1">{{ t('settings.clearConfigsCache') }}</h2>
      <p class="setting-hint text-body-2 text-medium-emphasis mb-3">
        {{ t('settings.clearConfigsCacheHint') }}
      </p>
      <v-btn variant="tonal" @click="openClearConfigsCacheConfirm">
        {{ t('settings.clearConfigsCache') }}
      </v-btn>
    </section>

    <v-divider class="my-6" />

    <section class="setting">
      <h2 class="text-subtitle-1 mb-1">{{ t('settings.clearCache') }}</h2>
      <p class="setting-hint text-body-2 text-medium-emphasis mb-3">
        {{ t('settings.clearCacheHint') }}
      </p>
      <v-btn color="error" variant="tonal" :loading="clearing" @click="openClearCacheConfirm">
        {{ t('settings.clearCache') }}
      </v-btn>
    </section>

    <v-dialog v-model="confirmClearConfigsOpen" max-width="420">
      <v-card>
        <v-card-title>{{ t('settings.clearConfigsCache') }}</v-card-title>
        <v-card-text>{{ t('settings.clearConfigsCacheConfirm') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmClearConfigsOpen = false">{{
            t('settings.cancel')
          }}</v-btn>
          <v-btn color="primary" variant="tonal" @click="confirmClearConfigsCache">
            {{ t('settings.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmClearOpen" max-width="420">
      <v-card>
        <v-card-title>{{ t('settings.clearCache') }}</v-card-title>
        <v-card-text>{{ t('settings.clearCacheConfirm') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmClearOpen = false">{{ t('settings.cancel') }}</v-btn>
          <v-btn color="error" variant="tonal" @click="confirmClearCache">
            {{ t('settings.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbarOpen" location="bottom" color="success" :timeout="3000">
      {{ message }}
    </v-snackbar>
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

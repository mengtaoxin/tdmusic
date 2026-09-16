<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { writeStoredLocale } from '@/lib/locale'

const { t, locale } = useI18n()

watch(locale, (value) => {
  writeStoredLocale(value)
})

const navItems = [
  { to: '/', key: 'nav.home' },
  { to: '/music', key: 'nav.musicList' },
  { to: '/playlists', key: 'nav.playlist' },
  { to: '/artists', key: 'nav.artistList' },
  { to: '/albums', key: 'nav.albumList' },
  { to: '/now-playing', key: 'nav.nowPlaying' },
  { to: '/search', key: 'nav.search' },
  { to: '/settings', key: 'nav.settings' },
  { to: '/about', key: 'nav.about' },
] as const

const localeItems = computed(() => [
  { title: t('locale.en'), value: 'en' },
  { title: t('locale.zh'), value: 'zh' },
])

const currentLocaleTitle = computed(
  () => localeItems.value.find((item) => item.value === locale.value)?.title ?? locale.value,
)
</script>

<template>
  <v-app-bar flat class="app-bar" color="transparent">
    <v-app-bar-title class="brand text-secondary">tdmusic</v-app-bar-title>
    <template #append>
      <nav class="d-flex align-center ga-1 flex-wrap">
        <v-btn v-for="item in navItems" :key="item.key" :to="item.to" variant="text" size="small">
          {{ t(item.key) }}
        </v-btn>
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              data-testid="locale-select"
              class="locale-select"
              variant="text"
              size="small"
            >
              {{ currentLocaleTitle }}
              <v-icon end size="16">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" nav>
            <v-list-item
              v-for="item in localeItems"
              :key="item.value"
              :title="item.title"
              :active="locale === item.value"
              @click="locale = item.value"
            />
          </v-list>
        </v-menu>
      </nav>
    </template>
  </v-app-bar>
</template>

<style scoped>
.app-bar {
  border-bottom: 1px solid rgba(var(--v-theme-secondary), var(--v-border-opacity));
  backdrop-filter: blur(var(--v-blur-header));
}

.brand {
  font-weight: 700;
  letter-spacing: 0.04em;
}

/* Native <button> UA font beats .v-btn--size-small; nav links are <a> so unaffected. */
.locale-select {
  font-size: 0.75rem;
  font-weight: 500;
}
</style>

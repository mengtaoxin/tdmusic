<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { playlistPath } from '@/lib/playlistRoutes'
import { useCatalogStore } from '@/stores/catalog'
import { ensureCatalogLoaded } from '@/stores/catalogBootstrap'

const { t } = useI18n()
const catalog = useCatalogStore()

onMounted(() => {
  void ensureCatalogLoaded()
})
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-2">{{ t('nav.playlist') }}</h1>

    <p v-if="catalog.playlists.length === 0" class="text-medium-emphasis mb-4">
      {{ t('playlist.empty') }}
      <RouterLink to="/config-guides">{{ t('settings.configGuidesLink') }}</RouterLink>
    </p>

    <v-list v-else bg-color="transparent">
      <v-list-item
        v-for="(playlist, index) in catalog.playlists"
        :key="`${playlist.title}-${index}`"
        :title="playlist.title"
        :subtitle="t('playlist.trackCount', { count: playlist.trackIds.length })"
        :to="playlistPath(playlist.title)"
        rounded="lg"
        class="mb-1"
      >
        <template #prepend>
          <v-icon icon="mdi-playlist-music" class="me-2" />
        </template>
        <template #append>
          <v-icon icon="mdi-chevron-right" />
        </template>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { playlistPath } from '@/lib/playlistRoutes'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const catalog = useCatalogStore()

onMounted(() => {
  if (!catalog.tracks.length && !catalog.loading) void catalog.load()
})
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-2">{{ t('nav.playlist') }}</h1>
    <p class="text-medium-emphasis mb-4">{{ t('playlist.fromConfig') }}</p>

    <v-list bg-color="transparent">
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

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { albumPath } from '@/lib/albumRoutes'
import { localizeAlbumName } from '@/lib/displayLabels'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const catalog = useCatalogStore()

onMounted(() => {
  if (!catalog.tracks.length && !catalog.loading) void catalog.load()
})
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">{{ t('nav.albumList') }}</h1>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <v-list v-else bg-color="transparent">
      <v-list-item
        v-for="group in catalog.albums"
        :key="group.name"
        :title="localizeAlbumName(group.name, t)"
        :subtitle="t('album.trackCount', { count: group.tracks.length })"
        :to="albumPath(group.name)"
        rounded="lg"
        class="mb-1"
      >
        <template #prepend>
          <v-icon icon="mdi-album" class="me-2" />
        </template>
        <template #append>
          <v-icon icon="mdi-chevron-right" />
        </template>
      </v-list-item>
    </v-list>
  </v-container>
</template>

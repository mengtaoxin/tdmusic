<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { artistAlbumsPath } from '@/lib/routes/artistRoutes'
import { localizeArtistName } from '@/lib/catalog/displayLabels'
import { useCatalogStore } from '@/stores/catalog'
import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'

const { t } = useI18n()
const catalog = useCatalogStore()

onMounted(() => {
  void ensureCatalogLoaded()
})
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">{{ t('nav.artistList') }}</h1>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <v-list v-else bg-color="transparent">
      <v-list-item
        v-for="group in catalog.artists"
        :key="group.name"
        :title="localizeArtistName(group.name, t)"
        :subtitle="t('artist.trackCount', { count: group.tracks.length })"
        :to="artistAlbumsPath(group.name)"
        rounded="lg"
        class="mb-1"
      >
        <template #prepend>
          <v-icon icon="mdi-account-music" class="me-2" />
        </template>
        <template #append>
          <v-icon icon="mdi-chevron-right" />
        </template>
      </v-list-item>
    </v-list>
  </v-container>
</template>

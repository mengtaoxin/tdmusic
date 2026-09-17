<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import AlbumGallery from '@/components/AlbumGallery.vue'
import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'
import { albumPath, firstAlbumCoverSrc } from '@/lib/routes/albumRoutes'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const catalog = useCatalogStore()

const albumTiles = computed(() =>
  catalog.albums.map((group) => ({
    name: group.name,
    trackCount: group.tracks.length,
    coverSrc: firstAlbumCoverSrc(group.tracks),
  })),
)

onMounted(() => {
  void ensureCatalogLoaded()
})
</script>

<template>
  <v-container class="page album-list-page" fluid>
    <h1 class="text-h5 mb-4">{{ t('nav.albumList') }}</h1>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <AlbumGallery v-else :tiles="albumTiles" :path-for="albumPath" />
  </v-container>
</template>

<style scoped>
.album-list-page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>

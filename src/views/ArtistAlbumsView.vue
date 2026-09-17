<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import AlbumGallery from '@/components/AlbumGallery.vue'
import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'
import { localizeArtistName } from '@/lib/catalog/displayLabels'
import { firstAlbumCoverSrc } from '@/lib/routes/albumRoutes'
import {
  albumsForArtist,
  artistAlbumPath,
  artistPath,
  findArtistGroup,
} from '@/lib/routes/artistRoutes'
import { decodeRouteParam } from '@/lib/routes/routeParams'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const route = useRoute()
const catalog = useCatalogStore()

const artistName = computed(() => decodeRouteParam(String(route.params.name ?? '')))

const artist = computed(() => findArtistGroup(catalog.artists, artistName.value))

const albumTiles = computed(() => {
  if (!artist.value) return []
  return albumsForArtist(artist.value.tracks, artist.value.name).map((group) => ({
    name: group.name,
    trackCount: group.tracks.length,
    coverSrc: firstAlbumCoverSrc(group.tracks),
  }))
})

function pathFor(album: string) {
  return artistAlbumPath(artist.value?.name ?? artistName.value, album)
}

onMounted(() => {
  void ensureCatalogLoaded()
})
</script>

<template>
  <v-container class="page artist-albums-page" fluid>
    <h1 class="text-h5 mb-4">
      {{ localizeArtistName(artist?.name || artistName || '', t) || t('nav.artistList') }}
    </h1>

    <v-alert v-if="!catalog.loading && !artist" type="warning" variant="tonal" class="mb-4">
      {{ t('artist.notFound') }}
    </v-alert>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <template v-else-if="artist">
      <v-list bg-color="transparent" class="mb-4 pa-0 flex-grow-0">
        <v-list-item
          :title="t('artist.allMusic')"
          :subtitle="t('artist.trackCount', { count: artist.tracks.length })"
          :to="artistPath(artist.name)"
          rounded="lg"
        >
          <template #prepend>
            <v-icon icon="mdi-music-note" class="me-2" />
          </template>
          <template #append>
            <v-icon icon="mdi-chevron-right" />
          </template>
        </v-list-item>
      </v-list>

      <AlbumGallery :tiles="albumTiles" :path-for="pathFor" />
    </template>
  </v-container>
</template>

<style scoped>
.artist-albums-page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>

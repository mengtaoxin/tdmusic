<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import {
  albumsForArtist,
  artistAlbumPath,
  artistPath,
  decodeRouteParam,
  findArtistGroup,
} from '@/lib/artistRoutes'
import { localizeAlbumName, localizeArtistName } from '@/lib/displayLabels'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const route = useRoute()
const catalog = useCatalogStore()

const artistName = computed(() => decodeRouteParam(String(route.params.name ?? '')))

const artist = computed(() => findArtistGroup(catalog.artists, artistName.value))

const albums = computed(() => {
  if (!artist.value) return []
  return albumsForArtist(artist.value.tracks, artist.value.name)
})

onMounted(() => {
  if (!catalog.tracks.length && !catalog.loading) void catalog.load()
})
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">
      {{ localizeArtistName(artist?.name || artistName || '', t) || t('nav.artistList') }}
    </h1>

    <v-alert v-if="!catalog.loading && !artist" type="warning" variant="tonal" class="mb-4">
      {{ t('artist.notFound') }}
    </v-alert>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <v-list v-else-if="artist" bg-color="transparent">
      <v-list-item
        :title="t('artist.allMusic')"
        :subtitle="t('artist.trackCount', { count: artist.tracks.length })"
        :to="artistPath(artist.name)"
        rounded="lg"
        class="mb-1"
      >
        <template #prepend>
          <v-icon icon="mdi-music-note" class="me-2" />
        </template>
        <template #append>
          <v-icon icon="mdi-chevron-right" />
        </template>
      </v-list-item>

      <v-list-item
        v-for="album in albums"
        :key="album.name"
        :title="localizeAlbumName(album.name, t)"
        :subtitle="t('artist.trackCount', { count: album.tracks.length })"
        :to="artistAlbumPath(artist.name, album.name)"
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

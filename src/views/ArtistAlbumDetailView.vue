<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { decodeRouteParam, findArtistGroup, tracksForArtistAlbum } from '@/lib/artistRoutes'
import { localizeAlbumName } from '@/lib/displayLabels'
import TrackListItem from '@/components/TrackListItem.vue'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const { t } = useI18n()
const route = useRoute()
const catalog = useCatalogStore()
const player = usePlayerStore()

const artistName = computed(() => decodeRouteParam(String(route.params.name ?? '')))
const albumName = computed(() => decodeRouteParam(String(route.params.album ?? '')))

const artist = computed(() => findArtistGroup(catalog.artists, artistName.value))

const tracks = computed(() => {
  if (!artist.value) return [] as DisplayTrack[]
  return tracksForArtistAlbum(artist.value.tracks, artist.value.name, albumName.value)
})

const albumFound = computed(() => Boolean(artist.value) && tracks.value.length > 0)

onMounted(() => {
  if (!catalog.tracks.length && !catalog.loading) void catalog.load()
})

function playAt(index: number) {
  player.playFrom(
    index,
    tracks.value.map((track) => track.id),
  )
}
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">
      {{ localizeAlbumName(albumName || '', t) || t('nav.albumList') }}
    </h1>

    <v-alert v-if="!catalog.loading && !artist" type="warning" variant="tonal" class="mb-4">
      {{ t('artist.notFound') }}
    </v-alert>

    <v-alert
      v-else-if="!catalog.loading && artist && !albumFound"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      {{ t('artist.albumNotFound') }}
    </v-alert>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <v-list v-else bg-color="transparent">
      <TrackListItem
        v-for="(track, index) in tracks"
        :key="track.id"
        :track="track"
        :active="player.currentId === track.id"
        @select="playAt(index)"
      />
    </v-list>
  </v-container>
</template>

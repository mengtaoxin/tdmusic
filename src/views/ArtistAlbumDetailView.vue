<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import TrackList from '@/components/TrackList.vue'
import { decodeRouteParam, findArtistGroup, tracksForArtistAlbum } from '@/lib/artistRoutes'
import { localizeAlbumName } from '@/lib/displayLabels'
import { useTrackListPlayback } from '@/lib/useTrackListPlayback'
import type { DisplayTrack } from '@/stores/catalog'

const { t } = useI18n()
const route = useRoute()

const artistName = computed(() => decodeRouteParam(String(route.params.name ?? '')))
const albumName = computed(() => decodeRouteParam(String(route.params.album ?? '')))

const { catalog, player, playAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(() =>
  tracks.value.map((track) => track.id),
)

const artist = computed(() => findArtistGroup(catalog.artists, artistName.value))

const tracks = computed(() => {
  if (!artist.value) return [] as DisplayTrack[]
  return tracksForArtistAlbum(artist.value.tracks, artist.value.name, albumName.value)
})

const albumFound = computed(() => Boolean(artist.value) && tracks.value.length > 0)
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

    <TrackList
      v-else
      :tracks="tracks"
      :current-id="player.currentId"
      @select="playAt"
      @play-next="playNextTrack"
      @add-to-queue="addTrackToQueue"
    />
  </v-container>
</template>

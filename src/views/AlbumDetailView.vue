<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import TrackList from '@/components/TrackList.vue'
import { findAlbumGroup } from '@/lib/routes/albumRoutes'
import { decodeRouteParam } from '@/lib/routes/routeParams'
import { localizeAlbumName } from '@/lib/catalog/displayLabels'
import { useTrackListPlayback } from '@/composables/useTrackListPlayback'
import type { DisplayTrack } from '@/stores/catalog'

const { t } = useI18n()
const route = useRoute()

const albumName = computed(() => decodeRouteParam(String(route.params.album ?? '')))

const playback = useTrackListPlayback(() => tracks.value.map((track) => track.id))
const { catalog, player, playAt, playNextTrack, addTrackToQueue } = playback

const album = computed(() => findAlbumGroup(catalog.albums, albumName.value))

const tracks = computed(() => {
  if (!album.value) return [] as DisplayTrack[]
  return album.value.tracks
})
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">
      {{ localizeAlbumName(album?.name || albumName || '', t) || t('nav.albumList') }}
    </h1>

    <v-alert v-if="!catalog.loading && !album" type="warning" variant="tonal" class="mb-4">
      {{ t('album.notFound') }}
    </v-alert>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <TrackList
      v-else-if="album"
      :tracks="tracks"
      :current-id="player.currentId"
      @select="playAt"
      @play-next="playNextTrack"
      @add-to-queue="addTrackToQueue"
    />
  </v-container>
</template>

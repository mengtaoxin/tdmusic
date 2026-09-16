<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import TrackList from '@/components/TrackList.vue'
import { decodeRouteParam, findArtistGroup } from '@/lib/artistRoutes'
import { localizeArtistName } from '@/lib/displayLabels'
import { useTrackListPlayback } from '@/lib/useTrackListPlayback'
import type { DisplayTrack } from '@/stores/catalog'

const { t } = useI18n()
const route = useRoute()

const artistName = computed(() => decodeRouteParam(String(route.params.name ?? '')))

const { catalog, player, playAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(() =>
  tracks.value.map((track) => track.id),
)

const artist = computed(() => findArtistGroup(catalog.artists, artistName.value))

const tracks = computed(() => artist.value?.tracks ?? ([] as DisplayTrack[]))
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-2">
      {{ localizeArtistName(artist?.name || artistName || '', t) || t('nav.artistList') }}
    </h1>
    <p class="text-medium-emphasis mb-4">{{ t('artist.allMusic') }}</p>

    <v-alert v-if="!catalog.loading && !artist" type="warning" variant="tonal" class="mb-4">
      {{ t('artist.notFound') }}
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

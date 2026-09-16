<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { decodeRouteParam, findArtistGroup } from '@/lib/artistRoutes'
import { localizeArtistName } from '@/lib/displayLabels'
import TrackListItem from '@/components/TrackListItem.vue'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const { t } = useI18n()
const route = useRoute()
const catalog = useCatalogStore()
const player = usePlayerStore()

const artistName = computed(() => decodeRouteParam(String(route.params.name ?? '')))

const artist = computed(() => findArtistGroup(catalog.artists, artistName.value))

const tracks = computed(() => artist.value?.tracks ?? ([] as DisplayTrack[]))

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
    <h1 class="text-h5 mb-2">
      {{ localizeArtistName(artist?.name || artistName || '', t) || t('nav.artistList') }}
    </h1>
    <p class="text-medium-emphasis mb-4">{{ t('artist.allMusic') }}</p>

    <v-alert v-if="!catalog.loading && !artist" type="warning" variant="tonal" class="mb-4">
      {{ t('artist.notFound') }}
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

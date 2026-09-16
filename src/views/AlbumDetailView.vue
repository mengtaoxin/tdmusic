<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import TrackListItem from '@/components/TrackListItem.vue'
import { findAlbumGroup } from '@/lib/albumRoutes'
import { decodeRouteParam } from '@/lib/artistRoutes'
import { localizeAlbumName } from '@/lib/displayLabels'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const { t } = useI18n()
const route = useRoute()
const catalog = useCatalogStore()
const player = usePlayerStore()

const albumName = computed(() => decodeRouteParam(String(route.params.album ?? '')))

const album = computed(() => findAlbumGroup(catalog.albums, albumName.value))

const tracks = computed(() => {
  if (!album.value) return [] as DisplayTrack[]
  return album.value.tracks
})

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
      {{ localizeAlbumName(album?.name || albumName || '', t) || t('nav.albumList') }}
    </h1>

    <v-alert v-if="!catalog.loading && !album" type="warning" variant="tonal" class="mb-4">
      {{ t('album.notFound') }}
    </v-alert>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <v-list v-else-if="album" bg-color="transparent">
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

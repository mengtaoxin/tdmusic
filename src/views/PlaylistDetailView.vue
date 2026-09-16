<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import TrackListItem from '@/components/TrackListItem.vue'
import { findPlaylistByName } from '@/lib/playlistRoutes'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const { t } = useI18n()
const route = useRoute()
const catalog = useCatalogStore()
const player = usePlayerStore()

const playlistName = computed(() => String(route.params.name ?? ''))

const playlist = computed(() => findPlaylistByName(catalog.playlists, playlistName.value))

const tracks = computed(() => {
  if (!playlist.value) return [] as DisplayTrack[]
  return playlist.value.trackIds
    .map((id) => catalog.trackById.get(id))
    .filter((track): track is DisplayTrack => Boolean(track))
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
    <h1 class="text-h5 mb-4">{{ playlist?.title || playlistName || t('nav.playlist') }}</h1>

    <v-alert v-if="!catalog.loading && !playlist" type="warning" variant="tonal" class="mb-4">
      {{ t('playlist.notFound') }}
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

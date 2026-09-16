<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import TrackList from '@/components/TrackList.vue'
import { findPlaylistByName } from '@/lib/playlistRoutes'
import { useTrackListPlayback } from '@/lib/useTrackListPlayback'
import type { DisplayTrack } from '@/stores/catalog'

const { t } = useI18n()
const route = useRoute()

const playlistName = computed(() => String(route.params.name ?? ''))

const { catalog, player, playAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(() =>
  tracks.value.map((track) => track.id),
)

const playlist = computed(() => findPlaylistByName(catalog.playlists, playlistName.value))

const tracks = computed(() => {
  if (!playlist.value) return [] as DisplayTrack[]
  return playlist.value.trackIds
    .map((id) => catalog.trackById.get(id))
    .filter((track): track is DisplayTrack => Boolean(track))
})

function playAllInOrder() {
  if (!tracks.value.length) return
  player.shuffle = false
  playAt(0)
}

function shufflePlayAll() {
  if (!tracks.value.length) return
  player.shuffle = true
  playAt(0)
}
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">{{ playlist?.title || playlistName || t('nav.playlist') }}</h1>

    <v-alert v-if="!catalog.loading && !playlist" type="warning" variant="tonal" class="mb-4">
      {{ t('playlist.notFound') }}
    </v-alert>

    <div v-if="tracks.length" class="d-flex flex-wrap ga-2 mb-4">
      <v-btn color="secondary" variant="flat" prepend-icon="mdi-play" @click="playAllInOrder">
        {{ t('playlist.playAll') }}
      </v-btn>
      <v-btn color="secondary" variant="tonal" prepend-icon="mdi-shuffle" @click="shufflePlayAll">
        {{ t('playlist.shuffleAll') }}
      </v-btn>
    </div>

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

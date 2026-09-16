<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import TrackListItem from '@/components/TrackListItem.vue'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const { t } = useI18n()
const catalog = useCatalogStore()
const player = usePlayerStore()

const TRACK_ROW_HEIGHT = 64

const ids = computed(() => catalog.tracks.map((track) => track.id))

/** Shrink for short catalogs; cap to viewport so long lists virtualize. */
const listHeight = computed(
  () =>
    `min(${Math.max(catalog.tracks.length, 1) * TRACK_ROW_HEIGHT}px, var(--v-music-list-height))`,
)

onMounted(() => {
  if (!catalog.tracks.length && !catalog.loading) {
    void catalog.load()
  }
})

function playAt(index: number) {
  player.playFrom(index, ids.value)
}
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">{{ t('nav.musicList') }}</h1>

    <v-alert v-if="catalog.loadError" type="error" class="mb-4" variant="tonal">
      {{ catalog.loadError }}
    </v-alert>

    <v-alert
      v-for="(err, i) in catalog.errors"
      :key="i"
      type="warning"
      class="mb-2"
      variant="tonal"
      density="compact"
    >
      {{ t('catalog.configError', { message: err }) }}
    </v-alert>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <v-virtual-scroll
      v-else
      :items="catalog.tracks"
      item-key="id"
      :item-height="TRACK_ROW_HEIGHT"
      class="track-list"
      :height="listHeight"
    >
      <template #default="{ item: track, index }">
        <TrackListItem
          :track="track"
          :active="player.currentId === track.id"
          @select="playAt(index)"
        />
      </template>
    </v-virtual-scroll>
  </v-container>
</template>

<style scoped>
.track-list {
  background: transparent;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import TrackListItem from '@/components/TrackListItem.vue'
import { useTrackListPlayback } from '@/composables/useTrackListPlayback'
import { useVirtualListHost } from '@/composables/useVirtualListHost'
import { capVirtualListHeight, virtualListNeedsScroll } from '@/lib/virtualListHeight'

const { t } = useI18n()

const TRACK_ROW_HEIGHT = 64

const { listHost, hostHeight } = useVirtualListHost()

const { catalog, player, playAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(() =>
  catalog.tracks.map((track) => track.id),
)

const listHeight = computed(() =>
  capVirtualListHeight(catalog.tracks.length, TRACK_ROW_HEIGHT, hostHeight.value),
)

const listFlush = computed(
  () => !virtualListNeedsScroll(catalog.tracks.length, TRACK_ROW_HEIGHT, hostHeight.value),
)
</script>

<template>
  <v-container class="page music-list-page" fluid>
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

    <div v-else ref="listHost" class="list-host">
      <v-virtual-scroll
        :items="catalog.tracks"
        item-key="id"
        :item-height="TRACK_ROW_HEIGHT"
        class="track-list"
        :class="{ 'track-list--flush': listFlush }"
        :height="listHeight"
      >
        <template #default="{ item: track, index }">
          <TrackListItem
            :track="track"
            :active="player.currentId === track.id"
            @select="playAt(index)"
            @play-next="playNextTrack(track.id)"
            @add-to-queue="addTrackToQueue(track.id)"
          />
        </template>
      </v-virtual-scroll>
    </div>
  </v-container>
</template>

<style scoped>
.music-list-page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.list-host {
  flex: 1 1 auto;
  min-height: 0;
}

.track-list {
  background: transparent;
}

.track-list--flush {
  overflow-y: hidden !important;
}
</style>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import CoverImg from '@/components/CoverImg.vue'
import TrackListItem from '@/components/TrackListItem.vue'
import { artistAlbumPath, artistAlbumsPath } from '@/lib/artistRoutes'
import { localizeAlbumName, localizeArtistName } from '@/lib/displayLabels'
import { useCatalogStore } from '@/stores/catalog'
import { ensureCatalogLoaded } from '@/stores/catalogBootstrap'
import { usePlayerStore } from '@/stores/player'

const { t } = useI18n()
const catalog = useCatalogStore()
const player = usePlayerStore()

const current = computed(() =>
  player.currentId ? catalog.trackById.get(player.currentId) : undefined,
)

const TRACK_ROW_HEIGHT = 64

const queueTracks = computed(() =>
  player.queue
    .map((id) => catalog.trackById.get(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t)),
)

/** Shrink for short queues; cap to viewport so long lists virtualize. */
const queueListHeight = computed(
  () =>
    `min(${Math.max(queueTracks.value.length, 1) * TRACK_ROW_HEIGHT}px, var(--v-music-list-height))`,
)

const progress = computed(() => {
  if (!player.duration) return 0
  return (player.currentTime / player.duration) * 100
})

const repeatIcon = computed(() => {
  if (player.repeatMode === 'one') return 'mdi-repeat-once'
  if (player.repeatMode === 'all') return 'mdi-repeat'
  return 'mdi-repeat-off'
})

onMounted(() => {
  void ensureCatalogLoaded()
})

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function onSeek(value: number | number[]) {
  const pct = Array.isArray(value) ? value[0]! : value
  if (!player.duration) return
  player.seek((pct / 100) * player.duration)
}

function playQueueItem(index: number) {
  player.goToIndex(index, true)
}

function removeQueueItem(index: number) {
  player.removeAt(index)
}

function clearUpcoming() {
  player.clearUpcoming()
}
</script>

<template>
  <v-container data-testid="now-playing-page" class="page-narrow no-touch-callout" fluid>
    <div v-if="current" class="player-hero mb-8">
      <div class="cover-wrap mb-4">
        <CoverImg
          v-if="current.displayCover"
          :src="current.displayCover"
          :aspect-ratio="1"
          class="cover-art"
        />
        <div v-else class="cover-fallback">
          <v-icon icon="mdi-album" size="72" />
        </div>
      </div>

      <div class="text-h5 mb-1">{{ current.displayTitle }}</div>
      <div class="text-medium-emphasis mb-4">
        <RouterLink class="meta-link" :to="artistAlbumsPath(current.displayArtist)">
          {{ localizeArtistName(current.displayArtist, t) }}
        </RouterLink>
        <template v-if="current.displayAlbum">
          ·
          <RouterLink
            class="meta-link"
            :to="artistAlbumPath(current.displayArtist, current.displayAlbum)"
          >
            {{ localizeAlbumName(current.displayAlbum, t) }}
          </RouterLink>
        </template>
      </div>

      <v-slider
        :model-value="progress"
        :max="100"
        hide-details
        color="secondary"
        class="mb-1"
        @update:model-value="onSeek"
      />
      <div class="d-flex justify-space-between text-caption mb-4">
        <span>{{ formatTime(player.currentTime) }}</span>
        <span>{{ formatTime(player.duration) }}</span>
      </div>

      <div class="controls d-flex align-center justify-center ga-2">
        <v-btn
          :icon="repeatIcon"
          variant="text"
          :color="player.repeatMode === 'off' ? undefined : 'secondary'"
          @click="player.toggleRepeat()"
        />
        <v-btn icon="mdi-skip-previous" variant="text" size="large" @click="player.prev()" />
        <v-btn
          :icon="player.playing ? 'mdi-pause' : 'mdi-play'"
          color="secondary"
          size="x-large"
          variant="flat"
          class="play-btn"
          @click="player.togglePlay()"
        />
        <v-btn icon="mdi-skip-next" variant="text" size="large" @click="player.next()" />
        <v-btn
          :icon="player.shuffle ? 'mdi-shuffle' : 'mdi-shuffle-disabled'"
          variant="text"
          :color="player.shuffle ? 'secondary' : undefined"
          @click="player.toggleShuffle()"
        />
      </div>
    </div>

    <v-alert v-else type="info" variant="tonal" class="mb-6">
      {{ t('player.empty') }}
    </v-alert>

    <h2 class="text-h6 mb-3">{{ t('player.queue') }}</h2>
    <div v-if="queueTracks.length > 1" class="mb-3">
      <v-btn
        data-testid="clear-upcoming"
        color="secondary"
        variant="tonal"
        prepend-icon="mdi-playlist-remove"
        @click="clearUpcoming"
      >
        {{ t('player.clearUpcoming') }}
      </v-btn>
    </div>
    <v-virtual-scroll
      :items="queueTracks"
      item-key="id"
      :item-height="TRACK_ROW_HEIGHT"
      class="queue-list"
      :height="queueListHeight"
    >
      <template #default="{ item: track, index }">
        <TrackListItem
          :track="track"
          :active="player.currentId === track.id"
          actions="queue"
          @select="playQueueItem(index)"
          @remove="removeQueueItem(index)"
        />
      </template>
    </v-virtual-scroll>
  </v-container>
</template>

<style scoped>
.no-touch-callout {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.player-hero {
  text-align: center;
}

.cover-wrap {
  margin-inline: auto;
  max-width: var(--v-cover-max-width);
  border-radius: var(--v-radius-lg);
  overflow: hidden;
  box-shadow: var(--v-cover-shadow);
  animation: cover-in 0.45s ease;
}

.cover-art {
  border-radius: var(--v-radius-lg);
}

.cover-fallback {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  background: linear-gradient(
    145deg,
    rgb(var(--v-theme-cover-start)),
    rgb(var(--v-theme-cover-end))
  );
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.meta-link {
  color: inherit;
  text-decoration: none;
}

.meta-link:hover {
  text-decoration: underline;
}

.queue-list {
  background: transparent;
}

.play-btn {
  transition: transform 0.15s ease;
}

.play-btn:active {
  transform: scale(0.94);
}

@keyframes cover-in {
  from {
    opacity: 0;
    transform: translateY(var(--v-motion-cover)) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>

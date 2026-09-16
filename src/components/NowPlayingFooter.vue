<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import CoverImg from '@/components/CoverImg.vue'
import { localizeArtistName } from '@/lib/displayLabels'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const { t } = useI18n()
const router = useRouter()
const catalog = useCatalogStore()
const player = usePlayerStore()

const current = computed(() =>
  player.currentId ? catalog.trackById.get(player.currentId) : undefined,
)

const visible = computed(() => Boolean(current.value))

const progress = computed(() => {
  if (!player.duration) return 0
  return (player.currentTime / player.duration) * 100
})

function openNowPlaying() {
  void router.push({ name: 'now-playing' })
}
</script>

<template>
  <v-footer v-if="visible" app class="now-playing-footer" elevation="8" height="72">
    <v-progress-linear
      data-testid="footer-progress"
      class="footer-progress"
      :model-value="progress"
      :max="100"
      height="3"
      color="secondary"
      bg-color="transparent"
      aria-label="playback progress"
    />
    <div class="footer-inner d-flex align-center ga-3 px-2" @click="openNowPlaying">
      <v-avatar rounded="lg" size="48" class="cover">
        <CoverImg v-if="current?.displayCover" :src="current.displayCover" />
        <v-icon v-else icon="mdi-music-note" />
      </v-avatar>
      <div class="meta">
        <div class="title text-truncate">{{ current?.displayTitle }}</div>
        <div class="artist text-truncate text-medium-emphasis">
          {{ localizeArtistName(current?.displayArtist || '', t) }}
        </div>
      </div>
      <v-btn
        :icon="player.playing ? 'mdi-pause' : 'mdi-play'"
        variant="text"
        @click.stop="player.togglePlay()"
      />
    </div>
  </v-footer>
</template>

<style scoped>
.now-playing-footer {
  position: relative;
  background: linear-gradient(
    90deg,
    rgb(var(--v-theme-footer-start)) 0%,
    rgb(var(--v-theme-footer-mid)) 55%,
    rgb(var(--v-theme-footer-end)) 100%
  );
  color: rgb(var(--v-theme-on-surface));
  border-top: 1px solid rgba(var(--v-theme-secondary), 0.25);
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.footer-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
}

.footer-inner {
  width: 100%;
  cursor: pointer;
}

.meta {
  min-width: 0;
  flex: 1;
}

.title {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.cover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}
</style>

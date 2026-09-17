<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CoverImg from '@/components/CoverImg.vue'
import { useTrackDownload } from '@/composables/useTrackDownload'
import { localizeAlbumName, localizeArtistName } from '@/lib/catalog/displayLabels'
import type { DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const props = withDefaults(
  defineProps<{
    track: DisplayTrack
    active?: boolean
    /** playback = Play next / Add to queue; queue = Remove from queue */
    actions?: 'playback' | 'queue' | 'none'
  }>(),
  { actions: 'playback' },
)

const emit = defineEmits<{
  select: []
  'play-next': []
  'add-to-queue': []
  remove: []
}>()

const { t } = useI18n()
const player = usePlayerStore()
const { downloading } = useTrackDownload(() => props.track)
const coverBusy = computed(() => downloading.value && player.currentId === props.track.id)
</script>

<template>
  <v-list-item :active="active" rounded="lg" class="track-row" @click="emit('select')">
    <template #prepend>
      <v-avatar rounded="lg" size="40" class="me-3">
        <CoverImg
          v-if="track.displayCover || coverBusy"
          :src="track.displayCover"
          :downloading="coverBusy"
        />
        <v-icon v-else icon="mdi-music" />
      </v-avatar>
    </template>
    <v-list-item-title>{{ track.displayTitle }}</v-list-item-title>
    <v-list-item-subtitle>
      {{ localizeArtistName(track.displayArtist, t) }}
      <template v-if="track.displayAlbum">
        · {{ localizeAlbumName(track.displayAlbum, t) }}
      </template>
    </v-list-item-subtitle>
    <template v-if="actions !== 'none'" #append>
      <v-menu location="bottom end" transition="fade-transition">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            data-testid="track-actions"
            icon="mdi-dots-vertical"
            variant="text"
            size="small"
            @click.stop
            @pointerdown.stop
          />
        </template>
        <v-list density="compact" min-width="180">
          <template v-if="actions === 'playback'">
            <v-list-item
              data-testid="track-play-next"
              prepend-icon="mdi-playlist-play"
              :title="t('player.playNext')"
              @click="emit('play-next')"
            />
            <v-list-item
              data-testid="track-add-to-queue"
              prepend-icon="mdi-playlist-plus"
              :title="t('player.addToQueue')"
              @click="emit('add-to-queue')"
            />
          </template>
          <v-list-item
            v-else-if="actions === 'queue'"
            data-testid="track-remove"
            prepend-icon="mdi-playlist-remove"
            :title="t('player.removeFromQueue')"
            @click="emit('remove')"
          />
        </v-list>
      </v-menu>
    </template>
  </v-list-item>
</template>

<style scoped>
.track-row {
  transition: background-color 0.2s ease;
}
</style>

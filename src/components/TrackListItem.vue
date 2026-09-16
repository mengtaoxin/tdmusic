<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import CoverImg from '@/components/CoverImg.vue'
import { localizeAlbumName, localizeArtistName } from '@/lib/displayLabels'
import type { DisplayTrack } from '@/stores/catalog'

defineProps<{
  track: DisplayTrack
  active?: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const { t } = useI18n()
</script>

<template>
  <v-list-item :active="active" rounded="lg" class="track-row" @click="emit('select')">
    <template #prepend>
      <v-avatar rounded="lg" size="40" class="me-3">
        <CoverImg v-if="track.displayCover" :src="track.displayCover" />
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
  </v-list-item>
</template>

<style scoped>
.track-row {
  transition: background-color 0.2s ease;
}
</style>

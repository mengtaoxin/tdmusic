<script setup lang="ts">
import TrackListItem from '@/components/TrackListItem.vue'
import type { DisplayTrack } from '@/stores/catalog'

defineProps<{
  tracks: DisplayTrack[]
  currentId?: string | null
}>()

const emit = defineEmits<{
  select: [index: number]
  playNext: [id: string]
  addToQueue: [id: string]
}>()
</script>

<template>
  <v-list bg-color="transparent">
    <TrackListItem
      v-for="(track, index) in tracks"
      :key="track.id"
      :track="track"
      :active="currentId === track.id"
      @select="emit('select', index)"
      @play-next="emit('playNext', track.id)"
      @add-to-queue="emit('addToQueue', track.id)"
    />
  </v-list>
</template>

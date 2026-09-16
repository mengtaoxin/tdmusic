<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import TrackListItem from '@/components/TrackListItem.vue'
import { localizeAlbumName } from '@/lib/displayLabels'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const { t } = useI18n()
const catalog = useCatalogStore()
const player = usePlayerStore()

onMounted(() => {
  if (!catalog.tracks.length && !catalog.loading) void catalog.load()
})

function playGroup(ids: string[], index: number) {
  player.playFrom(index, ids)
}
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">{{ t('nav.albumList') }}</h1>
    <div v-for="group in catalog.albums" :key="group.name" class="mb-6">
      <h2 class="text-h6 mb-2">{{ localizeAlbumName(group.name, t) }}</h2>
      <v-list bg-color="transparent">
        <TrackListItem
          v-for="(track, index) in group.tracks"
          :key="track.id"
          :track="track"
          :active="player.currentId === track.id"
          @select="
            playGroup(
              group.tracks.map((x) => x.id),
              index,
            )
          "
        />
      </v-list>
    </div>
  </v-container>
</template>

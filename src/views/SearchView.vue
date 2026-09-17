<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import TrackListItem from '@/components/TrackListItem.vue'
import { localizeAlbumName, localizeArtistName } from '@/lib/catalog/displayLabels'
import { pushSearchHistory, readSearchHistory } from '@/lib/searchHistory'
import { useTrackListPlayback } from '@/composables/useTrackListPlayback'

const { t } = useI18n()
const query = ref('')
const history = ref<string[]>(readSearchHistory())

const { catalog, playById, playNextTrack, addTrackToQueue } = useTrackListPlayback(() =>
  catalog.tracks.map((track) => track.id),
)

const results = computed(() => catalog.search(query.value))
const showHistory = computed(() => !query.value.trim() && history.value.length > 0)

function commitHistory() {
  const next = pushSearchHistory(query.value)
  history.value = next
}

function applyHistoryItem(term: string) {
  query.value = term
  commitHistory()
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  event.preventDefault()
  commitHistory()
}
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">{{ t('nav.search') }}</h1>
    <v-text-field
      v-model="query"
      :label="t('search.placeholder')"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      class="mb-6"
      variant="outlined"
      @keydown="onSearchKeydown"
    />

    <template v-if="showHistory">
      <h2 class="text-subtitle-1 mb-2">{{ t('search.history') }}</h2>
      <v-chip
        v-for="term in history"
        :key="term"
        class="ma-1"
        variant="tonal"
        @click="applyHistoryItem(term)"
      >
        {{ term }}
      </v-chip>
    </template>

    <template v-if="query.trim()">
      <h2 class="text-subtitle-1 mb-2">{{ t('search.tracks') }}</h2>
      <v-list bg-color="transparent" class="mb-4">
        <TrackListItem
          v-for="track in results.tracks"
          :key="track.id"
          :track="track"
          @select="playById(track.id)"
          @play-next="playNextTrack(track.id)"
          @add-to-queue="addTrackToQueue(track.id)"
        />
      </v-list>

      <h2 class="text-subtitle-1 mb-2">{{ t('search.artists') }}</h2>
      <v-chip v-for="name in results.artists" :key="name" class="ma-1" variant="tonal">
        {{ localizeArtistName(name, t) }}
      </v-chip>

      <h2 class="text-subtitle-1 mt-4 mb-2">{{ t('search.albums') }}</h2>
      <v-chip v-for="name in results.albums" :key="name" class="ma-1" variant="tonal">
        {{ localizeAlbumName(name, t) }}
      </v-chip>
    </template>
  </v-container>
</template>

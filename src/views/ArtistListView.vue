<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { useVirtualListHost } from '@/composables/useVirtualListHost'
import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'
import { localizeArtistName } from '@/lib/catalog/displayLabels'
import { artistAlbumsPath } from '@/lib/routes/artistRoutes'
import { capVirtualListHeight, virtualListNeedsScroll } from '@/lib/virtualListHeight'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const catalog = useCatalogStore()

const ARTIST_ROW_HEIGHT = 64

const { listHost, hostHeight } = useVirtualListHost()

const listHeight = computed(() =>
  capVirtualListHeight(catalog.artists.length, ARTIST_ROW_HEIGHT, hostHeight.value),
)

const listFlush = computed(
  () => !virtualListNeedsScroll(catalog.artists.length, ARTIST_ROW_HEIGHT, hostHeight.value),
)

onMounted(() => {
  void ensureCatalogLoaded()
})
</script>

<template>
  <v-container class="page artist-list-page" fluid>
    <h1 class="text-h5 mb-4">{{ t('nav.artistList') }}</h1>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <div v-else ref="listHost" class="list-host">
      <v-virtual-scroll
        :items="catalog.artists"
        item-key="name"
        :item-height="ARTIST_ROW_HEIGHT"
        class="artist-list"
        :class="{ 'artist-list--flush': listFlush }"
        :height="listHeight"
      >
        <template #default="{ item: group }">
          <v-list-item
            :title="localizeArtistName(group.name, t)"
            :subtitle="t('artist.trackCount', { count: group.tracks.length })"
            :to="artistAlbumsPath(group.name)"
            rounded="lg"
            class="mb-1"
          >
            <template #prepend>
              <v-icon icon="mdi-account-music" class="me-2" />
            </template>
            <template #append>
              <v-icon icon="mdi-chevron-right" />
            </template>
          </v-list-item>
        </template>
      </v-virtual-scroll>
    </div>
  </v-container>
</template>

<style scoped>
.artist-list-page {
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

.artist-list {
  background: transparent;
}

.artist-list--flush {
  overflow-y: hidden !important;
}
</style>

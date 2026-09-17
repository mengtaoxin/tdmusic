<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { artistAlbumsPath } from '@/lib/routes/artistRoutes'
import { localizeArtistName } from '@/lib/catalog/displayLabels'
import { useCatalogStore } from '@/stores/catalog'
import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'
import { capVirtualListHeight, virtualListNeedsScroll } from '@/lib/virtualListHeight'

const { t } = useI18n()
const catalog = useCatalogStore()

const ARTIST_ROW_HEIGHT = 64

const listHost = ref<HTMLElement | null>(null)
const hostHeight = ref(0)
let resizeObserver: ResizeObserver | null = null

const listHeight = computed(() =>
  capVirtualListHeight(catalog.artists.length, ARTIST_ROW_HEIGHT, hostHeight.value),
)

const listFlush = computed(
  () => !virtualListNeedsScroll(catalog.artists.length, ARTIST_ROW_HEIGHT, hostHeight.value),
)

watch(
  listHost,
  (el) => {
    resizeObserver?.disconnect()
    resizeObserver = null
    hostHeight.value = 0
    if (!el || typeof ResizeObserver === 'undefined') return

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      hostHeight.value = entry.contentRect.height
    })
    resizeObserver.observe(el)
  },
  { flush: 'post' },
)

onMounted(() => {
  void ensureCatalogLoaded()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
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
  height: calc(100dvh - var(--v-app-bar-height) - var(--v-footer-clearance));
  max-height: calc(100dvh - var(--v-app-bar-height) - var(--v-footer-clearance));
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

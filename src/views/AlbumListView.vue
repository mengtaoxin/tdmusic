<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CoverImg from '@/components/CoverImg.vue'
import {
  ALBUM_GALLERY_GAP_PX,
  albumGalleryColumns,
  albumGalleryRowHeight,
  chunkIntoRows,
} from '@/lib/albumGalleryLayout'
import { albumPath, firstAlbumCoverSrc } from '@/lib/routes/albumRoutes'
import { localizeAlbumName } from '@/lib/catalog/displayLabels'
import { useCatalogStore } from '@/stores/catalog'
import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'
import { capVirtualListHeight, virtualListNeedsScroll } from '@/lib/virtualListHeight'

const { t } = useI18n()
const catalog = useCatalogStore()

const listHost = ref<HTMLElement | null>(null)
const hostHeight = ref(0)
const hostWidth = ref(0)
let resizeObserver: ResizeObserver | null = null

const albumTiles = computed(() =>
  catalog.albums.map((group) => ({
    name: group.name,
    tracks: group.tracks,
    coverSrc: firstAlbumCoverSrc(group.tracks),
  })),
)

const columns = computed(() => albumGalleryColumns(hostWidth.value))

const albumRows = computed(() =>
  chunkIntoRows(albumTiles.value, columns.value).map((tiles, index) => ({
    key: `row-${index}-${tiles[0]?.name ?? index}`,
    tiles,
  })),
)

const rowHeight = computed(() => albumGalleryRowHeight(hostWidth.value, columns.value))

const listHeight = computed(() =>
  capVirtualListHeight(albumRows.value.length, rowHeight.value, hostHeight.value),
)

const listFlush = computed(
  () => !virtualListNeedsScroll(albumRows.value.length, rowHeight.value, hostHeight.value),
)

const rowStyle = computed(() => ({
  gap: `${ALBUM_GALLERY_GAP_PX}px`,
  gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
}))

watch(
  listHost,
  (el) => {
    resizeObserver?.disconnect()
    resizeObserver = null
    hostHeight.value = 0
    hostWidth.value = 0
    if (!el || typeof ResizeObserver === 'undefined') return

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      hostHeight.value = entry.contentRect.height
      hostWidth.value = entry.contentRect.width
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
  <v-container class="page album-list-page" fluid>
    <h1 class="text-h5 mb-4">{{ t('nav.albumList') }}</h1>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <div v-else ref="listHost" class="list-host">
      <v-virtual-scroll
        :items="albumRows"
        item-key="key"
        :item-height="rowHeight"
        class="album-list"
        :class="{ 'album-list--flush': listFlush }"
        :height="listHeight"
      >
        <template #default="{ item: row }">
          <div class="album-gallery-row" :style="rowStyle">
            <RouterLink
              v-for="tile in row.tiles"
              :key="tile.name"
              class="album-tile"
              :to="albumPath(tile.name)"
            >
              <div class="album-tile__art">
                <CoverImg
                  v-if="tile.coverSrc"
                  :src="tile.coverSrc"
                  :aspect-ratio="1"
                  class="album-tile__cover"
                />
                <div v-else class="album-tile__fallback" aria-hidden="true">
                  <v-icon icon="mdi-album" size="40" />
                </div>
              </div>
              <div class="album-tile__meta">
                <div class="album-tile__title text-body-2">
                  {{ localizeAlbumName(tile.name, t) }}
                </div>
                <div class="album-tile__subtitle text-caption text-medium-emphasis">
                  {{ t('album.trackCount', { count: tile.tracks.length }) }}
                </div>
              </div>
            </RouterLink>
          </div>
        </template>
      </v-virtual-scroll>
    </div>
  </v-container>
</template>

<style scoped>
.album-list-page {
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

.album-list {
  background: transparent;
}

.album-list--flush {
  overflow-y: hidden !important;
}

.album-gallery-row {
  display: grid;
  box-sizing: border-box;
  /* Bottom padding matches the row-height gap so tiles align with item-height. */
  padding-bottom: v-bind('`${ALBUM_GALLERY_GAP_PX}px`');
}

.album-tile {
  color: inherit;
  text-decoration: none;
  animation: rise 0.45s ease both;
  min-width: 0;
}

.album-tile:hover .album-tile__art {
  transform: translateY(calc(var(--v-motion-cover) * -1));
}

.album-tile__art {
  aspect-ratio: 1;
  border-radius: var(--v-radius-lg);
  overflow: hidden;
  box-shadow: var(--v-cover-shadow);
  transition: transform 0.2s ease;
}

.album-tile__cover {
  width: 100%;
  height: 100%;
}

.album-tile__fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(
    145deg,
    rgb(var(--v-theme-cover-start)),
    rgb(var(--v-theme-cover-end))
  );
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.album-tile__meta {
  margin-top: 0.5rem;
}

.album-tile__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(var(--v-motion-rise));
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CoverImg from '@/components/CoverImg.vue'
import { useVirtualListHost } from '@/composables/useVirtualListHost'
import {
  ALBUM_GALLERY_GAP_PX,
  albumGalleryColumns,
  albumGalleryRowHeight,
  chunkIntoRows,
} from '@/lib/albumGalleryLayout'
import { localizeAlbumName } from '@/lib/catalog/displayLabels'
import { capVirtualListHeight, virtualListNeedsScroll } from '@/lib/virtualListHeight'

export type AlbumGalleryTile = {
  name: string
  trackCount: number
  coverSrc?: string
}

const props = defineProps<{
  tiles: AlbumGalleryTile[]
  /** Build the router `to` for a tile name. */
  pathFor: (name: string) => string
}>()

const { t } = useI18n()
const { listHost, hostHeight, hostWidth } = useVirtualListHost({ observeWidth: true })

const columns = computed(() => albumGalleryColumns(hostWidth.value))

const albumRows = computed(() =>
  chunkIntoRows(props.tiles, columns.value).map((tiles, index) => ({
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
</script>

<template>
  <div ref="listHost" class="list-host album-gallery">
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
            :to="pathFor(tile.name)"
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
                {{ t('album.trackCount', { count: tile.trackCount }) }}
              </div>
            </div>
          </RouterLink>
        </div>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<style scoped>
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

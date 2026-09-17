<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import CoverImg from '@/components/CoverImg.vue'
import { albumPath, firstAlbumCoverSrc } from '@/lib/routes/albumRoutes'
import { localizeAlbumName } from '@/lib/catalog/displayLabels'
import { useCatalogStore } from '@/stores/catalog'
import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'

const { t } = useI18n()
const catalog = useCatalogStore()

const albumTiles = computed(() =>
  catalog.albums.map((group) => ({
    name: group.name,
    tracks: group.tracks,
    coverSrc: firstAlbumCoverSrc(group.tracks),
  })),
)

onMounted(() => {
  void ensureCatalogLoaded()
})
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">{{ t('nav.albumList') }}</h1>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <div v-else class="album-gallery">
      <RouterLink
        v-for="tile in albumTiles"
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
  </v-container>
</template>

<style scoped>
.album-gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 600px) {
  .album-gallery {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .album-gallery {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.album-tile {
  color: inherit;
  text-decoration: none;
  animation: rise 0.45s ease both;
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

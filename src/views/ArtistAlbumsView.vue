<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import CoverImg from '@/components/CoverImg.vue'
import {
  albumsForArtist,
  artistAlbumPath,
  artistPath,
  findArtistGroup,
} from '@/lib/routes/artistRoutes'
import { firstAlbumCoverSrc } from '@/lib/routes/albumRoutes'
import { decodeRouteParam } from '@/lib/routes/routeParams'
import { localizeAlbumName, localizeArtistName } from '@/lib/catalog/displayLabels'
import { useCatalogStore } from '@/stores/catalog'
import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'

const { t } = useI18n()
const route = useRoute()
const catalog = useCatalogStore()

const artistName = computed(() => decodeRouteParam(String(route.params.name ?? '')))

const artist = computed(() => findArtistGroup(catalog.artists, artistName.value))

const albumTiles = computed(() => {
  if (!artist.value) return []
  return albumsForArtist(artist.value.tracks, artist.value.name).map((group) => ({
    name: group.name,
    tracks: group.tracks,
    coverSrc: firstAlbumCoverSrc(group.tracks),
  }))
})

onMounted(() => {
  void ensureCatalogLoaded()
})
</script>

<template>
  <v-container class="page" fluid>
    <h1 class="text-h5 mb-4">
      {{ localizeArtistName(artist?.name || artistName || '', t) || t('nav.artistList') }}
    </h1>

    <v-alert v-if="!catalog.loading && !artist" type="warning" variant="tonal" class="mb-4">
      {{ t('artist.notFound') }}
    </v-alert>

    <v-progress-linear v-if="catalog.loading" indeterminate class="mb-4" />

    <template v-else-if="artist">
      <v-list bg-color="transparent" class="mb-4 pa-0">
        <v-list-item
          :title="t('artist.allMusic')"
          :subtitle="t('artist.trackCount', { count: artist.tracks.length })"
          :to="artistPath(artist.name)"
          rounded="lg"
        >
          <template #prepend>
            <v-icon icon="mdi-music-note" class="me-2" />
          </template>
          <template #append>
            <v-icon icon="mdi-chevron-right" />
          </template>
        </v-list-item>
      </v-list>

      <div class="album-gallery">
        <RouterLink
          v-for="tile in albumTiles"
          :key="tile.name"
          class="album-tile"
          :to="artistAlbumPath(artist.name, tile.name)"
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

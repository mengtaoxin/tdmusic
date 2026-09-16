<script setup lang="ts">
import { onMounted } from 'vue'

import AppHeader from './components/AppHeader.vue'
import AudioHost from './components/AudioHost.vue'
import NowPlayingFooter from './components/NowPlayingFooter.vue'
import { loadCatalogAndHydratePlayer } from './stores/catalogBootstrap'

onMounted(async () => {
  await loadCatalogAndHydratePlayer()
})
</script>

<template>
  <v-app class="tdmusic-app">
    <AppHeader />
    <v-main>
      <router-view />
    </v-main>
    <NowPlayingFooter />
    <AudioHost />
  </v-app>
</template>

<style>
html {
  scrollbar-gutter: stable;
}

.tdmusic-app {
  background:
    radial-gradient(ellipse at top left, rgba(var(--v-theme-primary), 0.18), transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(var(--v-theme-secondary), 0.08), transparent 45%),
    rgb(var(--v-theme-background));
}

.tdmusic-app .v-main {
  padding-bottom: var(--v-footer-clearance);
}

.page {
  max-width: var(--v-page-max-width);
}

.page-narrow {
  max-width: var(--v-content-max-width);
}
</style>

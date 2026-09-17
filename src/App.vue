<script setup lang="ts">
import { onMounted } from 'vue'

import AppHeader from './components/AppHeader.vue'
import AudioHost from './components/AudioHost.vue'
import NowPlayingFooter from './components/NowPlayingFooter.vue'
import { loadCatalogAndHydratePlayer } from '@/lib/catalog/catalogBootstrap'

onMounted(async () => {
  await loadCatalogAndHydratePlayer()
})
</script>

<template>
  <v-app class="tdmusic-app">
    <AppHeader />
    <v-main scrollable>
      <router-view />
    </v-main>
    <NowPlayingFooter />
    <AudioHost />
  </v-app>
</template>

<style>
html,
body,
#app {
  height: 100%;
  overflow: hidden;
}

html {
  color-scheme: dark;
}

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-on-background), 0.28) transparent;
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-on-background), 0.28);
  border-radius: 999px;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--v-theme-on-background), 0.42);
}

.tdmusic-app {
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse at top left, rgba(var(--v-theme-primary), 0.18), transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(var(--v-theme-secondary), 0.08), transparent 45%),
    rgb(var(--v-theme-background));
}

.tdmusic-app .v-application__wrap {
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

.tdmusic-app .v-main {
  padding-bottom: var(--v-footer-clearance);
}

.tdmusic-app .v-main__scroller {
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-on-background), 0.28) transparent;
}

.page {
  max-width: var(--v-page-max-width);
}

.page-narrow {
  max-width: var(--v-content-max-width);
}
</style>

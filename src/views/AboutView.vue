<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import brandIconUrl from '@/assets/brand-icon.png'

const { t } = useI18n()

const GITHUB_URL = 'https://github.com/mengtaoxin/tdmusic'
</script>

<template>
  <v-container fluid class="text-center">
    <img class="about-icon mb-3" :src="brandIconUrl" width="64" height="64" alt="" />
    <h1 class="text-h5 mb-4">tdmusic</h1>
    <a
      :href="GITHUB_URL"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('about.github')"
      class="github-link"
    >
      <v-icon icon="mdi-github" size="large" />
    </a>
  </v-container>
</template>

<style scoped>
.about-icon {
  display: block;
  margin-inline: auto;
  border-radius: var(--v-radius-lg);
}

.github-link {
  display: inline-flex;
  color: inherit;
  text-decoration: none;
}

.github-link:hover {
  opacity: 0.8;
}
</style>

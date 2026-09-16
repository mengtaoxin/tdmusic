<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const GITHUB_URL = 'https://github.com/mengtaoxin/tdmusic'
</script>

<template>
  <v-container fluid class="text-center">
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
.github-link {
  display: inline-flex;
  color: inherit;
  text-decoration: none;
}

.github-link:hover {
  opacity: 0.8;
}
</style>

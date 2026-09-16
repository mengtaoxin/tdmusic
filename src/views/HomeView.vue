<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <v-container class="page-home" fluid>
    <div class="hero">
      <p class="eyebrow text-secondary text-caption text-uppercase mb-3">tdmusic</p>
      <h1 class="text-h4 mb-3">{{ t('home.title') }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ t('home.lead') }}
      </p>
      <ul class="points ga-2 text-body-2 text-medium-emphasis mb-6">
        <li>{{ t('home.pointPlay') }}</li>
        <li>{{ t('home.pointBrowse') }}</li>
      </ul>
      <v-btn color="secondary" to="/music" variant="flat">
        {{ t('home.cta') }}
      </v-btn>
    </div>
  </v-container>
</template>

<style scoped>
.page-home {
  min-height: calc(100vh - var(--v-home-viewport-offset));
  display: grid;
  place-items: center;
}

.hero {
  text-align: center;
  max-width: var(--v-hero-max-width);
  animation: rise 0.5s ease;
}

.eyebrow {
  letter-spacing: 0.2em;
}

.points {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
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

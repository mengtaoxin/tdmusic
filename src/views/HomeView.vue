<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import brandIconUrl from '@/assets/brand-icon.png'

const { t } = useI18n()
</script>

<template>
  <v-container class="page-home" fluid>
    <div class="hero">
      <img class="brand-icon mb-3" :src="brandIconUrl" width="48" height="48" alt="" />
      <p class="eyebrow text-secondary text-caption text-uppercase mb-3">tdmusic</p>
      <h1 class="text-h4 mb-3">{{ t('home.title') }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ t('home.lead') }}
      </p>
      <ul class="points ga-2 text-body-2 text-medium-emphasis">
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

.brand-icon {
  display: block;
  margin-inline: auto;
  border-radius: var(--v-radius-lg);
}

.eyebrow {
  letter-spacing: 0.2em;
}

.points {
  list-style: none;
  padding: 0;
  margin: 0;
  /* Match ink-to-ink line gap: half-leading + points gap (ga-2 = 0.5rem). */
  margin-bottom: calc((1lh - 1em) / 2 + 0.5rem);
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

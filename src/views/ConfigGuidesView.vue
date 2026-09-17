<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { configGuideMarkdownUrl, renderMarkdown } from '@/lib/configGuideMarkdown'

const { t, locale } = useI18n()

const html = ref('')
const loadError = ref(false)
const loading = ref(true)

async function loadGuide(localeValue: string) {
  loading.value = true
  loadError.value = false
  html.value = ''
  try {
    const response = await fetch(configGuideMarkdownUrl(localeValue))
    if (!response.ok) {
      loadError.value = true
      return
    }
    const source = await response.text()
    html.value = renderMarkdown(source)
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch(
  locale,
  (value) => {
    void loadGuide(String(value))
  },
  { immediate: true },
)
</script>

<template>
  <v-container class="page-narrow" fluid>
    <p v-if="loading" class="text-body-2 text-medium-emphasis">{{ t('configGuides.loading') }}</p>
    <p v-else-if="loadError" class="text-body-2 text-error">{{ t('configGuides.loadError') }}</p>
    <div v-else class="guide-md" v-html="html" />
  </v-container>
</template>

<style scoped>
.guide-md :deep(h1) {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.guide-md :deep(h2) {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  margin: 1.5rem 0 0.5rem;
}

.guide-md :deep(p) {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.guide-md :deep(ul) {
  margin: 0 0 0.75rem;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.guide-md :deep(li) {
  margin-bottom: 0.25rem;
}

.guide-md :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85em;
}

.guide-md :deep(pre) {
  margin: 0 0 0.75rem;
  overflow-x: auto;
  padding: 0.75rem 1rem;
  background: rgba(var(--v-theme-secondary), 0.08);
  border: 1px solid rgba(var(--v-theme-secondary), var(--v-border-opacity));
  border-radius: var(--v-radius-md);
  font-size: 0.875rem;
  line-height: 1.5;
}

.guide-md :deep(pre code) {
  font-size: inherit;
  white-space: pre-wrap;
}
</style>

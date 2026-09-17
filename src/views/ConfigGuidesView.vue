<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { configLlmPromptForLocale } from '@/lib/catalog/configLlmPrompt'

const { t, locale } = useI18n()
const llmPrompt = computed(() => configLlmPromptForLocale(String(locale.value)))
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyLlmPrompt() {
  const text = llmPrompt.value
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = true
  if (copiedTimer !== undefined) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
    copiedTimer = undefined
  }, 2000)
}
</script>

<template>
  <v-container class="page-narrow" fluid>
    <h1 class="text-h5 mb-4">{{ t('configGuides.title') }}</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">{{ t('configGuides.intro') }}</p>

    <section class="guide mb-6">
      <h2 class="text-subtitle-1 mb-2">{{ t('configGuides.whereTitle') }}</h2>
      <p class="text-body-2">{{ t('configGuides.whereBody') }}</p>
    </section>

    <section class="guide mb-6">
      <h2 class="text-subtitle-1 mb-2">{{ t('configGuides.musicListTitle') }}</h2>
      <p class="text-body-2 mb-2">{{ t('configGuides.musicListBody') }}</p>
      <ul class="fields text-body-2 pl-5">
        <li class="mb-1"><code>id</code> — {{ t('configGuides.fieldId') }}</li>
        <li class="mb-1"><code>path</code> — {{ t('configGuides.fieldPath') }}</li>
        <li class="mb-1"><code>title</code> — {{ t('configGuides.fieldTitle') }}</li>
        <li class="mb-1"><code>artist</code> — {{ t('configGuides.fieldArtist') }}</li>
        <li class="mb-1"><code>album</code> — {{ t('configGuides.fieldAlbum') }}</li>
        <li class="mb-1"><code>cover</code> — {{ t('configGuides.fieldCover') }}</li>
      </ul>
    </section>

    <section class="guide mb-6">
      <h2 class="text-subtitle-1 mb-2">{{ t('configGuides.playlistsTitle') }}</h2>
      <p class="text-body-2">{{ t('configGuides.playlistsBody') }}</p>
    </section>

    <section class="guide mb-6">
      <h2 class="text-subtitle-1 mb-2">{{ t('configGuides.exampleTitle') }}</h2>
      <pre class="example text-body-2 py-3 px-4"><code>{
  "music-list": [
    {
      "id": "sample-1",
      "title": "Sample 1",
      "artist": "Artist 1",
      "album": "Album 1",
      "path": "/sample-1.mp3"
    }
  ],
  "playlists": [
    {
      "title": "My Playlist1",
      "music-list": [
        { "id": "sample-1" }
      ]
    }
  ]
}</code></pre>
    </section>

    <section class="guide mb-6">
      <h2 class="text-subtitle-1 mb-2">{{ t('configGuides.notesTitle') }}</h2>
      <ul class="notes text-body-2 pl-5">
        <li class="mb-1">{{ t('configGuides.noteFallback') }}</li>
        <li class="mb-1">{{ t('configGuides.noteUnknown') }}</li>
        <li class="mb-1">{{ t('configGuides.notePaths') }}</li>
      </ul>
    </section>

    <section class="guide">
      <div class="d-flex align-center flex-wrap ga-2 mb-2">
        <h2 class="text-subtitle-1 ma-0">{{ t('configGuides.llmTitle') }}</h2>
        <v-btn
          data-testid="copy-llm-prompt"
          size="small"
          variant="tonal"
          prepend-icon="mdi-content-copy"
          @click="copyLlmPrompt"
        >
          {{ copied ? t('configGuides.llmCopied') : t('configGuides.llmCopy') }}
        </v-btn>
      </div>
      <p class="text-body-2 mb-3">{{ t('configGuides.llmBody') }}</p>
      <pre
        data-testid="config-llm-prompt"
        class="example text-body-2 py-3 px-4"
      ><code>{{ llmPrompt }}</code></pre>
    </section>
  </v-container>
</template>

<style scoped>
.guide p {
  margin: 0;
}

.fields,
.notes {
  margin: 0;
}

.example {
  margin: 0;
  overflow-x: auto;
  background: rgba(var(--v-theme-secondary), 0.08);
  border: 1px solid rgba(var(--v-theme-secondary), var(--v-border-opacity));
  border-radius: var(--v-radius-md);
}

.example code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
}
</style>

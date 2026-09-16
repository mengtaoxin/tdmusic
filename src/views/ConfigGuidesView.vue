<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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

    <section class="guide">
      <h2 class="text-subtitle-1 mb-2">{{ t('configGuides.notesTitle') }}</h2>
      <ul class="notes text-body-2 pl-5">
        <li class="mb-1">{{ t('configGuides.noteFallback') }}</li>
        <li class="mb-1">{{ t('configGuides.noteUnknown') }}</li>
        <li class="mb-1">{{ t('configGuides.notePaths') }}</li>
      </ul>
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
  white-space: pre;
}
</style>

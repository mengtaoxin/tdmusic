<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { clearAppLogs, listAppLogs, type AppLogEntry } from '@/lib/appLogStore'

const { t } = useI18n()

const logs = ref<AppLogEntry[]>([])
const clearing = ref(false)
const confirmClearOpen = ref(false)

async function refresh() {
  logs.value = await listAppLogs()
}

function openClearConfirm() {
  confirmClearOpen.value = true
}

async function confirmClearLogs() {
  confirmClearOpen.value = false
  clearing.value = true
  try {
    await clearAppLogs()
    logs.value = []
  } finally {
    clearing.value = false
  }
}

function formatTime(at: number) {
  return new Date(at).toLocaleString()
}

onMounted(() => {
  void refresh()
})
</script>

<template>
  <v-container fluid data-testid="logs-page" class="page-narrow">
    <div class="d-flex align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 ma-0">{{ t('nav.logs') }}</h1>
      <v-btn
        data-testid="logs-clear"
        color="error"
        variant="tonal"
        :loading="clearing"
        :disabled="logs.length === 0"
        @click="openClearConfirm"
      >
        {{ t('logs.clear') }}
      </v-btn>
    </div>

    <v-dialog v-model="confirmClearOpen" max-width="420">
      <v-card>
        <v-card-title>{{ t('logs.clear') }}</v-card-title>
        <v-card-text>{{ t('logs.clearConfirm') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmClearOpen = false">{{ t('settings.cancel') }}</v-btn>
          <v-btn color="error" variant="tonal" @click="confirmClearLogs">
            {{ t('settings.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <p v-if="logs.length === 0" class="text-body-2 text-medium-emphasis">
      {{ t('logs.empty') }}
    </p>

    <ul v-else class="log-list">
      <li
        v-for="entry in logs"
        :key="entry.id"
        data-testid="log-entry"
        class="log-entry text-body-2"
      >
        <time class="log-time text-medium-emphasis" :datetime="new Date(entry.at).toISOString()">
          {{ formatTime(entry.at) }}
        </time>
        <span class="log-message">{{ entry.message }}</span>
      </li>
    </ul>
  </v-container>
</template>

<style scoped>
.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.log-entry {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-block: 0.75rem;
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.log-time {
  font-variant-numeric: tabular-nums;
}

.log-message {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

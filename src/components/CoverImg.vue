<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useLazyLoad } from '@/composables/useLazyLoad'

const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    cover?: boolean
    aspectRatio?: string | number
    /** Load immediately instead of waiting for viewport intersection. Prefer false. */
    eager?: boolean
    /** Replace the still cover with a motion placeholder while audio caches. */
    downloading?: boolean
    /** 0–100 when Content-Length is known. */
    downloadPercent?: number | null
  }>(),
  {
    cover: true,
    eager: false,
    downloading: false,
    downloadPercent: null,
  },
)

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const visible = useLazyLoad(root, toRef(props, 'eager'))

const rootStyle = computed(() =>
  props.aspectRatio != null ? { aspectRatio: String(props.aspectRatio) } : undefined,
)

const showImage = computed(() => Boolean(visible.value && props.src && !props.downloading))

const ringStyle = computed(() => {
  if (!props.downloading || props.downloadPercent == null) return undefined
  return { '--cover-download-percent': `${props.downloadPercent}%` }
})
</script>

<template>
  <div
    ref="root"
    class="cover-img no-touch-callout"
    :class="{ 'cover-img--busy': downloading }"
    :style="rootStyle"
    :aria-busy="downloading ? 'true' : undefined"
    :aria-label="downloading ? t('player.downloading') : undefined"
    @contextmenu.prevent
  >
    <img
      v-if="showImage"
      class="cover-img__media cover-img__media--reveal"
      :class="{ 'cover-img__media--cover': cover }"
      :src="src"
      :alt="alt ?? ''"
      draggable="false"
    />
    <div
      v-if="downloading"
      class="cover-img__busy"
      data-testid="cover-downloading"
      aria-hidden="true"
    >
      <div class="cover-img__aurora" />
      <div class="cover-img__sheen" />
      <div
        class="cover-img__ring"
        :class="{ 'cover-img__ring--indeterminate': downloadPercent == null }"
        :style="ringStyle"
      />
      <v-icon class="cover-img__note" icon="mdi-music-note" />
    </div>
  </div>
</template>

<style scoped>
.cover-img {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.no-touch-callout {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.cover-img__media {
  display: block;
  width: 100%;
  height: 100%;
  -webkit-user-drag: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.cover-img__media--cover {
  object-fit: cover;
}

.cover-img__media--reveal {
  animation: cover-reveal 0.45s ease;
}

.cover-img--busy {
  background: rgb(var(--v-theme-cover-end));
}

.cover-img__busy {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.cover-img__aurora {
  position: absolute;
  inset: -45%;
  background: conic-gradient(
    from 0deg,
    rgb(var(--v-theme-cover-start)),
    rgb(var(--v-theme-primary)),
    rgb(var(--v-theme-secondary)),
    rgb(var(--v-theme-cover-end)),
    rgb(var(--v-theme-cover-start))
  );
  animation: cover-aurora-spin 3.6s linear infinite;
}

.cover-img__sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 35%,
    rgba(var(--v-theme-on-surface), 0.28) 50%,
    transparent 65%
  );
  background-size: 220% 100%;
  animation: cover-sheen 1.8s ease-in-out infinite;
}

.cover-img__ring {
  position: absolute;
  inset: 16%;
  border-radius: 50%;
  background: conic-gradient(
    rgb(var(--v-theme-secondary)) var(--cover-download-percent, 0%),
    rgba(var(--v-theme-on-surface), 0.12) 0
  );
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0);
}

.cover-img__ring--indeterminate {
  background: conic-gradient(
    from 0deg,
    transparent 0,
    rgb(var(--v-theme-secondary)) 80deg,
    transparent 160deg
  );
  animation: cover-aurora-spin 1.1s linear infinite;
}

.cover-img__note {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.88;
  animation: cover-note-pulse 1.6s ease-in-out infinite;
}

@keyframes cover-aurora-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes cover-sheen {
  from {
    background-position: 120% 0;
  }
  to {
    background-position: -40% 0;
  }
}

@keyframes cover-note-pulse {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}

@keyframes cover-reveal {
  from {
    opacity: 0;
    transform: scale(1.04);
    filter: blur(6px);
  }
  to {
    opacity: 1;
    transform: none;
    filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-img__aurora,
  .cover-img__sheen,
  .cover-img__ring--indeterminate,
  .cover-img__note,
  .cover-img__media--reveal {
    animation: none;
  }
}
</style>

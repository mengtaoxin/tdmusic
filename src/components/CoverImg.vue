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
    /** Show a simple spinner while audio caches. */
    downloading?: boolean
  }>(),
  {
    cover: true,
    eager: false,
    downloading: false,
  },
)

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const visible = useLazyLoad(root, toRef(props, 'eager'))

const rootStyle = computed(() =>
  props.aspectRatio != null ? { aspectRatio: String(props.aspectRatio) } : undefined,
)

const showImage = computed(() => Boolean(visible.value && props.src && !props.downloading))
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
      class="cover-img__media"
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
      <v-progress-circular color="secondary" indeterminate size="24" width="2" />
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

.cover-img--busy {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.cover-img__busy {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

@media (prefers-reduced-motion: reduce) {
  .cover-img__busy :deep(.v-progress-circular) {
    animation: none;
  }
}
</style>

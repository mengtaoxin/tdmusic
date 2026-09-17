<script setup lang="ts">
import { computed, ref, toRef } from 'vue'

import { useLazyLoad } from '@/composables/useLazyLoad'

const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    cover?: boolean
    aspectRatio?: string | number
    /** Load immediately instead of waiting for viewport intersection. Prefer false. */
    eager?: boolean
  }>(),
  {
    cover: true,
    eager: false,
  },
)

const root = ref<HTMLElement | null>(null)
const visible = useLazyLoad(root, toRef(props, 'eager'))

const rootStyle = computed(() =>
  props.aspectRatio != null ? { aspectRatio: String(props.aspectRatio) } : undefined,
)
</script>

<template>
  <div ref="root" class="cover-img no-touch-callout" :style="rootStyle" @contextmenu.prevent>
    <img
      v-if="visible"
      class="cover-img__media"
      :class="{ 'cover-img__media--cover': cover }"
      :src="src"
      :alt="alt ?? ''"
      draggable="false"
    />
  </div>
</template>

<style scoped>
.cover-img {
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
</style>

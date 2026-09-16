<script setup lang="ts">
import { ref, toRef } from 'vue'

import { useLazyLoad } from '@/lib/useLazyLoad'

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
</script>

<template>
  <div ref="root" class="cover-img">
    <v-img v-if="visible" :src="src" :alt="alt" :cover="cover" :aspect-ratio="aspectRatio" eager />
  </div>
</template>

<style scoped>
.cover-img {
  width: 100%;
  height: 100%;
}
</style>

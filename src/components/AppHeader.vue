<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import brandIconUrl from '@/assets/brand-icon.png'
import { writeStoredLocale } from '@/lib/locale'
import { shouldCollapseNav } from '@/lib/navLayout'

const { t, locale } = useI18n()
const route = useRoute()
const drawerOpen = ref(false)
const compactNav = ref(true)

const appBarRef = ref<{ $el?: HTMLElement } | null>(null)
const desktopNavRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function updateCompactNav() {
  const toolbarContent = appBarRef.value?.$el?.querySelector(
    '.v-toolbar__content',
  ) as HTMLElement | null
  const brand = toolbarContent?.querySelector('.brand') as HTMLElement | null
  const nav = desktopNavRef.value
  if (!toolbarContent || !brand || !nav) return

  const availableWidth = toolbarContent.clientWidth - brand.offsetWidth
  compactNav.value = shouldCollapseNav(nav.scrollWidth, availableWidth)
}

function observeLayout() {
  resizeObserver?.disconnect()
  resizeObserver = null

  const toolbarContent = appBarRef.value?.$el?.querySelector(
    '.v-toolbar__content',
  ) as HTMLElement | null
  if (!toolbarContent || typeof ResizeObserver === 'undefined') {
    updateCompactNav()
    return
  }

  resizeObserver = new ResizeObserver(() => {
    updateCompactNav()
  })
  resizeObserver.observe(toolbarContent)
  if (desktopNavRef.value) resizeObserver.observe(desktopNavRef.value)
  updateCompactNav()
}

watch(locale, async () => {
  writeStoredLocale(locale.value)
  await nextTick()
  updateCompactNav()
})

watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)

onMounted(() => {
  observeLayout()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

const navItems = [
  { to: '/', key: 'nav.home', icon: 'mdi-home' },
  { to: '/music', key: 'nav.musicList', icon: 'mdi-music-box-multiple' },
  { to: '/playlists', key: 'nav.playlist', icon: 'mdi-playlist-music' },
  { to: '/artists', key: 'nav.artistList', icon: 'mdi-account-music' },
  { to: '/albums', key: 'nav.albumList', icon: 'mdi-album' },
  { to: '/now-playing', key: 'nav.nowPlaying', icon: 'mdi-play-circle' },
  { to: '/search', key: 'nav.search', icon: 'mdi-magnify' },
  { to: '/settings', key: 'nav.settings', icon: 'mdi-cog' },
  { to: '/about', key: 'nav.about', icon: 'mdi-information-outline' },
] as const

const localeItems = computed(() => [
  { title: t('locale.en'), value: 'en', icon: 'mdi-translate' },
  { title: t('locale.zh'), value: 'zh', icon: 'mdi-translate' },
])
</script>

<template>
  <v-navigation-drawer
    v-model="drawerOpen"
    data-testid="nav-drawer"
    temporary
    location="start"
    width="280"
    class="nav-drawer"
  >
    <v-list density="compact" nav>
      <v-list-item
        v-for="item in navItems"
        :key="item.key"
        :to="item.to"
        :title="t(item.key)"
        :prepend-icon="item.icon"
        @click="drawerOpen = false"
      />
      <v-divider class="my-2" />
      <v-list-item
        v-for="item in localeItems"
        :key="item.value"
        :data-testid="`locale-option-${item.value}`"
        :title="item.title"
        :prepend-icon="item.icon"
        :active="locale === item.value"
        @click="locale = item.value"
      />
    </v-list>
  </v-navigation-drawer>

  <v-app-bar ref="appBarRef" flat class="app-bar" color="transparent">
    <v-app-bar-title class="brand text-secondary flex-grow-0 flex-shrink-0">
      <span class="brand-mark">
        <img
          data-testid="brand-icon"
          class="brand-icon"
          :src="brandIconUrl"
          width="28"
          height="28"
          alt=""
        />
        tdmusic
      </span>
    </v-app-bar-title>

    <v-btn
      v-if="compactNav"
      data-testid="nav-menu-toggle"
      icon
      variant="text"
      :aria-label="t('nav.openMenu')"
      @click="drawerOpen = !drawerOpen"
    >
      <v-icon>mdi-menu</v-icon>
    </v-btn>

    <template #append>
      <nav
        ref="desktopNavRef"
        data-testid="desktop-nav"
        class="desktop-nav align-center ga-1"
        :class="{ 'desktop-nav--measure': compactNav }"
        :aria-hidden="compactNav ? 'true' : undefined"
      >
        <v-btn
          v-for="item in navItems"
          :key="item.key"
          :to="item.to"
          :prepend-icon="item.icon"
          variant="text"
          size="small"
          :tabindex="compactNav ? -1 : undefined"
        >
          {{ t(item.key) }}
        </v-btn>
      </nav>
    </template>
  </v-app-bar>
</template>

<style scoped>
.app-bar {
  border-bottom: 1px solid rgba(var(--v-theme-secondary), var(--v-border-opacity));
  backdrop-filter: blur(var(--v-blur-header));
}

.brand {
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-basis: auto;
  min-width: max-content;
}

.brand :deep(.v-toolbar-title__placeholder) {
  overflow: visible;
  width: auto;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.brand-icon {
  display: block;
  border-radius: var(--v-radius-md);
  flex-shrink: 0;
}

.desktop-nav {
  display: flex;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.desktop-nav--measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
}

.nav-drawer {
  border-inline-end: 1px solid rgba(var(--v-theme-secondary), var(--v-border-opacity));
}
</style>

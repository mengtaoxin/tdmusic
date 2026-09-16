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
const openMenus = ref<Record<string, boolean>>({})

const appBarRef = ref<{ $el?: HTMLElement } | null>(null)
const desktopNavRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

type NavRouteLink = { to: string; key: string; icon: string }
type NavExternalLink = { href: string; key: string; icon: string }
type NavLocaleLink = { locale: 'en' | 'zh'; key: string; icon: string }
type NavLink = NavRouteLink | NavExternalLink | NavLocaleLink
type NavGroup = { key: string; icon: string; children: readonly NavLink[]; menuTestId: string }
type NavItem = NavRouteLink | NavGroup

function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item
}

function isExternalNavLink(item: NavLink): item is NavExternalLink {
  return 'href' in item
}

function isLocaleNavLink(item: NavLink): item is NavLocaleLink {
  return 'locale' in item
}

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
    openMenus.value = {}
  },
)

onMounted(() => {
  observeLayout()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

const GITHUB_ISSUES_URL = 'https://github.com/mengtaoxin/tdmusic/issues'

const moreChildren: readonly NavLink[] = [
  { to: '/search', key: 'nav.search', icon: 'mdi-magnify' },
  { to: '/settings', key: 'nav.settings', icon: 'mdi-cog' },
  { to: '/config-guides', key: 'nav.configGuides', icon: 'mdi-file-document-outline' },
  { to: '/about', key: 'nav.about', icon: 'mdi-information-outline' },
  { to: '/logs', key: 'nav.logs', icon: 'mdi-text-box-outline' },
  { href: GITHUB_ISSUES_URL, key: 'nav.feedback', icon: 'mdi-message-text-outline' },
]

const localeChildren: readonly NavLocaleLink[] = [
  { locale: 'en', key: 'locale.en', icon: 'mdi-translate' },
  { locale: 'zh', key: 'locale.zh', icon: 'mdi-translate' },
]

const navItems: readonly NavItem[] = [
  { to: '/now-playing', key: 'nav.nowPlaying', icon: 'mdi-play-circle' },
  { to: '/music', key: 'nav.musicList', icon: 'mdi-music-box-multiple' },
  { to: '/playlists', key: 'nav.playlist', icon: 'mdi-playlist-music' },
  { to: '/artists', key: 'nav.artistList', icon: 'mdi-account-music' },
  { to: '/albums', key: 'nav.albumList', icon: 'mdi-album' },
  { key: 'nav.more', icon: 'mdi-dots-horizontal', children: moreChildren, menuTestId: 'nav-more' },
  {
    key: 'nav.language',
    icon: 'mdi-translate',
    children: localeChildren,
    menuTestId: 'nav-locale',
  },
]

const moreChildPaths: readonly string[] = moreChildren.flatMap((item) =>
  isExternalNavLink(item) || isLocaleNavLink(item) ? [] : [item.to],
)

const moreGroupActive = computed(() => moreChildPaths.includes(route.path))

function groupActive(item: NavGroup): boolean {
  if (item.key === 'nav.more') return moreGroupActive.value
  if (item.key === 'nav.language') return false
  return false
}

function setLocale(value: 'en' | 'zh') {
  locale.value = value
}

function childBindings(child: NavLink) {
  if (isLocaleNavLink(child)) {
    return {
      'data-testid': `locale-option-${child.locale}`,
      active: locale.value === child.locale,
      onClick: () => {
        setLocale(child.locale)
        drawerOpen.value = false
      },
    }
  }
  if (isExternalNavLink(child)) {
    return {
      href: child.href,
      target: '_blank',
      rel: 'noopener noreferrer',
      onClick: () => {
        drawerOpen.value = false
      },
    }
  }
  return {
    to: child.to,
    onClick: () => {
      drawerOpen.value = false
    },
  }
}

function desktopChildBindings(child: NavLink) {
  if (isLocaleNavLink(child)) {
    return {
      'data-testid': `locale-option-${child.locale}`,
      active: locale.value === child.locale,
      onClick: () => setLocale(child.locale),
    }
  }
  if (isExternalNavLink(child)) {
    return { href: child.href, target: '_blank', rel: 'noopener noreferrer' }
  }
  return { to: child.to }
}

function childTitle(child: NavLink): string {
  return t(child.key)
}
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
      <template v-for="item in navItems" :key="item.key">
        <v-list-group v-if="isNavGroup(item)" :value="item.key">
          <template #activator="{ props: activatorProps }">
            <v-list-item
              v-bind="activatorProps"
              :title="t(item.key)"
              :prepend-icon="item.icon"
              :active="groupActive(item)"
            />
          </template>
          <v-list-item
            v-for="child in item.children"
            :key="child.key"
            v-bind="childBindings(child)"
            :title="childTitle(child)"
            :prepend-icon="child.icon"
          />
        </v-list-group>
        <v-list-item
          v-else
          :to="item.to"
          :title="t(item.key)"
          :prepend-icon="item.icon"
          @click="drawerOpen = false"
        />
      </template>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar ref="appBarRef" flat class="app-bar" color="transparent">
    <v-app-bar-title class="brand text-secondary flex-grow-0 flex-shrink-0">
      <RouterLink to="/" data-testid="brand-title" class="brand-mark header-centerline">
        <img
          data-testid="brand-icon"
          class="brand-icon"
          :src="brandIconUrl"
          width="28"
          height="28"
          alt=""
        />
        tdmusic
        <span data-testid="brand-beta" class="brand-beta">{{ t('nav.beta') }}</span>
      </RouterLink>
    </v-app-bar-title>

    <v-btn
      v-if="compactNav"
      data-testid="nav-menu-toggle"
      class="header-centerline"
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
        class="desktop-nav header-centerline align-center ga-1"
        :class="{ 'desktop-nav--measure': compactNav }"
        :aria-hidden="compactNav ? 'true' : undefined"
      >
        <template v-for="item in navItems" :key="item.key">
          <v-menu
            v-if="isNavGroup(item)"
            v-model="openMenus[item.key]"
            location="bottom end"
            :close-on-content-click="true"
          >
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                :data-testid="`${item.menuTestId}-toggle`"
                :prepend-icon="item.icon"
                variant="text"
                size="small"
                :active="groupActive(item)"
                :tabindex="compactNav ? -1 : undefined"
              >
                {{ t(item.key) }}
              </v-btn>
            </template>
            <v-list
              density="compact"
              :data-testid="`${item.menuTestId}-menu`"
              min-width="160"
            >
              <v-list-item
                v-for="child in item.children"
                :key="child.key"
                v-bind="desktopChildBindings(child)"
                :title="childTitle(child)"
                :prepend-icon="child.icon"
              />
            </v-list>
          </v-menu>
          <v-btn
            v-else
            :to="item.to"
            :prepend-icon="item.icon"
            variant="text"
            size="small"
            :tabindex="compactNav ? -1 : undefined"
          >
            {{ t(item.key) }}
          </v-btn>
        </template>
      </nav>
    </template>
  </v-app-bar>
</template>

<style scoped>
.app-bar {
  border-bottom: 1px solid rgba(var(--v-theme-secondary), var(--v-border-opacity));
  backdrop-filter: blur(var(--v-blur-header));
}

.app-bar :deep(.v-toolbar__content) {
  align-items: center;
}

.brand {
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-basis: auto;
  min-width: max-content;
  align-self: center;
  margin-block: 0;
  padding-block: 0;
  line-height: 1.25;
}

.brand :deep(.v-toolbar-title__placeholder) {
  display: flex;
  align-items: center;
  overflow: visible;
  width: auto;
  height: 100%;
}

.header-centerline {
  align-self: center;
}

.header-centerline.v-btn--icon {
  height: 2.25rem;
  width: 2.25rem;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  line-height: 1.25;
  height: 2.25rem;
  color: inherit;
  text-decoration: none;
}

.brand-icon {
  display: block;
  border-radius: var(--v-radius-md);
  flex-shrink: 0;
}

.brand-beta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-inline-start: 0.15rem;
  padding: 0.05rem 0.35rem;
  border-radius: 0.25rem;
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-secondary));
  background: rgba(var(--v-theme-secondary), 0.85);
  flex-shrink: 0;
}

.desktop-nav {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  white-space: nowrap;
  height: 2.25rem;
}

.desktop-nav :deep(.v-btn) {
  height: 2.25rem;
  min-height: 2.25rem;
  /* Beat Vuetify reset `button { font-size: inherit }` so menu <button>s match link items. */
  font-size: var(--v-btn-size);
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

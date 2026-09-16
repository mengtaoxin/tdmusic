import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MusicListView from '../views/MusicListView.vue'
import PlaylistView from '../views/PlaylistView.vue'
import PlaylistDetailView from '../views/PlaylistDetailView.vue'
import ArtistListView from '../views/ArtistListView.vue'
import ArtistAlbumsView from '../views/ArtistAlbumsView.vue'
import ArtistTracksView from '../views/ArtistTracksView.vue'
import ArtistAlbumDetailView from '../views/ArtistAlbumDetailView.vue'
import AlbumListView from '../views/AlbumListView.vue'
import AlbumDetailView from '../views/AlbumDetailView.vue'
import NowPlayingView from '../views/NowPlayingView.vue'
import SearchView from '../views/SearchView.vue'
import SettingsView from '../views/SettingsView.vue'
import ConfigGuidesView from '../views/ConfigGuidesView.vue'
import AboutView from '../views/AboutView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/music',
      name: 'music',
      component: MusicListView,
    },
    {
      path: '/playlists',
      name: 'playlists',
      component: PlaylistView,
    },
    {
      path: '/playlists/:name',
      name: 'playlist',
      component: PlaylistDetailView,
    },
    {
      path: '/artists',
      name: 'artists',
      component: ArtistListView,
    },
    {
      path: '/artists/:name/albums/:album',
      name: 'artist-album',
      component: ArtistAlbumDetailView,
    },
    {
      path: '/artists/:name/albums',
      name: 'artist-albums',
      component: ArtistAlbumsView,
    },
    {
      path: '/artists/:name',
      name: 'artist',
      component: ArtistTracksView,
    },
    {
      path: '/albums/:album',
      name: 'album',
      component: AlbumDetailView,
    },
    {
      path: '/albums',
      name: 'albums',
      component: AlbumListView,
    },
    {
      path: '/now-playing',
      name: 'now-playing',
      component: NowPlayingView,
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/config-guides',
      name: 'config-guides',
      component: ConfigGuidesView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
  ],
})

export default router

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import App from '../App.vue'
import HomeView from '../views/HomeView.vue'
import vuetify from '../plugins/vuetify'

describe('App', () => {
  it('mounts and renders home content', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'home', component: HomeView }],
    })

    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, vuetify],
      },
    })

    expect(wrapper.text()).toContain('tdmusic')
  })
})

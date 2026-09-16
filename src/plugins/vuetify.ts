import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

import '@mdi/font/css/materialdesignicons.css'

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'tdmusicDark',
    themes: {
      tdmusicDark: {
        dark: true,
        colors: {
          background: '#0b1c22',
          surface: '#122830',
          primary: '#1f8a80',
          secondary: '#ffc107',
          accent: '#ffc107',
          error: '#ef5350',
          info: '#4fc3f7',
          success: '#66bb6a',
          warning: '#ffb300',
          'on-background': '#e8f1f0',
          'on-surface': '#e8f1f0',
          'footer-start': '#0d3b3a',
          'footer-mid': '#123d4a',
          'footer-end': '#1a2f38',
          'cover-start': '#0f4c4a',
          'cover-end': '#1b3a45',
        },
        variables: {
          'border-color': '#ffc107',
          'border-opacity': 0.2,
          'page-max-width': '52rem',
          'content-max-width': '40rem',
          'hero-max-width': '28rem',
          'cover-max-width': '16rem',
          'footer-clearance': '88px',
          'home-viewport-offset': '120px',
          'music-list-height': 'calc(100dvh - 12rem)',
          'radius-md': '0.5rem',
          'radius-lg': '1rem',
          'blur-header': '10px',
          'cover-shadow': '0 18px 40px rgba(0, 0, 0, 0.35)',
          'motion-rise': '10px',
          'motion-cover': '8px',
        },
      },
    },
  },
})

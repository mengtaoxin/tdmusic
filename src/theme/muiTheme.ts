import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Theme {
    layout: {
      pageMaxWidth: string
      contentMaxWidth: string
      heroMaxWidth: string
      coverMaxWidth: string
      footerClearance: string
      appBarHeight: string
      homeViewportOffset: string
      musicListHeight: string
      radiusMd: string
      radiusLg: string
      blurHeader: string
      coverShadow: string
      motionRise: string
      motionCover: string
      footerStart: string
      footerMid: string
      footerEnd: string
      coverStart: string
      coverEnd: string
    }
  }
  interface ThemeOptions {
    layout?: Theme['layout']
  }
}

export const muiTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    background: {
      default: '#0b1c22',
      paper: '#122830',
    },
    primary: {
      main: '#1f8a80',
    },
    secondary: {
      main: '#ffc107',
    },
    error: {
      main: '#ef5350',
    },
    info: {
      main: '#4fc3f7',
    },
    success: {
      main: '#66bb6a',
    },
    warning: {
      main: '#ffb300',
    },
    text: {
      primary: '#e8f1f0',
      secondary: 'rgba(232, 241, 240, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  layout: {
    pageMaxWidth: '52rem',
    contentMaxWidth: '40rem',
    heroMaxWidth: '28rem',
    coverMaxWidth: '16rem',
    footerClearance: '88px',
    appBarHeight: '64px',
    homeViewportOffset: '120px',
    musicListHeight: 'calc(100dvh - 64px - 88px - 6rem)',
    radiusMd: '0.5rem',
    radiusLg: '1rem',
    blurHeader: '10px',
    coverShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
    motionRise: '10px',
    motionCover: '8px',
    footerStart: '#0d3b3a',
    footerMid: '#123d4a',
    footerEnd: '#1a2f38',
    coverStart: '#0f4c4a',
    coverEnd: '#1b3a45',
  },
})

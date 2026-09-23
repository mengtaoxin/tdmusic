import { createFileRoute } from '@tanstack/react-router'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import GitHubIcon from '@mui/icons-material/GitHub'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'

import brandIconUrl from '@/assets/brand-icon.png'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

const GITHUB_URL = 'https://github.com/mengtaoxin/tdmusic'

function AboutPage() {
  const { t } = useTranslation()

  return (
    <Container maxWidth={false} sx={{ textAlign: 'center' }}>
      <Box
        component="img"
        src={brandIconUrl}
        width={64}
        height={64}
        alt=""
        sx={{
          display: 'block',
          mx: 'auto',
          mb: 1.5,
          borderRadius: 'var(--td-radius-lg)',
        }}
      />
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        tdmusic
      </Typography>
      <IconButton
        component="a"
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('about.github')}
        color="inherit"
        size="large"
        sx={{ '&:hover': { opacity: 0.8 } }}
      >
        <GitHubIcon fontSize="large" />
      </IconButton>
    </Container>
  )
}

import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import { configGuideMarkdownUrl, renderMarkdown } from '@/lib/configGuideMarkdown'

export const Route = createFileRoute('/config-guides')({
  component: ConfigGuidesPage,
})

function ConfigGuidesPage() {
  const { t, i18n } = useTranslation()
  const [html, setHtml] = useState('')
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadGuide(localeValue: string) {
      setLoading(true)
      setLoadError(false)
      setHtml('')
      try {
        const response = await fetch(configGuideMarkdownUrl(localeValue))
        if (!response.ok) {
          if (!cancelled) setLoadError(true)
          return
        }
        const source = await response.text()
        if (!cancelled) setHtml(renderMarkdown(source))
      } catch {
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadGuide(i18n.language)
    return () => {
      cancelled = true
    }
  }, [i18n.language])

  return (
    <Container maxWidth={false} className="page-narrow">
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            {t('configGuides.loading')}
          </Typography>
        </Box>
      ) : loadError ? (
        <Typography variant="body2" color="error">
          {t('configGuides.loadError')}
        </Typography>
      ) : (
        <Box
          className="guide-md"
          dangerouslySetInnerHTML={{ __html: html }}
          sx={{
            '& h1': {
              fontSize: '1.25rem',
              fontWeight: 500,
              lineHeight: 1.5,
              m: '0 0 1rem',
            },
            '& h2': {
              fontSize: '1rem',
              fontWeight: 500,
              lineHeight: 1.5,
              m: '1.5rem 0 0.5rem',
            },
            '& p': {
              m: '0 0 0.75rem',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            },
            '& ul': {
              m: '0 0 0.75rem',
              pl: '1.25rem',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            },
            '& li': { mb: '0.25rem' },
            '& code': {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85em',
            },
            '& pre': {
              m: '0 0 0.75rem',
              overflowX: 'auto',
              p: '0.75rem 1rem',
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'divider',
              borderRadius: 'var(--td-radius-md)',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            },
            '& pre code': {
              fontSize: 'inherit',
              whiteSpace: 'pre-wrap',
            },
          }}
        />
      )}
    </Container>
  )
}

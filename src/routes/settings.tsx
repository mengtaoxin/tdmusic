import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import { getMusicCacheSizeBytes } from '@/lib/cache/musicCache'
import {
  clearMusicCachesAndRefresh,
  loadCatalogAndHydratePlayer,
} from '@/lib/catalog/catalogBootstrap'
import { clearCachedConfigs } from '@/lib/catalog/loadConfigs'
import { formatBytes } from '@/lib/formatBytes'
import { usePlayerStore } from '@/stores/player'
import { useSettingsStore } from '@/stores/settings'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { t } = useTranslation()
  const configUrl = useSettingsStore((s) => s.configUrl)
  const saveConfigUrl = useSettingsStore((s) => s.saveConfigUrl)
  const clearNowPlaying = usePlayerStore((s) => s.clearNowPlaying)

  const [draftUrl, setDraftUrl] = useState(configUrl)
  const [clearing, setClearing] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [confirmClearConfigsOpen, setConfirmClearConfigsOpen] = useState(false)
  const [cacheSizeBytes, setCacheSizeBytes] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  async function save() {
    saveConfigUrl(draftUrl)
    await loadCatalogAndHydratePlayer()
    setMessage(t('settings.saved'))
  }

  function confirmClearConfigsCache() {
    setConfirmClearConfigsOpen(false)
    clearCachedConfigs()
    clearNowPlaying()
    setMessage(t('settings.configsCacheCleared'))
  }

  async function refreshCacheSize() {
    setCacheSizeBytes(await getMusicCacheSizeBytes())
  }

  async function confirmClearCache() {
    setConfirmClearOpen(false)
    setClearing(true)
    try {
      await clearMusicCachesAndRefresh()
      await refreshCacheSize()
      setMessage(t('settings.cacheCleared'))
    } finally {
      setClearing(false)
    }
  }

  useEffect(() => {
    void refreshCacheSize()
  }, [])

  const settingSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  } as const

  const hintSx = {
    m: 0,
    mb: '1lh',
  } as const

  return (
    <Container maxWidth={false} className="page-narrow">
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {t('nav.settings')}
      </Typography>

      <Box component="section" className="setting" sx={settingSx}>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          {t('settings.configUrl')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={hintSx}>
          {t('settings.configUrlHint')}
        </Typography>
        <Typography variant="body2" sx={hintSx}>
          <Box component={Link} to="/config-guides" sx={{ color: 'secondary.main' }}>
            {t('settings.configGuidesLink')}
          </Box>
        </Typography>
        <TextField
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          fullWidth
          variant="outlined"
          className="setting-field setting-control"
          sx={{ width: '100%' }}
        />
        <Button
          color="primary"
          variant="contained"
          className="setting-control"
          sx={{ mt: '1lh' }}
          onClick={() => void save()}
        >
          {t('settings.save')}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box component="section" className="setting" sx={settingSx}>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          {t('settings.clearConfigsCache')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={hintSx}>
          {t('settings.clearConfigsCacheHint')}
        </Typography>
        <Button
          variant="outlined"
          className="setting-control"
          onClick={() => setConfirmClearConfigsOpen(true)}
        >
          {t('settings.clearConfigsCache')}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box component="section" className="setting" sx={settingSx}>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          {t('settings.clearCache')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={hintSx}>
          {t('settings.clearCacheHint')}
        </Typography>
        {cacheSizeBytes !== null ? (
          <Typography variant="body2" color="text.secondary" sx={hintSx}>
            {t('settings.cacheSize', { size: formatBytes(cacheSizeBytes) })}
          </Typography>
        ) : null}
        <Button
          color="error"
          variant="outlined"
          className="setting-control"
          loading={clearing}
          onClick={() => setConfirmClearOpen(true)}
        >
          {t('settings.clearCache')}
        </Button>
      </Box>

      <Dialog
        open={confirmClearConfigsOpen}
        onClose={() => setConfirmClearConfigsOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('settings.clearConfigsCache')}</DialogTitle>
        <DialogContent>{t('settings.clearConfigsCacheConfirm')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearConfigsOpen(false)}>{t('settings.cancel')}</Button>
          <Button color="primary" variant="outlined" onClick={confirmClearConfigsCache}>
            {t('settings.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('settings.clearCache')}</DialogTitle>
        <DialogContent>{t('settings.clearCacheConfirm')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearOpen(false)}>{t('settings.cancel')}</Button>
          <Button color="error" variant="outlined" onClick={() => void confirmClearCache()}>
            {t('settings.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={message.length > 0}
        autoHideDuration={3000}
        onClose={() => setMessage('')}
        message={message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  )
}

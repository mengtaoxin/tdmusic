import { useCallback, useEffect, useRef, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import MenuIcon from '@mui/icons-material/Menu'
import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import brandIconUrl from '@/assets/brand-icon.png'
import { AppDesktopNav, type DesktopMenuState } from '@/components/nav/AppDesktopNav'
import { AppNavDrawer } from '@/components/nav/AppNavDrawer'
import { FeedbackConfirmDialog } from '@/components/nav/FeedbackConfirmDialog'
import { GITHUB_ISSUES_URL, moreChildPaths } from '@/components/nav/navConfig'
import i18n from '@/i18n'
import { writeStoredLocale, type AppLocale } from '@/lib/locale'
import { shouldCollapseNav } from '@/lib/navLayout'

export function AppHeader() {
  const { t, i18n: i18nInstance } = useTranslation()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [compactNav, setCompactNav] = useState(true)
  const [confirmFeedbackOpen, setConfirmFeedbackOpen] = useState(false)
  const [desktopMenu, setDesktopMenu] = useState<DesktopMenuState>(null)
  const [drawerExpanded, setDrawerExpanded] = useState<Record<string, boolean>>({})

  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const brandRef = useRef<HTMLDivElement | null>(null)
  const desktopNavRef = useRef<HTMLElement | null>(null)

  const locale = (i18nInstance.language?.startsWith('zh') ? 'zh' : 'en') as AppLocale
  const moreGroupActive = moreChildPaths.includes(pathname)

  const updateCompactNav = useCallback(() => {
    const toolbar = toolbarRef.current
    const brand = brandRef.current
    const nav = desktopNavRef.current
    if (!toolbar || !brand || !nav) return
    const availableWidth = toolbar.clientWidth - brand.offsetWidth
    setCompactNav(shouldCollapseNav(nav.scrollWidth, availableWidth))
  }, [])

  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar || typeof ResizeObserver === 'undefined') {
      updateCompactNav()
      return
    }
    const observer = new ResizeObserver(() => {
      updateCompactNav()
    })
    observer.observe(toolbar)
    if (desktopNavRef.current) observer.observe(desktopNavRef.current)
    updateCompactNav()
    return () => observer.disconnect()
  }, [updateCompactNav, locale])

  useEffect(() => {
    setDrawerOpen(false)
    setDesktopMenu(null)
  }, [pathname])

  useEffect(() => {
    const id = requestAnimationFrame(() => updateCompactNav())
    return () => cancelAnimationFrame(id)
  }, [locale, t, updateCompactNav])

  function setLocale(value: AppLocale) {
    writeStoredLocale(value)
    void i18n.changeLanguage(value)
  }

  function confirmOpenFeedback() {
    setConfirmFeedbackOpen(false)
    window.open(GITHUB_ISSUES_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <AppNavDrawer
        open={drawerOpen}
        pathname={pathname}
        locale={locale}
        moreGroupActive={moreGroupActive}
        expanded={drawerExpanded}
        onClose={() => setDrawerOpen(false)}
        onToggleGroup={(key) => {
          setDrawerExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
        }}
        onLocale={setLocale}
        onFeedback={() => setConfirmFeedbackOpen(true)}
      />

      <FeedbackConfirmDialog
        open={confirmFeedbackOpen}
        onClose={() => setConfirmFeedbackOpen(false)}
        onConfirm={confirmOpenFeedback}
      />

      <AppBar
        position="static"
        elevation={0}
        color="transparent"
        className="app-bar"
        sx={{
          borderBottom: (th) =>
            `1px solid color-mix(in srgb, ${th.palette.secondary.main} 20%, transparent)`,
          backdropFilter: `blur(var(--td-blur-header))`,
        }}
      >
        <Toolbar
          ref={toolbarRef}
          className="toolbar-content"
          sx={{ alignItems: 'center', gap: 0.5, minHeight: 64 }}
        >
          <Box
            ref={brandRef}
            className="brand flex-grow-0 flex-shrink-0"
            sx={{
              fontWeight: 700,
              letterSpacing: '0.04em',
              flexGrow: 0,
              flexShrink: 0,
              color: 'secondary.main',
              alignSelf: 'center',
              minWidth: 'max-content',
            }}
          >
            <Box
              component={Link}
              to="/"
              data-testid="brand-title"
              className="brand-mark header-centerline"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                whiteSpace: 'nowrap',
                lineHeight: 1.25,
                height: '2.25rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <Box
                component="img"
                data-testid="brand-icon"
                src={brandIconUrl}
                width={28}
                height={28}
                alt=""
                sx={{ display: 'block', borderRadius: 'var(--td-radius-md)', flexShrink: 0 }}
              />
              tdmusic
              <Box
                component="span"
                data-testid="brand-beta"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ml: 0.25,
                  px: 0.7,
                  py: 0.1,
                  borderRadius: 0.5,
                  fontSize: '0.5rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  color: 'secondary.contrastText',
                  bgcolor: 'rgba(255, 193, 7, 0.85)',
                  flexShrink: 0,
                }}
              >
                {t('nav.beta')}
              </Box>
            </Box>
          </Box>

          {compactNav ? (
            <IconButton
              data-testid="nav-menu-toggle"
              className="header-centerline"
              aria-label={t('nav.openMenu')}
              onClick={() => setDrawerOpen((open) => !open)}
              sx={{ alignSelf: 'center', width: '2.25rem', height: '2.25rem' }}
            >
              <MenuIcon />
            </IconButton>
          ) : null}

          <Box sx={{ flex: 1 }} />

          <AppDesktopNav
            pathname={pathname}
            locale={locale}
            compactNav={compactNav}
            moreGroupActive={moreGroupActive}
            desktopMenu={desktopMenu}
            setDesktopMenu={setDesktopMenu}
            navRef={(node) => {
              desktopNavRef.current = node
            }}
            onLocale={setLocale}
            onFeedback={() => setConfirmFeedbackOpen(true)}
          />
        </Toolbar>
      </AppBar>
    </>
  )
}

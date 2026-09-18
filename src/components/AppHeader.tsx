import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import AlbumIcon from '@mui/icons-material/Album'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic'
import MenuIcon from '@mui/icons-material/Menu'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'
import PersonIcon from '@mui/icons-material/Person'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import SearchIcon from '@mui/icons-material/Search'
import SettingsIcon from '@mui/icons-material/Settings'
import TranslateIcon from '@mui/icons-material/Translate'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { SvgIconComponent } from '@mui/icons-material'

import brandIconUrl from '@/assets/brand-icon.png'
import i18n from '@/i18n'
import { writeStoredLocale, type AppLocale } from '@/lib/locale'
import { shouldCollapseNav } from '@/lib/navLayout'

const GITHUB_ISSUES_URL = 'https://github.com/mengtaoxin/tdmusic/issues'

type NavRouteLink = { to: string; key: string; Icon: SvgIconComponent }
type NavActionLink = { action: 'feedback'; key: string; Icon: SvgIconComponent }
type NavLocaleLink = { locale: AppLocale; key: string; Icon: SvgIconComponent }
type NavLink = NavRouteLink | NavActionLink | NavLocaleLink
type NavGroup = {
  key: string
  Icon: SvgIconComponent
  children: readonly NavLink[]
  menuTestId: string
}
type NavItem = NavRouteLink | NavGroup

function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item
}

function isActionNavLink(item: NavLink): item is NavActionLink {
  return 'action' in item
}

function isLocaleNavLink(item: NavLink): item is NavLocaleLink {
  return 'locale' in item
}

const moreChildren: readonly NavLink[] = [
  { to: '/search', key: 'nav.search', Icon: SearchIcon },
  { to: '/settings', key: 'nav.settings', Icon: SettingsIcon },
  { to: '/config-guides', key: 'nav.configGuides', Icon: DescriptionOutlinedIcon },
  { to: '/about', key: 'nav.about', Icon: InfoOutlinedIcon },
  { to: '/logs', key: 'nav.logs', Icon: NotesOutlinedIcon },
  { action: 'feedback', key: 'nav.feedback', Icon: FeedbackOutlinedIcon },
]

const localeChildren: readonly NavLocaleLink[] = [
  { locale: 'en', key: 'locale.en', Icon: TranslateIcon },
  { locale: 'zh', key: 'locale.zh', Icon: TranslateIcon },
]

const navItems: readonly NavItem[] = [
  { to: '/now-playing', key: 'nav.nowPlaying', Icon: PlayCircleIcon },
  { to: '/music', key: 'nav.musicList', Icon: LibraryMusicIcon },
  { to: '/playlists', key: 'nav.playlist', Icon: QueueMusicIcon },
  { to: '/artists', key: 'nav.artistList', Icon: PersonIcon },
  { to: '/albums', key: 'nav.albumList', Icon: AlbumIcon },
  {
    key: 'nav.language',
    Icon: TranslateIcon,
    children: localeChildren,
    menuTestId: 'nav-locale',
  },
  { key: 'nav.more', Icon: MoreHorizIcon, children: moreChildren, menuTestId: 'nav-more' },
]

const moreChildPaths: readonly string[] = moreChildren.flatMap((item) =>
  isActionNavLink(item) || isLocaleNavLink(item) ? [] : [item.to],
)

type DesktopMenuState = { id: string; anchor: HTMLElement } | null

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
    // Remeasure after locale labels change width.
    const id = requestAnimationFrame(() => updateCompactNav())
    return () => cancelAnimationFrame(id)
  }, [locale, t, updateCompactNav])

  function setLocale(value: AppLocale) {
    writeStoredLocale(value)
    void i18n.changeLanguage(value)
  }

  function openFeedbackConfirm() {
    setConfirmFeedbackOpen(true)
  }

  function confirmOpenFeedback() {
    setConfirmFeedbackOpen(false)
    window.open(GITHUB_ISSUES_URL, '_blank', 'noopener,noreferrer')
  }

  function groupActive(item: NavGroup): boolean {
    if (item.key === 'nav.more') return moreGroupActive
    return false
  }

  function toggleDrawerGroup(key: string) {
    setDrawerExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function renderDesktopChild(child: NavLink): ReactNode {
    if (isLocaleNavLink(child)) {
      return (
        <MenuItem
          key={child.key}
          data-testid={`locale-option-${child.locale}`}
          selected={locale === child.locale}
          onClick={() => {
            setLocale(child.locale)
            setDesktopMenu(null)
          }}
        >
          <ListItemIcon>
            <child.Icon fontSize="small" />
          </ListItemIcon>
          {t(child.key)}
        </MenuItem>
      )
    }
    if (isActionNavLink(child)) {
      return (
        <MenuItem
          key={child.key}
          data-testid="nav-feedback"
          onClick={() => {
            setDesktopMenu(null)
            openFeedbackConfirm()
          }}
        >
          <ListItemIcon>
            <child.Icon fontSize="small" />
          </ListItemIcon>
          {t(child.key)}
        </MenuItem>
      )
    }
    return (
      <MenuItem key={child.key} component={Link} to={child.to} onClick={() => setDesktopMenu(null)}>
        <ListItemIcon>
          <child.Icon fontSize="small" />
        </ListItemIcon>
        {t(child.key)}
      </MenuItem>
    )
  }

  function renderDrawerChild(child: NavLink): ReactNode {
    if (isLocaleNavLink(child)) {
      return (
        <ListItemButton
          key={child.key}
          data-testid={`locale-option-${child.locale}`}
          selected={locale === child.locale}
          sx={{ pl: 4 }}
          onClick={() => {
            setLocale(child.locale)
            setDrawerOpen(false)
          }}
        >
          <ListItemIcon>
            <child.Icon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t(child.key)} />
        </ListItemButton>
      )
    }
    if (isActionNavLink(child)) {
      return (
        <ListItemButton
          key={child.key}
          data-testid="nav-feedback"
          sx={{ pl: 4 }}
          onClick={() => {
            setDrawerOpen(false)
            openFeedbackConfirm()
          }}
        >
          <ListItemIcon>
            <child.Icon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t(child.key)} />
        </ListItemButton>
      )
    }
    return (
      <ListItemButton
        key={child.key}
        component={Link}
        to={child.to}
        sx={{ pl: 4 }}
        selected={pathname === child.to}
        onClick={() => setDrawerOpen(false)}
      >
        <ListItemIcon>
          <child.Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t(child.key)} />
      </ListItemButton>
    )
  }

  return (
    <>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        anchor="left"
        keepMounted
        className="nav-drawer"
        slotProps={{
          paper: {
            sx: {
              width: 280,
              borderInlineEnd: (th) =>
                `1px solid color-mix(in srgb, ${th.palette.secondary.main} 20%, transparent)`,
            },
          },
        }}
      >
        <Box data-testid="nav-drawer" sx={{ height: '100%' }}>
          <List dense component="nav" sx={{ pt: 1 }}>
            {navItems.map((item) => {
              if (isNavGroup(item)) {
                const open = Boolean(drawerExpanded[item.key])
                return (
                  <Box key={item.key} className="v-list-group">
                    <ListItemButton
                      className="v-list-group__header"
                      selected={groupActive(item)}
                      onClick={() => toggleDrawerGroup(item.key)}
                    >
                      <ListItemIcon>
                        <item.Icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t(item.key)} />
                      {open ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                      <List dense disablePadding>
                        {item.children.map((child) => renderDrawerChild(child))}
                      </List>
                    </Collapse>
                  </Box>
                )
              }
              return (
                <ListItemButton
                  key={item.key}
                  component={Link}
                  to={item.to}
                  selected={pathname === item.to}
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemIcon>
                    <item.Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t(item.key)} />
                </ListItemButton>
              )
            })}
          </List>
        </Box>
      </Drawer>

      <Dialog
        open={confirmFeedbackOpen}
        onClose={() => setConfirmFeedbackOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('nav.feedback')}</DialogTitle>
        <DialogContent>{t('nav.feedbackConfirm')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmFeedbackOpen(false)}>{t('settings.cancel')}</Button>
          <Button color="primary" variant="contained" onClick={confirmOpenFeedback}>
            {t('settings.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

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
                className="brand-icon"
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
                className="brand-beta"
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

          <Box
            component="nav"
            ref={desktopNavRef}
            data-testid="desktop-nav"
            className={`desktop-nav header-centerline${compactNav ? ' desktop-nav--measure' : ''}`}
            aria-hidden={compactNav ? true : undefined}
            sx={{
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              height: '2.25rem',
              gap: 0.5,
              ...(compactNav
                ? {
                    position: 'absolute',
                    visibility: 'hidden',
                    pointerEvents: 'none',
                  }
                : {}),
            }}
          >
            {navItems.map((item) => {
              if (isNavGroup(item)) {
                const menuId = `${item.menuTestId}-${pathname}`
                const open = desktopMenu?.id === menuId
                return (
                  <Box key={menuId}>
                    <Button
                      data-testid={`${item.menuTestId}-toggle`}
                      size="small"
                      variant="text"
                      color="inherit"
                      startIcon={<item.Icon fontSize="small" />}
                      tabIndex={compactNav ? -1 : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? 'true' : undefined}
                      onClick={(event) =>
                        setDesktopMenu(open ? null : { id: menuId, anchor: event.currentTarget })
                      }
                      sx={{
                        height: '2.25rem',
                        minHeight: '2.25rem',
                        textTransform: 'none',
                        ...(groupActive(item) ? { color: 'primary.main' } : {}),
                      }}
                    >
                      {t(item.key)}
                    </Button>
                    <Menu
                      key={menuId}
                      anchorEl={open ? desktopMenu.anchor : null}
                      open={open}
                      onClose={() => setDesktopMenu(null)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      transitionDuration={150}
                      slotProps={{
                        paper: {
                          'data-testid': `${item.menuTestId}-menu`,
                        } as { 'data-testid': string },
                        list: {
                          dense: true,
                          sx: { minWidth: 160 },
                        },
                      }}
                    >
                      {item.children.map((child) => renderDesktopChild(child))}
                    </Menu>
                  </Box>
                )
              }
              return (
                <Button
                  key={item.key}
                  component={Link}
                  to={item.to}
                  size="small"
                  variant="text"
                  color="inherit"
                  startIcon={<item.Icon fontSize="small" />}
                  tabIndex={compactNav ? -1 : undefined}
                  sx={{
                    height: '2.25rem',
                    minHeight: '2.25rem',
                    textTransform: 'none',
                    ...(pathname === item.to ? { color: 'primary.main' } : {}),
                  }}
                >
                  {t(item.key)}
                </Button>
              )
            })}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  )
}

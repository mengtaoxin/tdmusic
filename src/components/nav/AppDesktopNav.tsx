import type { Dispatch, ReactNode, SetStateAction } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import type { AppLocale } from '@/lib/locale'
import {
  isActionNavLink,
  isLocaleNavLink,
  isNavGroup,
  navItems,
  type NavGroup,
  type NavLink,
} from '@/components/nav/navConfig'

export type DesktopMenuState = { id: string; anchor: HTMLElement } | null

export type AppDesktopNavProps = {
  pathname: string
  locale: AppLocale
  compactNav: boolean
  moreGroupActive: boolean
  desktopMenu: DesktopMenuState
  setDesktopMenu: Dispatch<SetStateAction<DesktopMenuState>>
  navRef: (node: HTMLElement | null) => void
  onLocale: (locale: AppLocale) => void
  onFeedback: () => void
}

export function AppDesktopNav({
  pathname,
  locale,
  compactNav,
  moreGroupActive,
  desktopMenu,
  setDesktopMenu,
  navRef,
  onLocale,
  onFeedback,
}: AppDesktopNavProps) {
  const { t } = useTranslation()

  function groupActive(item: NavGroup): boolean {
    return item.key === 'nav.more' ? moreGroupActive : false
  }

  function renderChild(child: NavLink): ReactNode {
    if (isLocaleNavLink(child)) {
      return (
        <MenuItem
          key={child.key}
          data-testid={`locale-option-${child.locale}`}
          selected={locale === child.locale}
          onClick={() => {
            onLocale(child.locale)
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
            onFeedback()
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

  return (
    <Box
      component="nav"
      ref={navRef}
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
                {item.children.map((child) => renderChild(child))}
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
  )
}

import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
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

export type AppNavDrawerProps = {
  open: boolean
  pathname: string
  locale: AppLocale
  moreGroupActive: boolean
  expanded: Record<string, boolean>
  onClose: () => void
  onToggleGroup: (key: string) => void
  onLocale: (locale: AppLocale) => void
  onFeedback: () => void
}

export function AppNavDrawer({
  open,
  pathname,
  locale,
  moreGroupActive,
  expanded,
  onClose,
  onToggleGroup,
  onLocale,
  onFeedback,
}: AppNavDrawerProps) {
  const { t } = useTranslation()

  function groupActive(item: NavGroup): boolean {
    return item.key === 'nav.more' ? moreGroupActive : false
  }

  function renderChild(child: NavLink): ReactNode {
    if (isLocaleNavLink(child)) {
      return (
        <ListItemButton
          key={child.key}
          data-testid={`locale-option-${child.locale}`}
          selected={locale === child.locale}
          sx={{ pl: 4 }}
          onClick={() => {
            onLocale(child.locale)
            onClose()
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
            onClose()
            onFeedback()
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
        onClick={onClose}
      >
        <ListItemIcon>
          <child.Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t(child.key)} />
      </ListItemButton>
    )
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
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
              const groupOpen = Boolean(expanded[item.key])
              return (
                <Box key={item.key} className="v-list-group">
                  <ListItemButton
                    className="v-list-group__header"
                    selected={groupActive(item)}
                    onClick={() => onToggleGroup(item.key)}
                  >
                    <ListItemIcon>
                      <item.Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t(item.key)} />
                    {groupOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  <Collapse in={groupOpen} timeout="auto" unmountOnExit>
                    <List dense disablePadding>
                      {item.children.map((child) => renderChild(child))}
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
                onClick={onClose}
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
  )
}

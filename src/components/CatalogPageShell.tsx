import type { ReactNode } from 'react'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

const fillSx = {
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
} as const

export type CatalogPageShellProps = {
  title: ReactNode
  className?: string
  loading?: boolean
  headerExtra?: ReactNode
  children: ReactNode
}

/** Locked-height catalog page chrome (title + optional alerts + loading/list). */
export function CatalogPageShell({
  title,
  className,
  loading = false,
  headerExtra,
  children,
}: CatalogPageShellProps) {
  return (
    <Container maxWidth={false} className={className ? `page ${className}` : 'page'} sx={fillSx}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {headerExtra}
      {loading ? <LinearProgress sx={{ mb: 2 }} /> : children}
    </Container>
  )
}

import type { ReactNode } from 'react';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';

const fillSx = {
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
} as const;

export type CatalogPageShellProps = {
  className?: string;
  loading?: boolean;
  headerExtra?: ReactNode;
  children: ReactNode;
};

/** Locked-height catalog page chrome (optional alerts + loading/list). */
export function CatalogPageShell({
  className,
  loading = false,
  headerExtra,
  children,
}: CatalogPageShellProps) {
  return (
    <Container maxWidth={false} className={className ? `page ${className}` : 'page'} sx={fillSx}>
      {headerExtra}
      {loading ? <LinearProgress sx={{ mb: 2 }} /> : children}
    </Container>
  );
}

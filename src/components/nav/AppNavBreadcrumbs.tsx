import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { localizeAlbumName, localizeArtistName } from '@/lib/catalog/displayLabels';
import { resolveNavBreadcrumbs } from '@/lib/navBreadcrumbs';
import { findPlaylistById, playlistLabel } from '@/lib/routes/playlistRoutes';
import { useCatalogStore } from '@/stores/catalog';

export type AppNavBreadcrumbsProps = {
  pathname: string;
};

export function AppNavBreadcrumbs({ pathname }: AppNavBreadcrumbsProps) {
  const { t } = useTranslation();
  const playlists = useCatalogStore((s) => s.playlists);

  const crumbs = resolveNavBreadcrumbs(pathname, {
    t,
    playlistLabel: (id) => {
      const playlist = findPlaylistById(playlists, id);
      return playlist ? playlistLabel(playlist) : id;
    },
    localizeArtist: (name) => localizeArtistName(name, t),
    localizeAlbum: (name) => localizeAlbumName(name, t),
  });

  if (crumbs.length === 0) return null;

  return (
    <Box
      component="nav"
      data-testid="nav-breadcrumbs"
      aria-label={t('nav.breadcrumbs')}
      className="header-centerline"
      sx={{
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        ml: 1.5,
        gap: 0.75,
        color: 'text.secondary',
      }}
    >
      {crumbs.map((crumb, index) => (
        <Box
          key={crumbs.slice(0, index + 1).join('\0')}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}
        >
          {index > 0 ? (
            <Typography
              component="span"
              variant="body2"
              aria-hidden
              sx={{ color: 'text.disabled', flexShrink: 0 }}
            >
              /
            </Typography>
          ) : null}
          <Typography
            component="span"
            variant="body2"
            noWrap
            aria-current={index === crumbs.length - 1 ? 'page' : undefined}
            sx={{
              fontWeight: index === crumbs.length - 1 ? 600 : 400,
              color: index === crumbs.length - 1 ? 'text.primary' : 'text.secondary',
            }}
          >
            {crumb}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

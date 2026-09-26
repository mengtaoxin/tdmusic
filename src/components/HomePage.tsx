import { Link } from '@tanstack/react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import brandIconUrl from '@/assets/brand-icon.png';

export function HomePage() {
  const { t } = useTranslation();

  return (
    <Container
      maxWidth={false}
      sx={{
        minHeight: '100%',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          maxWidth: (theme) => theme.layout.heroMaxWidth,
          animation: 'td-album-rise 0.5s ease',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        <Box
          component="img"
          src={brandIconUrl}
          width={48}
          height={48}
          alt=""
          sx={{
            display: 'block',
            mx: 'auto',
            mb: 1.5,
            borderRadius: 'var(--td-radius-lg)',
          }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            mb: 1.5,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
          }}
        >
          tdmusic
        </Typography>
        <Typography variant="h4" component="h1" sx={{ mb: 1.5 }}>
          {t('home.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {t('home.lead')}
        </Typography>
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            p: 0,
            m: 0,
            mb: 'calc((1lh - 1em) / 2 + 0.5rem)',
            display: 'grid',
            gap: 1,
            typography: 'body2',
            color: 'text.secondary',
          }}
        >
          <li>{t('home.pointPlay')}</li>
          <li>{t('home.pointBrowse')}</li>
        </Box>
        <Button component={Link} to="/music" color="secondary" variant="contained">
          {t('home.cta')}
        </Button>
      </Box>
    </Container>
  );
}

import type { SvgIconComponent } from '@mui/icons-material';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import WifiOffOutlinedIcon from '@mui/icons-material/WifiOffOutlined';
import { Link } from '@tanstack/react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import brandIconUrl from '@/assets/brand-icon.png';
import { ConfigJsonSample } from '@/components/ConfigJsonSample';

const FEATURES: { icon: SvgIconComponent; key: string }[] = [
  { icon: CloudOffOutlinedIcon, key: 'noServer' },
  { icon: LockPersonOutlinedIcon, key: 'yourData' },
  { icon: WifiOffOutlinedIcon, key: 'offline' },
];

export function HomePage() {
  const { t } = useTranslation();

  return (
    <Container maxWidth={false} className="page" sx={{ pb: 6 }}>
      <Box
        sx={{
          mb: 4,
          animation: 'td-album-rise 0.5s ease',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
          <Box
            component="img"
            src={brandIconUrl}
            width={32}
            height={32}
            alt=""
            sx={{ display: 'block', borderRadius: 'var(--td-radius-md)' }}
          />
          <Typography variant="overline" component="p" color="secondary" sx={{ fontWeight: 600 }}>
            {t('home.eyebrow')}
          </Typography>
        </Stack>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, mb: 1.5, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
        >
          {t('home.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '62ch' }}>
          {t('home.lead')}
        </Typography>
      </Box>

      <ConfigJsonSample />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4, mb: 6 }}>
        <Button component={Link} to="/music" color="secondary" variant="contained" size="large">
          {t('home.cta')}
        </Button>
        <Button
          component={Link}
          to="/config-guides"
          color="secondary"
          variant="outlined"
          size="large"
        >
          {t('home.writeConfig')}
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {FEATURES.map(({ icon: Icon, key }) => (
          <Grid key={key} size={{ xs: 12, sm: 4 }}>
            <Stack spacing={1}>
              <Icon color="secondary" sx={{ fontSize: 32 }} />
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
                {t(`home.features.${key}.title`)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(`home.features.${key}.description`)}
              </Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

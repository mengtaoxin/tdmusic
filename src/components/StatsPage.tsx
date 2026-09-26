import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import { localizeArtistName } from '@/lib/catalog/displayLabels'
import {
  getPlayCountStats,
  type PlayCountRow,
  type PlayStatsRangeDays,
} from '@/lib/playback/playHistory'
import { useCatalogStore } from '@/stores/catalog'

const RANGE_OPTIONS: readonly PlayStatsRangeDays[] = [3, 7, 30]

export function StatsPage() {
  const { t } = useTranslation()
  const trackById = useCatalogStore((s) => s.snapshot.trackById)
  const [rangeDays, setRangeDays] = useState<PlayStatsRangeDays>(7)
  const [rows, setRows] = useState<PlayCountRow[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    void getPlayCountStats(rangeDays).then((next) => {
      if (cancelled) return
      setRows(next)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [rangeDays])

  return (
    <Container maxWidth={false} data-testid="stats-page" className="page-narrow">
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {t('nav.stats')}
      </Typography>

      <ToggleButtonGroup
        exclusive
        size="small"
        color="primary"
        value={rangeDays}
        onChange={(_event, value: PlayStatsRangeDays | null) => {
          if (value != null) setRangeDays(value)
        }}
        aria-label={t('stats.rangeLabel')}
        sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}
      >
        {RANGE_OPTIONS.map((days) => (
          <ToggleButton key={days} value={days} data-testid={`stats-range-${days}`}>
            {t(`stats.range${days}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {!loaded ? null : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('stats.empty')}
        </Typography>
      ) : (
        <List disablePadding>
          {rows.map((row) => {
            const track = trackById.get(row.trackId)
            const title = track?.displayTitle ?? row.trackId
            const artist = track
              ? localizeArtistName(track.displayArtist, t)
              : t('player.unknownArtist')
            return (
              <ListItem
                key={row.trackId}
                data-testid={`stats-row-${row.trackId}`}
                divider
                sx={{ px: 0, gap: 2 }}
              >
                <ListItemText
                  primary={title}
                  secondary={artist}
                  slotProps={{
                    primary: { noWrap: true },
                    secondary: { noWrap: true },
                  }}
                />
                <Box
                  component="span"
                  data-testid={`stats-count-${row.trackId}`}
                  sx={{
                    typography: 'body2',
                    color: 'text.secondary',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}
                >
                  {t('stats.playCount', { count: row.playCount })}
                </Box>
              </ListItem>
            )
          })}
        </List>
      )}
    </Container>
  )
}

import { describe, expect, it } from 'vitest'

import { muiTheme } from '@/theme/muiTheme'

describe('muiTheme', () => {
  it('does not force Button labels to uppercase', () => {
    expect(muiTheme.components?.MuiButton?.styleOverrides?.root).toMatchObject({
      textTransform: 'none',
    })
  })
})

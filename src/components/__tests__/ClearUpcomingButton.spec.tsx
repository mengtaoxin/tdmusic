import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'

import { ClearUpcomingButton } from '@/components/ClearUpcomingButton'
import { renderWithProviders } from '@/__tests__/renderWithProviders'

describe('ClearUpcomingButton', () => {
  it('renders Clear upcoming without forcing uppercase', () => {
    renderWithProviders(<ClearUpcomingButton onClick={() => {}} />)

    const button = screen.getByTestId('clear-upcoming')
    expect(button).toHaveTextContent('Clear upcoming')
    expect(button).toHaveStyle({ textTransform: 'none' })
  })
})

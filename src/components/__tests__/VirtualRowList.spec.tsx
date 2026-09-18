import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { VirtualRowList } from '@/components/VirtualRowList'

describe('VirtualRowList', () => {
  it('renders rows inside a measured scroller of the given height', () => {
    const items = ['one', 'two', 'three']
    render(
      <VirtualRowList
        items={items}
        itemHeight={64}
        height={192}
        listClassName="track-list"
        getItemKey={(item) => item}
        renderRow={(item) => <div>{item}</div>}
      />,
    )

    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
    expect(screen.getByText('three')).toBeInTheDocument()
    const scroller = document.querySelector('.track-list')
    expect(scroller).toHaveStyle({ height: '192px' })
  })
})

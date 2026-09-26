import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { VirtualRowList } from '@/components/VirtualRowList';

describe('VirtualRowList', () => {
  it('renders rows inside a measured scroller of the given height', () => {
    const items = ['one', 'two', 'three'];
    render(
      <VirtualRowList
        items={items}
        itemHeight={64}
        height={192}
        listClassName="track-list"
        getItemKey={(item) => item}
        renderRow={(item) => <div>{item}</div>}
      />,
    );

    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
    expect(screen.getByText('three')).toBeInTheDocument();
    const scroller = document.querySelector('.track-list');
    expect(scroller).toHaveStyle({ height: '192px' });
  });

  it('scrolls so scrollToIndex is the first visible row', async () => {
    const items = Array.from({ length: 20 }, (_, i) => `row-${i}`);
    render(
      <VirtualRowList
        items={items}
        itemHeight={64}
        height={192}
        scrollToIndex={5}
        listClassName="track-list"
        getItemKey={(item) => item}
        renderRow={(item) => <div>{item}</div>}
      />,
    );

    const scroller = document.querySelector('.track-list');
    expect(scroller).toBeInstanceOf(HTMLElement);
    await waitFor(() => {
      expect((scroller as HTMLElement).scrollTop).toBe(320);
    });
  });
});

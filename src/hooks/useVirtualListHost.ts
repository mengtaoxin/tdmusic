import { useEffect, useRef, useState } from 'react';

/** ResizeObserver height (and optional width) for virtual list hosts. */
export function useVirtualListHost(options?: { observeWidth?: boolean }) {
  const listHostRef = useRef<HTMLDivElement | null>(null);
  const [hostHeight, setHostHeight] = useState(0);
  const [hostWidth, setHostWidth] = useState(0);

  useEffect(() => {
    const el = listHostRef.current;
    if (!el) return;

    const update = () => {
      setHostHeight(el.clientHeight);
      if (options?.observeWidth) setHostWidth(el.clientWidth);
    };
    update();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.observeWidth]);

  return { listHostRef, hostHeight, hostWidth };
}

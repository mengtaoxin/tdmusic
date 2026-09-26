import { describe, expect, it } from 'vitest';

import { decodeRouteParam } from '../routeParams';

describe('decodeRouteParam', () => {
  it('decodes an encoded route param', () => {
    expect(decodeRouteParam('Artist%201')).toBe('Artist 1');
  });

  it('returns the raw value when decoding fails', () => {
    expect(decodeRouteParam('%E0%A4%A')).toBe('%E0%A4%A');
  });
});

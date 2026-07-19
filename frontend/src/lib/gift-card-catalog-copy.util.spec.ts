import { describe, expect, it } from 'vitest';
import { resolveGiftCardCatalogSubtitleKey } from './gift-card-catalog-copy.util';

describe('resolveGiftCardCatalogSubtitleKey (e2e-bug.58)', () => {
  it.each([
    {
      id: 'physical-on',
      enabled: true,
      expected: 'public.giftCards.subtitle',
    },
    {
      id: 'physical-off',
      enabled: false,
      expected: 'public.giftCards.subtitleDigitalOnly',
    },
  ] as const)('$id', ({ enabled, expected }) => {
    expect(resolveGiftCardCatalogSubtitleKey(enabled)).toBe(expected);
  });
});

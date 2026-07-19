import { describe, expect, it } from 'vitest';
import { resolveGiftCardCatalogSubtitle } from './gift-card-copy.util.js';

describe('resolveGiftCardCatalogSubtitle (e2e-bug.58)', () => {
  const copy = {
    giftCardSubtitle: 'digital or physical delivery',
    giftCardSubtitleDigitalOnly: 'delivered digitally',
  };

  it('uses physical-inclusive copy when physical delivery is enabled', () => {
    expect(resolveGiftCardCatalogSubtitle(copy, true)).toBe(
      'digital or physical delivery',
    );
  });

  it('uses digital-only copy when physical delivery is off', () => {
    expect(resolveGiftCardCatalogSubtitle(copy, false)).toBe(
      'delivered digitally',
    );
  });
});

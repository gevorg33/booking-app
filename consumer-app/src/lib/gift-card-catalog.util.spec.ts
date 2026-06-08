import { describe, expect, it } from 'vitest';
import {
  buildGiftCardCheckoutSearchParams,
  canContinueGiftCardCatalog,
  formatGiftCardCancelWindow,
  resolveGiftCardAvailableTypes,
  sumSelectedGiftCardServices,
} from './gift-card-catalog.util.js';
import { GIFT_CARD_CATALOG_SETTINGS, GIFT_CARD_CONTINUE_SCENARIOS } from './gift-card.fixtures.js';

describe('gift-card-catalog.util', () => {
  it('resolves available catalog types', () => {
    expect(resolveGiftCardAvailableTypes(GIFT_CARD_CATALOG_SETTINGS)).toEqual([
      'monetary',
      'service',
      'bundle',
    ]);
  });

  it.each(GIFT_CARD_CONTINUE_SCENARIOS)('canContinueGiftCardCatalog $id', (scenario) => {
    expect(canContinueGiftCardCatalog(scenario)).toBe(scenario.expect);
  });

  it('builds checkout search params for multi-service gift', () => {
    const params = buildGiftCardCheckoutSearchParams({
      cardType: 'service',
      amount: '',
      selectedServiceIds: ['a', 'b'],
      bundleId: '',
      packageId: '',
      subscriptionPlanId: '',
    });
    expect(params.get('cardType')).toBe('service');
    expect(params.get('serviceIds')).toBe('a,b');
  });

  it('sums selected service prices', () => {
    const map = new Map([['a', 30], ['b', 20]]);
    expect(sumSelectedGiftCardServices(['a', 'b'], map)).toBe(50);
  });

  it('formats cancel window remaining', () => {
    expect(formatGiftCardCancelWindow(0)).toBe('');
    expect(formatGiftCardCancelWindow(90 * 60 * 1000)).toContain('h');
  });
});

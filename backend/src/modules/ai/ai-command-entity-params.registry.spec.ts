import {
  SHARED_ENTITY_CROSS_STEP_KEYS,
  SHARED_ENTITY_SESSION_INHERIT_KEYS,
  getSharedParamsForIntent,
  intentAcceptsSharedParam,
  listIntentsForSharedParam,
} from './ai-command-entity-params.registry.js';
import { SHARED_ENTITY_PARAM_IDS } from './ai-command-entity-params.types.js';

describe('ai-command-entity-params.registry', () => {
  it('exports session and cross-step key lists', () => {
    expect(SHARED_ENTITY_PARAM_IDS).toHaveLength(12);
    expect(SHARED_ENTITY_CROSS_STEP_KEYS).toContain('packageId');
    expect(SHARED_ENTITY_SESSION_INHERIT_KEYS).toEqual(
      SHARED_ENTITY_CROSS_STEP_KEYS,
    );
  });

  it('maps shared params to booking and catalog intents', () => {
    expect(
      getSharedParamsForIntent('cancel_package_visit').has('packagePurchaseId'),
    ).toBe(true);
    expect(
      getSharedParamsForIntent('cancel_package_visit').has('packageId'),
    ).toBe(true);
    expect(intentAcceptsSharedParam('book_package', 'packageId')).toBe(true);
    expect(intentAcceptsSharedParam('mark_paid', 'paymentMethod')).toBe(true);
    expect(
      intentAcceptsSharedParam('bulk_create_catalog', 'categoryDraft'),
    ).toBe(true);
    expect(intentAcceptsSharedParam('list_bookings', 'locationId')).toBe(true);
    expect(intentAcceptsSharedParam('create_booking', 'packageId')).toBe(false);
    expect(getSharedParamsForIntent('book_with_gift_card')).toEqual(
      new Set(['giftCardCode', 'paymentMethod']),
    );
    expect(getSharedParamsForIntent('not_real')).toEqual(new Set());
  });

  it('lists intents per shared param', () => {
    expect(listIntentsForSharedParam('multiServiceGroupId')).toContain(
      'book_multi_service',
    );
    expect(listIntentsForSharedParam('packageId')).toContain('book_package');
    expect(listIntentsForSharedParam('categoryDraft')).toEqual([
      'bulk_create_catalog',
    ]);
    expect(listIntentsForSharedParam('not_a_param' as any)).toEqual([]);
  });
});

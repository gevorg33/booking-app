import {
  E2E10_ACCOUNT_ID_CASES,
  E2E10_SETTINGS_CASES,
} from './e2e10-stripe-connect.fixtures.js';
import {
  getBusinessStripeIntegration,
  isValidConnectAccountId,
} from './stripe-integration.types.js';

describe('stripe-integration.types (e2e-bug.10)', () => {
  it.each(E2E10_SETTINGS_CASES)(
    'getBusinessStripeIntegration $id → ready=$expectReady',
    ({ settings, expectReady, expectAccountId }) => {
      const integration = getBusinessStripeIntegration(settings);
      expect(Boolean(integration.connectAccountId)).toBe(expectReady);
      expect(integration.connectAccountId ?? null).toBe(expectAccountId);
    },
  );

  it.each(E2E10_ACCOUNT_ID_CASES)(
    'isValidConnectAccountId $id → $valid',
    ({ value, valid }) => {
      expect(isValidConnectAccountId(value)).toBe(valid);
    },
  );
});

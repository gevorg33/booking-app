import {
  PROVIDER_RETAIL_POS_ELIGIBILITY_SCENARIOS,
  PROVIDER_RETAIL_POS_CATALOG_FIXTURE,
  PROVIDER_RETAIL_POS_FILTER_SCENARIOS,
  PROVIDER_RETAIL_POS_QUICK_ADD_SCENARIOS,
} from './provider-retail-pos.fixtures.js';
import {
  buildProviderRetailCartBlockedReason,
  canProviderSaveRetailCart,
  filterRetailProductsBySearchQuery,
  isProviderRetailPosEnabled,
  resolveQuickAddRetailProduct,
} from './provider-retail-pos.util.js';

describe('provider-retail-pos.util', () => {
  it.each(PROVIDER_RETAIL_POS_ELIGIBILITY_SCENARIOS.map((s) => [s.id, s]))(
    'evaluates retail eligibility for %s',
    (_id, scenario) => {
      expect(
        isProviderRetailPosEnabled(scenario.configuredRetailProductCount > 0),
      ).toBe(scenario.expectedEnabled);
      expect(canProviderSaveRetailCart(scenario.bookingStatus)).toBe(
        scenario.expectedCanSave,
      );
      if (!scenario.expectedCanSave) {
        expect(
          buildProviderRetailCartBlockedReason(scenario.bookingStatus),
        ).toContain('cancelled');
      } else {
        expect(
          buildProviderRetailCartBlockedReason(scenario.bookingStatus),
        ).toBeNull();
      }
    },
  );

  it.each(PROVIDER_RETAIL_POS_FILTER_SCENARIOS.map((s) => [s.id, s]))(
    'filters retail catalog for %s',
    (_id, scenario) => {
      const filtered = filterRetailProductsBySearchQuery(
        PROVIDER_RETAIL_POS_CATALOG_FIXTURE,
        scenario.query,
      );
      expect(filtered.map((product) => product.id)).toEqual(scenario.expectedIds);
    },
  );

  it.each(PROVIDER_RETAIL_POS_QUICK_ADD_SCENARIOS.map((s) => [s.id, s]))(
    'resolves quick-add for %s',
    (_id, scenario) => {
      const result = resolveQuickAddRetailProduct(
        PROVIDER_RETAIL_POS_CATALOG_FIXTURE,
        scenario.query,
      );
      expect(result.status).toBe(scenario.expectedStatus);
      if ('productId' in scenario && scenario.productId) {
        expect(result).toMatchObject({
          product: { id: scenario.productId },
        });
      }
    },
  );
});

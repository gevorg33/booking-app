import {
  PUBLIC_CUSTOMER_SLUG_READ_SCENARIOS,
  PUBLIC_CUSTOMER_TENANT_MATCH_SCENARIOS,
} from './public-customer-tenant.fixtures.js';
import {
  publicCustomerSessionMatchesBusiness,
  readPublicRouteSlug,
} from './public-customer-tenant.util.js';

describe('public-customer-tenant.util (e2e-bug.218)', () => {
  it.each(PUBLIC_CUSTOMER_SLUG_READ_SCENARIOS)(
    'readPublicRouteSlug $id',
    ({ params, expected }) => {
      expect(readPublicRouteSlug(params)).toBe(expected);
    },
  );

  it.each(PUBLIC_CUSTOMER_TENANT_MATCH_SCENARIOS)(
    'publicCustomerSessionMatchesBusiness $id',
    ({ payloadBusinessId, routeBusinessId, expectMatch }) => {
      expect(
        publicCustomerSessionMatchesBusiness({
          payloadBusinessId,
          routeBusinessId,
        }),
      ).toBe(expectMatch);
    },
  );
});
